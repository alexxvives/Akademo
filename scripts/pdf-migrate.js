#!/usr/bin/env node
/**
 * PDF Migration: SiteGround FTP → AKADEMO
 *
 * For each course in files.csv:
 *   1. Downloads every PDF from SiteGround FTP
 *   2. Uploads it to AKADEMO R2 via POST /storage/upload
 *   3. Creates one lesson per course with all PDFs as documents
 *
 * Progress is saved to scripts/_pdf_progress.json so the script is safe
 * to re-run — already-migrated courses are skipped.
 *
 * ── Prerequisites ────────────────────────────────────────────────────────────
 *   pnpm add -D basic-ftp          (FTP client)
 *   Node 18+ required               (native fetch + FormData)
 *
 * ── Setup ────────────────────────────────────────────────────────────────────
 *   Copy scripts/.env.example → scripts/.env and fill in the values.
 *   The .env file is gitignored.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   node scripts/pdf-migrate.js              # live run
 *   DRY_RUN=1 node scripts/pdf-migrate.js   # dry run (no FTP/API calls)
 *
 * ── Run order in the full migration ─────────────────────────────────────────
 *   1. node scripts/moodle-to-excel.js          → moodle-migration.xlsx
 *   2. Upload moodle-migration.xlsx in Admin → Migración Moodle
 *   3. npx wrangler d1 execute akademo-db --remote --file=scripts/moodle-import/quiz-import.sql
 *   4. node scripts/pdf-migrate.js              ← this script
 */

'use strict';

const ftp  = require('basic-ftp');
const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ── Load .env from scripts/ (never committed) ────────────────────────────────
(function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
})(path.join(__dirname, '.env'));

// ── Config ───────────────────────────────────────────────────────────────────
const FTP_HOST      = process.env.FTP_HOST      || '';
const FTP_USER      = process.env.FTP_USER      || '';
const FTP_PASS      = process.env.FTP_PASS      || '';
const FTP_SECURE    = process.env.FTP_SECURE    === '1';   // set to 1 for FTPS
const AKADEMO_TOKEN = process.env.AKADEMO_TOKEN || '';
const ACADEMY_ID    = process.env.AKADEMO_ACADEMY_ID || '';
const API_BASE      = process.env.AKADEMO_API_URL || 'https://akademo-api.alexxvives.workers.dev';
const DRY_RUN       = process.env.DRY_RUN === '1';

// SiteGround path where Moodle stores its files
const FTP_BASE_PATH = '/home/customer/www/maximoexponente.es/campus/moodledata/filedir';

// ── Paths ────────────────────────────────────────────────────────────────────
const FILES_CSV      = path.join(__dirname, 'moodle-import', 'files.csv');
const TEMP_DIR       = path.join(__dirname, '_pdf_tmp');
const PROGRESS_FILE  = path.join(__dirname, '_pdf_progress.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseFilesCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const wb = XLSX.read(content, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

/** Fetch all classes for our academy from AKADEMO admin API.
 *  Returns Map<lowercaseName, classId>
 *
 *  NOTE: /admin/classes filters WHERE paymentStatus = 'PAID'.
 *  Make sure the target academy is marked PAID in the admin panel first.
 *  Or set AKADEMO_CLASS_MAP in .env as a JSON override:
 *    AKADEMO_CLASS_MAP={"biofarmacia":"cls_abc123","farmacología":"cls_def456"}
 */
async function fetchClassMap() {
  // Manual override takes precedence
  if (process.env.AKADEMO_CLASS_MAP) {
    const raw = JSON.parse(process.env.AKADEMO_CLASS_MAP);
    return new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase().trim(), v]));
  }

  const res = await fetch(`${API_BASE}/admin/classes`, {
    headers: { 'Authorization': `Bearer ${AKADEMO_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`GET /admin/classes failed: HTTP ${res.status} — is AKADEMO_TOKEN valid and admin?`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(`GET /admin/classes error: ${JSON.stringify(data)}`);

  const map = new Map();
  let matched = 0;
  for (const cls of data.data) {
    if (cls.academyId === ACADEMY_ID) {
      map.set(cls.name.toLowerCase().trim(), cls.id);
      matched++;
    }
  }
  if (matched === 0) {
    console.warn('⚠  No classes found for AKADEMO_ACADEMY_ID in /admin/classes.');
    console.warn('   Ensure the academy paymentStatus = PAID, or set AKADEMO_CLASS_MAP in .env');
  }
  return map;
}

/** Upload a local PDF file to AKADEMO R2 storage.
 *  Returns { path, fileName, fileSize } from the API response.
 */
async function uploadToAkademo(localFilePath, filename) {
  const fileBuffer = fs.readFileSync(localFilePath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('type', 'document');

  const res = await fetch(`${API_BASE}/storage/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AKADEMO_TOKEN}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Upload HTTP ${res.status}: ${body}`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(`Upload API error: ${data.error || JSON.stringify(data)}`);
  // API returns { uploadId, path, fileName, fileSize, message }
  return data.data;
}

/** Create a lesson in a class with pre-uploaded document list.
 *  documents: Array<{ storagePath, fileName, fileSize, mimeType, title }>
 */
async function createLesson(classId, title, documents) {
  const res = await fetch(`${API_BASE}/lessons/create-with-uploaded`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AKADEMO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      classId,
      title,
      releaseDate: new Date().toISOString(),
      videos: [],
      documents,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Create lesson HTTP ${res.status}: ${body}`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(`Create lesson API error: ${data.error || JSON.stringify(data)}`);
  return data.data;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Validate config
  if (!DRY_RUN) {
    const missing = [];
    if (!FTP_HOST)      missing.push('FTP_HOST');
    if (!FTP_USER)      missing.push('FTP_USER');
    if (!FTP_PASS)      missing.push('FTP_PASS');
    if (!AKADEMO_TOKEN) missing.push('AKADEMO_TOKEN');
    if (!ACADEMY_ID)    missing.push('AKADEMO_ACADEMY_ID');
    if (missing.length) {
      console.error('Missing required env vars:', missing.join(', '));
      console.error('Create scripts/.env (see scripts/.env.example)');
      process.exit(1);
    }
  }

  if (DRY_RUN) console.log('🧪 DRY RUN — no FTP downloads or API calls will be made\n');

  // Create temp directory for downloads
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Load progress file (allows resuming after failure)
  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Loaded progress: ${Object.keys(progress).length} courses already done`);
  }

  // Parse files.csv
  if (!fs.existsSync(FILES_CSV)) {
    console.error(`files.csv not found at: ${FILES_CSV}`);
    process.exit(1);
  }
  const rows = parseFilesCsv(FILES_CSV);
  console.log(`Loaded ${rows.length} entries from files.csv`);

  // Group files by course, deduplicate by file_path (same hash = same physical file)
  // Map<courseName, Map<filePath, { title, filename, filesize, filePath }>>
  const courses = new Map();
  for (const row of rows) {
    const courseName = String(row.course_name || '').trim();
    const filePath   = String(row.file_path   || '').trim();
    const filename   = String(row.filename    || '').trim();
    if (!courseName || !filePath || !filename.endsWith('.pdf')) continue;

    if (!courses.has(courseName)) courses.set(courseName, new Map());
    const fileMap = courses.get(courseName);
    // Deduplicate by file_path — keep first occurrence
    if (!fileMap.has(filePath)) {
      fileMap.set(filePath, {
        title:    String(row.file_title || row.filename || 'Documento').trim(),
        filename,
        filesize: parseInt(String(row.filesize || '0'), 10),
        filePath,
      });
    }
  }
  console.log(`Found ${courses.size} unique courses with PDFs\n`);

  // Fetch class name → ID map
  console.log('Fetching class list from AKADEMO...');
  const classMap = DRY_RUN
    ? new Map([...courses.keys()].map(n => [n.toLowerCase(), `dry-run-${n}`]))
    : await fetchClassMap();
  console.log(`Found ${classMap.size} matching classes\n`);

  // Connect to FTP
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false; // set true to debug FTP commands

  if (!DRY_RUN) {
    console.log(`Connecting to FTP ${FTP_HOST}...`);
    await ftpClient.access({
      host:     FTP_HOST,
      user:     FTP_USER,
      password: FTP_PASS,
      secure:   FTP_SECURE,
    });
    console.log('FTP connected.\n');
  }

  let totalUploaded = 0;
  let totalSkipped  = 0;
  let totalErrors   = 0;

  try {
    for (const [courseName, fileMap] of courses) {
      const classId = classMap.get(courseName.toLowerCase().trim());
      if (!classId) {
        console.warn(`⚠  "${courseName}" — no matching class in AKADEMO (skipping ${fileMap.size} files)`);
        totalSkipped += fileMap.size;
        continue;
      }

      if (progress[courseName]) {
        console.log(`✓  "${courseName}" — already migrated (${progress[courseName].files} files, lesson ${progress[courseName].lessonId})`);
        totalSkipped += fileMap.size;
        continue;
      }

      console.log(`\n📚 "${courseName}" (${fileMap.size} files)`);

      const lessonDocuments = [];

      for (const { title, filename, filesize, filePath } of fileMap.values()) {
        const remotePath = `${FTP_BASE_PATH}/${filePath}`;
        // Use the last path segment as local filename to avoid collisions
        const localPath = path.join(TEMP_DIR, `${path.basename(filePath)}.pdf`);

        try {
          // Step 1 — Download from FTP
          if (!DRY_RUN && !fs.existsSync(localPath)) {
            process.stdout.write(`   ↓ ${filename} ... `);
            await ftpClient.downloadTo(localPath, remotePath);
            console.log('done');
          } else if (DRY_RUN) {
            console.log(`   [skip] ${filename} (dry run)`);
          }

          // Step 2 — Upload to AKADEMO R2
          if (!DRY_RUN) {
            process.stdout.write(`   ↑ uploading ${filename} ... `);
            const uploaded = await uploadToAkademo(localPath, filename);
            console.log('done');
            lessonDocuments.push({
              storagePath: uploaded.path,   // API returns "path" field
              fileName:    filename,
              fileSize:    filesize,
              mimeType:    'application/pdf',
              title,
            });
            // Clean up temp file immediately after upload
            fs.unlinkSync(localPath);
          } else {
            lessonDocuments.push({
              storagePath: `dry-run/${filePath}`,
              fileName:    filename,
              fileSize:    filesize,
              mimeType:    'application/pdf',
              title,
            });
          }

          totalUploaded++;
        } catch (err) {
          console.error(`   ✗ ${filename}: ${err.message}`);
          totalErrors++;
          // Clean up partial download
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        }
      }

      // Step 3 — Create lesson with all collected PDFs
      if (lessonDocuments.length === 0) {
        console.log(`   ⚠  No documents uploaded for "${courseName}" — skipping lesson creation`);
        continue;
      }

      const lessonTitle = `Material — ${courseName}`;
      process.stdout.write(`   📝 Creating lesson "${lessonTitle}" with ${lessonDocuments.length} docs ... `);

      if (!DRY_RUN) {
        try {
          const lesson = await createLesson(classId, lessonTitle, lessonDocuments);
          console.log(`done (id: ${lesson.id})`);
          progress[courseName] = {
            lessonId: lesson.id,
            files:    lessonDocuments.length,
            at:       new Date().toISOString(),
          };
          fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        } catch (err) {
          console.error(`\n   ✗ Create lesson failed: ${err.message}`);
          totalErrors++;
        }
      } else {
        console.log(`[dry run] would create lesson with ${lessonDocuments.length} docs`);
      }
    }
  } finally {
    if (!DRY_RUN) ftpClient.close();
    // Clean up temp dir (any leftover files from failed downloads)
    if (fs.existsSync(TEMP_DIR) && fs.readdirSync(TEMP_DIR).length === 0) {
      fs.rmdirSync(TEMP_DIR);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅ Uploaded : ${totalUploaded} files`);
  console.log(`⏭  Skipped  : ${totalSkipped} files`);
  console.log(`✗  Errors   : ${totalErrors} files`);
  if (DRY_RUN) console.log('\n(Dry run — no changes were made)');
  if (totalErrors > 0) console.log('\nRe-run the script to retry failed files.');
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
