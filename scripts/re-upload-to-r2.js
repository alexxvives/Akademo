#!/usr/bin/env node
/**
 * Re-uploads Moodle files to R2 using the existing ftp-progress.json.
 *
 * This script is safe to run when the ftp-progress.json already has all
 * uploadIds and r2Keys recorded (DB is correct) but the actual R2 objects
 * are missing. It does NOT touch the database.
 *
 * Usage (PowerShell):
 *   $env:FTP_HOST="ftp.maximoexponente.es"
 *   $env:FTP_USER="akademo@maximoexponente.es"
 *   $env:FTP_PASS="<password>"
 *   $env:R2_ACCESS_KEY_ID="<key>"
 *   $env:R2_SECRET_ACCESS_KEY="<secret>"
 *   node scripts/re-upload-to-r2.js
 */

const ftp    = require('basic-ftp');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs     = require('fs');
const path   = require('path');

// ── Load scripts/.env ─────────────────────────────────────────────────────────
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const FTP_HOST      = process.env.FTP_HOST      || 'ftp.maximoexponente.es';
const FTP_USER      = process.env.FTP_USER      || 'akademo@maximoexponente.es';
const FTP_PASS      = process.env.FTP_PASS      || '';
const R2_KEY_ID     = process.env.R2_ACCESS_KEY_ID     || '';
const R2_SECRET     = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET     = process.env.R2_BUCKET     || 'akademo-storage';
const CF_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '53808754f4bd94365d6e31351aa426c0';

const PROGRESS_JSON = path.join(__dirname, '..', 'docs', 'onboarding', 'maximoexponente', 'ftp-progress.json');

const MOODLE_DATA_CANDIDATES = [
  'campus.maximoexponente.es/moodledata/filedir',
  'campus.maximoexponente.es/public_html/moodledata/filedir',
  'maximoexponente.es/moodledata/filedir',
  'maximoexponente.es/public_html/moodledata/filedir',
  'moodledata/filedir',
  'public_html/moodledata/filedir',
];

async function findMoodleDataDir(client) {
  for (const candidate of MOODLE_DATA_CANDIDATES) {
    try {
      const list = await client.list(candidate);
      if (list.length > 0) {
        console.log(`✅  Found moodledata at: ${candidate}`);
        return candidate;
      }
    } catch { /* try next */ }
  }
  throw new Error('Could not locate moodledata/filedir on FTP server.');
}

async function downloadToBuffer(client, remotePath) {
  const chunks = [];
  const writable = new (require('stream').Writable)({
    write(chunk, _enc, cb) { chunks.push(chunk); cb(); }
  });
  await client.downloadTo(writable, remotePath);
  return Buffer.concat(chunks);
}

async function existsInR2(s3, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (e) {
    if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}

async function main() {
  if (!FTP_PASS)             { console.error('❌  FTP_PASS required');              process.exit(1); }
  if (!R2_KEY_ID || !R2_SECRET) { console.error('❌  R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY required'); process.exit(1); }

  if (!fs.existsSync(PROGRESS_JSON)) {
    console.error('❌  ftp-progress.json not found. Run ftp-to-r2.js first.');
    process.exit(1);
  }

  const progress = JSON.parse(fs.readFileSync(PROGRESS_JSON, 'utf8'));
  const entries  = Object.entries(progress); // [filePath, { r2Key, uploadId, filename, contentType }]
  console.log(`📄  Loaded ${entries.length} entries from ftp-progress.json`);

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_KEY_ID, secretAccessKey: R2_SECRET },
  });

  // Pre-check: count how many are missing from R2
  console.log('🔍  Checking which files are missing from R2...');
  const missing = [];
  let checked = 0;
  for (const [filePath, info] of entries) {
    if (!await existsInR2(s3, info.r2Key)) {
      missing.push([filePath, info]);
    }
    checked++;
    if (checked % 50 === 0) process.stdout.write(`\r    Checked ${checked}/${entries.length}...`);
  }
  console.log(`\n    ${missing.length} files missing from R2, ${entries.length - missing.length} already present`);

  if (missing.length === 0) {
    console.log('✅  All files already in R2. Nothing to do.');
    return;
  }

  // Upload missing files via FTP
  const client = new ftp.Client();
  client.ftp.verbose = false;
  let done = 0, errors = 0;

  try {
    await client.access({ host: FTP_HOST, port: 21, user: FTP_USER, password: FTP_PASS, secure: false });
    console.log('🔌  FTP connected');

    const moodleDir = await findMoodleDataDir(client);

    for (const [filePath, info] of missing) {
      const remotePath = `${moodleDir}/${filePath}`;
      try {
        const buffer = await downloadToBuffer(client, remotePath);
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: info.r2Key,
          Body: buffer,
          ContentType: info.contentType || 'application/octet-stream',
        }));
        done++;
        process.stdout.write(`\r    Uploaded ${done}/${missing.length} (${errors} errors)`);
      } catch (err) {
        console.error(`\n❌  Failed ${remotePath}: ${err.message}`);
        errors++;
      }
    }
    console.log(`\n✅  Re-upload complete: ${done} uploaded, ${errors} errors`);
  } finally {
    client.close();
  }

  if (errors > 0) {
    console.error(`⚠️  ${errors} files failed to upload. Re-run this script to retry.`);
    process.exit(1);
  }
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
