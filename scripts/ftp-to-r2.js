#!/usr/bin/env node
/**
 * Moodle FTP → Cloudflare R2 document migration
 *
 * Reads  : scripts/moodle-import/files.csv
 * Does   : FTP-download every unique file from moodledata/filedir/,
 *          uploads to R2, then generates import-documents.sql which
 *          creates Topic / Lesson / Upload / Document rows linked to
 *          the already-imported Class records.
 *
 * Usage (PowerShell):
 *   $env:FTP_HOST="ftp.maximoexponente.es"
 *   $env:FTP_USER="akademo@maximoexponente.es"
 *   $env:FTP_PASS="@Alex1z2x"
 *   $env:R2_ACCESS_KEY_ID="<your-key>"
 *   $env:R2_SECRET_ACCESS_KEY="<your-secret>"
 *   node scripts/ftp-to-r2.js
 *
 * R2 credentials: Cloudflare Dashboard → R2 → Manage R2 API Tokens
 *   → Create token with Object Read & Write on bucket "akademo-storage"
 */

const ftp   = require('basic-ftp');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const XLSX  = require('xlsx');
const fs    = require('fs');
const path  = require('path');
const crypto = require('crypto');

// ── Load .env (scripts/.env) ─────────────────────────────────────────────────
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

// ── Config ───────────────────────────────────────────────────────────────────
const FTP_HOST      = process.env.FTP_HOST      || 'ftp.maximoexponente.es';
const FTP_USER      = process.env.FTP_USER      || 'akademo@maximoexponente.es';
const FTP_PASS      = process.env.FTP_PASS      || '';
const R2_KEY_ID     = process.env.R2_ACCESS_KEY_ID     || '';
const R2_SECRET     = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET     = process.env.R2_BUCKET     || 'akademo-storage';
const CF_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '53808754f4bd94365d6e31351aa426c0';

const ACADEMY_ID    = '93ab97cf-271b-48de-924b-10fb7eab0a38';
const OWNER_ID      = '3d26da5d-c5b6-4c49-ae62-d4687c44cfd7'; // academy owner user

const FILES_CSV     = path.join(__dirname, '..', 'docs', 'onboarding', 'maximoexponente', 'files.csv');
const OUT_SQL       = path.join(__dirname, '..', 'docs', 'onboarding', 'maximoexponente', 'import-documents.sql');
const OUT_MANIFEST  = path.join(__dirname, '..', 'docs', 'onboarding', 'maximoexponente', 'documents-manifest.json');
const PROGRESS_JSON = path.join(__dirname, '..', 'docs', 'onboarding', 'maximoexponente', 'ftp-progress.json');

// Candidate moodledata paths to try in order
const MOODLE_DATA_CANDIDATES = [
  'campus.maximoexponente.es/moodledata/filedir',
  'campus.maximoexponente.es/public_html/moodledata/filedir',
  'maximoexponente.es/moodledata/filedir',
  'maximoexponente.es/public_html/moodledata/filedir',
  'moodledata/filedir',
  'public_html/moodledata/filedir',
  'www/moodledata/filedir',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function uuid() {
  return crypto.randomUUID();
}

function slugify(name) {
  return name.trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function mimeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
}

function sqlStr(s) {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_JSON)) {
    return JSON.parse(fs.readFileSync(PROGRESS_JSON, 'utf8'));
  }
  return {}; // filePath → { r2Key, uploadId }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_JSON, JSON.stringify(progress, null, 2));
}

// ── Parse CSV ─────────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const wb = XLSX.read(content, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ── FTP: find moodledata directory ───────────────────────────────────────────
async function findMoodleDataDir(client) {
  for (const candidate of MOODLE_DATA_CANDIDATES) {
    try {
      const list = await client.list(candidate);
      if (list.length > 0) {
        console.log(`✅  Found moodledata at: ${candidate}`);
        return candidate;
      }
    } catch {
      // not found, try next
    }
  }
  // Last resort: print root + campus listing to help diagnose
  console.log('⚠️  Could not find moodledata. Root listing:');
  const root = await client.list('/');
  root.forEach(e => console.log('  ', e.type === 2 ? '[dir]' : '[file]', e.name));
  try {
    console.log('\n  campus.maximoexponente.es listing:');
    const campus = await client.list('campus.maximoexponente.es');
    campus.forEach(e => console.log('  ', e.type === 2 ? '[dir]' : '[file]', e.name));
  } catch {}
  throw new Error('Could not locate moodledata/filedir on FTP server. See root listing above.');
}

// ── FTP: download file to Buffer ─────────────────────────────────────────────
async function downloadToBuffer(client, remotePath) {
  const chunks = [];
  const writable = new (require('stream').Writable)({
    write(chunk, _enc, cb) { chunks.push(chunk); cb(); }
  });
  await client.downloadTo(writable, remotePath);
  return Buffer.concat(chunks);
}

// ── R2 upload ─────────────────────────────────────────────────────────────────
async function uploadToR2(s3, key, buffer, contentType) {
  // Check if already uploaded (idempotent)
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return; // already exists
  } catch (e) {
    if (e.name !== 'NotFound' && e.$metadata?.httpStatusCode !== 404) throw e;
  }
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!FTP_PASS) { console.error('❌  FTP_PASS env var required'); process.exit(1); }
  if (!R2_KEY_ID || !R2_SECRET) {
    console.error('❌  R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY env vars required');
    console.error('    → Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create Token');
    process.exit(1);
  }

  // ── Load files.csv ──
  console.log('📄  Reading files.csv...');
  const rows = parseCSV(FILES_CSV);
  console.log(`    ${rows.length} rows loaded`);

  // Deduplicate by file_path — same contenthash = same file
  const byPath = new Map(); // file_path → { file_title, course_name, filename, filesize, file_path }
  for (const row of rows) {
    const fp = (row.file_path || '').trim();
    if (!fp) continue;
    if (!byPath.has(fp)) byPath.set(fp, row);
  }
  console.log(`    ${byPath.size} unique files (after deduplication)`);

  // ── R2 client ──
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_KEY_ID, secretAccessKey: R2_SECRET },
  });

  // ── FTP client ──
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const progress = loadProgress();

  try {
    await client.access({
      host:     FTP_HOST,
      port:     21,
      user:     FTP_USER,
      password: FTP_PASS,
      secure:   false,
    });
    console.log('🔌  FTP connected');

    const moodleDir = await findMoodleDataDir(client);

    let done = 0, skipped = 0, errors = 0;
    const total = byPath.size;

    for (const [filePath, row] of byPath) {
      const filename    = (row.filename || '').trim();
      const filesize    = parseInt(row.filesize, 10) || 0;
      const contentType = mimeFromFilename(filename);
      const r2Key       = `maximo-exponente/documents/${filePath}`; // keeps hash path → no duplicates

      // Already done in a previous run?
      if (progress[filePath]) {
        skipped++;
        continue;
      }

      const remotePath = `${moodleDir}/${filePath}`;
      try {
        const buffer = await downloadToBuffer(client, remotePath);
        await uploadToR2(s3, r2Key, buffer, contentType);

        const uploadId = uuid();
        progress[filePath] = { r2Key, uploadId, filename, filesize: buffer.length, contentType };
        saveProgress(progress);
        done++;

        if (done % 10 === 0 || done === total) {
          process.stdout.write(`\r    Progress: ${done + skipped}/${total} (${errors} errors)`);
        }
      } catch (err) {
        console.error(`\n❌  Failed ${remotePath}: ${err.message}`);
        errors++;
      }
    }
    console.log(`\n✅  Upload complete: ${done} new, ${skipped} already done, ${errors} errors`);

  } finally {
    client.close();
  }

  // ── Generate SQL ─────────────────────────────────────────────────────────────
  console.log('📝  Generating import-documents.sql...');

  // Group rows by course → section → file_title
  // course_name → Map<section_number, { sectionName, files: Map<file_title → [rows]> }>
  const byCourse = new Map();
  for (const row of rows) {
    const course      = (row.course_name    || '').trim();
    const title       = (row.file_title     || '').trim();
    const fp          = (row.file_path      || '').trim();
    const secNum      = parseInt(row.section_number, 10) || 0;
    const secName     = (row.section_name   || '').trim() || `Tema ${secNum}`;
    if (!course || !title || !fp) continue;
    if (!byCourse.has(course)) byCourse.set(course, new Map());
    const bySec = byCourse.get(course);
    if (!bySec.has(secNum)) bySec.set(secNum, { sectionName: secName, files: new Map() });
    const sec = bySec.get(secNum);
    if (!sec.files.has(title)) sec.files.set(title, []);
    sec.files.get(title).push(row);
  }

  // Helper: convert a Moodle unix timestamp to a SQLite datetime literal.
  // Falls back to datetime('now') if no timestamp is available (old CSV without file_timestamp col).
  function moodleDatetime(ts) {
    const n = parseInt(ts, 10);
    if (!n || n <= 0) return "datetime('now')";
    return `datetime(${n}, 'unixepoch')`;
  }

  const lines = [];
  lines.push('-- ============================================================');
  lines.push('-- Import Moodle documents into AKADEMO');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- Requires: Classes already imported via Excel migration');
  lines.push('-- ============================================================');
  lines.push('');

  for (const [courseName, bySec] of byCourse) {
    lines.push(`-- ── Course: ${courseName} ──────────────────────────────────`);

    // Sort sections by section number
    const sortedSections = [...bySec.entries()].sort(([a], [b]) => a - b);

    for (const [secNum, { sectionName, files: byTitle }] of sortedSections) {
      // Earliest file timestamp in this section (for Topic/Lesson createdAt)
      let sectionTs = 0;
      for (const fileRows of byTitle.values()) {
        for (const r of fileRows) {
          const t = parseInt(r.file_timestamp, 10) || 0;
          if (t > 0 && (sectionTs === 0 || t < sectionTs)) sectionTs = t;
        }
      }
      const topicCreatedAt = moodleDatetime(sectionTs);

      const topicId = uuid();
      lines.push(`-- Section ${secNum}: ${sectionName}`);
      lines.push(`INSERT INTO Topic (id, classId, name, orderIndex, createdAt)`);
      lines.push(`SELECT ${sqlStr(topicId)}, id, ${sqlStr(sectionName)}, ${secNum + 1}, ${topicCreatedAt}`);
      lines.push(`FROM Class WHERE name = ${sqlStr(courseName)} AND academyId = ${sqlStr(ACADEMY_ID)};`);
      lines.push('');

      let lessonPos = 1;
      for (const [fileTitle, fileRows] of byTitle) {
        // Earliest timestamp for this lesson
        let lessonTs = 0;
        for (const r of fileRows) {
          const t = parseInt(r.file_timestamp, 10) || 0;
          if (t > 0 && (lessonTs === 0 || t < lessonTs)) lessonTs = t;
        }
        const lessonCreatedAt = moodleDatetime(lessonTs);

        const lessonId = uuid();
        lines.push(`INSERT INTO Lesson (id, topicId, classId, title, createdAt, releaseDate)`);
        lines.push(`SELECT ${sqlStr(lessonId)}, ${sqlStr(topicId)}, classId, ${sqlStr(fileTitle)}, ${lessonCreatedAt}, ${lessonCreatedAt}`);
        lines.push(`FROM Topic WHERE id = ${sqlStr(topicId)};`);
        lines.push('');

        // Deduplicate files within this title group (same file_path appears multiple times)
        const seenPaths = new Set();
        for (const row of fileRows) {
          const fp = (row.file_path || '').trim();
          if (seenPaths.has(fp)) continue;
          seenPaths.add(fp);

          const info = progress[fp];
          if (!info) {
            lines.push(`-- ⚠️  SKIPPED (upload failed): ${fp}`);
            continue;
          }

          const fileTs = moodleDatetime(row.file_timestamp);
          const uploadId   = info.uploadId;
          const filename   = info.filename || row.filename || 'document';
          const filesize   = info.filesize  || parseInt(row.filesize, 10) || 0;
          const contentType = info.contentType || mimeFromFilename(filename);
          const r2Key      = info.r2Key;

          lines.push(`INSERT OR IGNORE INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, storageType, createdAt)`);
          lines.push(`VALUES (${sqlStr(uploadId)}, ${sqlStr(filename)}, ${filesize}, ${sqlStr(contentType)}, ${sqlStr(r2Key)}, ${sqlStr(OWNER_ID)}, 'r2', ${fileTs});`);
          lines.push('');

          const docId = uuid();
          lines.push(`INSERT INTO Document (id, title, lessonId, uploadId, createdAt)`);
          lines.push(`VALUES (${sqlStr(docId)}, ${sqlStr(fileTitle)}, ${sqlStr(lessonId)}, ${sqlStr(uploadId)}, ${fileTs});`);
          lines.push('');
        }
        lessonPos++;
      }
    }
  }

  fs.writeFileSync(OUT_SQL, lines.join('\n'), 'utf8');
  console.log(`✅  SQL written to ${OUT_SQL}`);

  // ── Generate documents-manifest.json (used by the Migration UI to import documents) ──
  const manifest = [];
  for (const [courseName, bySec] of byCourse) {
    for (const [, { files: byTitle }] of bySec) {
      for (const [fileTitle, fileRows] of byTitle) {
        const seenPaths = new Set();
        for (const row of fileRows) {
          const fp = (row.file_path || '').trim();
          if (seenPaths.has(fp)) continue;
          seenPaths.add(fp);
          const info = progress[fp];
          if (!info) continue;
          manifest.push({
            fileTitle,
            courseName,
            filename:    info.filename    || row.filename || 'document',
            filesize:    info.filesize    || parseInt(row.filesize, 10) || 0,
            contentType: info.contentType || mimeFromFilename(info.filename || row.filename || ''),
            r2Key:       info.r2Key,
            uploadId:    info.uploadId,
          });
        }
      }
    }
  }
  fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`✅  Manifest written to ${OUT_MANIFEST} (${manifest.length} documents)`);

  // ── Apply import-documents.sql to the remote DB ───────────────────────────
  console.log('');
  console.log('🗄️   Applying import-documents.sql to D1 remote database...');
  const { execSync } = require('child_process');
  try {
    execSync(
      `npx wrangler d1 execute akademo-db --remote --file="${OUT_SQL}"`,
      { stdio: 'inherit', cwd: path.join(__dirname, '..') }
    );
    console.log('✅  import-documents.sql applied successfully.');
    console.log('    Documents are now visible in Mediateca → Documentos.');
  } catch (execErr) {
    console.error('❌  Failed to apply import-documents.sql automatically.');
    console.error('    Run manually: npx wrangler d1 execute akademo-db --remote --file=docs/onboarding/maximoexponente/import-documents.sql');
  }
  console.log('');
  console.log('Migration complete. Verify in AKADEMO → Mediateca → Documentos.');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
