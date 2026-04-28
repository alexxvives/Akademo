#!/usr/bin/env node
/**
 * Fixes incorrect application/octet-stream MIME types for files already in R2 + D1.
 *
 * For each file in ftp-progress.json with a wrong MIME:
 *  1. Re-uploads the file to R2 with the correct Content-Type
 *  2. Prints UPDATE SQL to fix the Upload table in D1
 *
 * Run after reviewing the printed SQL — apply it manually via wrangler.
 */

const ftp  = require('basic-ftp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs   = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

// ── Update these per client ─────────────────────────────────────────────────
const CLIENT_SLUG   = 'client-slug'; // e.g. 'maximo-exponente'
const FTP_HOST      = process.env.FTP_HOST      || '';
const FTP_USER      = process.env.FTP_USER      || '';
const FTP_PASS      = process.env.FTP_PASS      || '';
const R2_KEY_ID     = process.env.R2_ACCESS_KEY_ID     || '';
const R2_SECRET     = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET     = process.env.R2_BUCKET     || 'akademo-storage';
const CF_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '53808754f4bd94365d6e31351aa426c0';

const PROGRESS_JSON = path.join(__dirname, '..', 'docs', 'onboarding', CLIENT_SLUG, 'ftp-progress.json');

const MOODLE_DATA_CANDIDATES = [
  // Update this list with the client's domain and moodledata path variants
  `${CLIENT_SLUG}/moodledata/filedir`,
  `${CLIENT_SLUG}/public_html/moodledata/filedir`,
];

function correctMime(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jfif': 'image/jpeg',
    '.gif':  'image/gif',
    '.ppt':  'application/vnd.ms-powerpoint',
  };
  return map[ext] || null; // null = no correction needed / not fixable
}

async function findMoodleDataDir(client) {
  for (const candidate of MOODLE_DATA_CANDIDATES) {
    try {
      const list = await client.list(candidate);
      if (list.length > 0) return candidate;
    } catch { /* try next */ }
  }
  throw new Error('Cannot locate moodledata/filedir');
}

async function downloadToBuffer(client, remotePath) {
  const chunks = [];
  const w = new (require('stream').Writable)({ write(c, _, cb) { chunks.push(c); cb(); } });
  await client.downloadTo(w, remotePath);
  return Buffer.concat(chunks);
}

async function main() {
  if (!FTP_PASS || !R2_KEY_ID || !R2_SECRET) {
    console.error('❌  FTP_PASS, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY required');
    process.exit(1);
  }

  const progress = JSON.parse(fs.readFileSync(PROGRESS_JSON, 'utf8'));

  // Find entries that need MIME correction
  const toFix = Object.entries(progress).filter(([, info]) => {
    if (info.contentType !== 'application/octet-stream') return false;
    return correctMime(info.filename) !== null;
  });

  console.log(`🔍  Found ${toFix.length} files with fixable MIME types:`);
  toFix.forEach(([, info]) => console.log(`    ${info.filename}  →  ${correctMime(info.filename)}`));

  if (toFix.length === 0) { console.log('✅  Nothing to fix.'); return; }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_KEY_ID, secretAccessKey: R2_SECRET },
  });

  const client = new ftp.Client();
  client.ftp.verbose = false;
  const sqlLines = ['-- Run this to fix MIME types in D1:'];

  try {
    await client.access({ host: FTP_HOST, port: 21, user: FTP_USER, password: FTP_PASS, secure: false });
    const moodleDir = await findMoodleDataDir(client);
    console.log(`🔌  FTP → ${moodleDir}`);

    let done = 0, errors = 0;
    for (const [filePath, info] of toFix) {
      const newMime = correctMime(info.filename);
      const remotePath = `${moodleDir}/${filePath}`;
      try {
        const buffer = await downloadToBuffer(client, remotePath);
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: info.r2Key,
          Body: buffer,
          ContentType: newMime,
        }));

        // Update in-memory progress
        progress[filePath].contentType = newMime;
        done++;
        console.log(`    ✅  ${info.filename}`);

        sqlLines.push(`UPDATE Upload SET mimeType = '${newMime}' WHERE id = '${info.uploadId}';`);
      } catch (err) {
        console.error(`    ❌  ${info.filename}: ${err.message}`);
        errors++;
      }
    }

    // Save corrected progress
    fs.writeFileSync(PROGRESS_JSON, JSON.stringify(progress, null, 2));
    console.log(`\n✅  Re-uploaded ${done}/${toFix.length} (${errors} errors)`);
  } finally {
    client.close();
  }

  // Write SQL file
  const sqlPath = path.join(__dirname, '..', 'docs', 'onboarding', CLIENT_SLUG, 'fix-mime-types.sql');
  fs.writeFileSync(sqlPath, sqlLines.join('\n') + '\n');
  console.log(`\n📝  SQL written to ${sqlPath}`);
  console.log('    Apply with:');
  console.log(`    npx wrangler d1 execute akademo-db --remote --file=docs/onboarding/${CLIENT_SLUG}/fix-mime-types.sql`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
