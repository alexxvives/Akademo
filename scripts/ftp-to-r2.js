#!/usr/bin/env node
/**
 * ftp-to-r2.js
 *
 * Downloads Moodle files from an FTP server and uploads them to Cloudflare R2.
 * Generates documents-manifest.json consumed by the AKADEMO bulk-import endpoint.
 *
 * Prerequisites:
 *   npm install --save-dev basic-ftp @aws-sdk/client-s3 dotenv
 *
 * Configuration (scripts/.env):
 *   FTP_HOST, FTP_USER, FTP_PASS, FTP_SECURE (0|1)
 *   FTP_MOODLE_DATA_PATH  (default: auto-detected, e.g. /public_html/moodledata)
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *
 * Usage:
 *   node scripts/ftp-to-r2.js [--client maximo-expo] [--dry-run]
 *
 * The script is resumable: progress is saved to ftp-progress.json and already-
 * uploaded files are skipped on re-run.
 */

const path = require('path');
const fs   = require('fs');

// Load .env from scripts/ directory
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const ftp = require('basic-ftp');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// ── Config ──────────────────────────────────────────────────────────────────

const CLIENT_SLUG = process.argv.includes('--client')
  ? process.argv[process.argv.indexOf('--client') + 1]
  : 'maximo-expo';

const DRY_RUN      = process.argv.includes('--dry-run');
const REGEN_MANIFEST = process.argv.includes('--regen-manifest');

const FILES_CSV  = path.join(__dirname, '..', 'docs', 'onboarding', CLIENT_SLUG, 'files', 'files.csv');
const PROGRESS   = path.join(__dirname, '..', 'docs', 'onboarding', CLIENT_SLUG, 'files', 'ftp-progress.json');
const MANIFEST   = path.join(__dirname, '..', 'docs', 'onboarding', CLIENT_SLUG, 'files', 'documents-manifest.json');

const FTP_HOST   = process.env.FTP_HOST;
const FTP_USER   = process.env.FTP_USER;
const FTP_PASS   = process.env.FTP_PASS;
const FTP_SECURE = process.env.FTP_SECURE === '1';
// Override if needed — script will auto-detect if blank
const FTP_MOODLE_DATA_PATH = process.env.FTP_MOODLE_DATA_PATH || '';

const R2_ACCOUNT_ID    = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET        = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET        = process.env.R2_BUCKET || 'akademo-storage';
const R2_PREFIX        = CLIENT_SLUG; // e.g. "maximo-expo"

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error('Missing FTP credentials in scripts/.env');
  process.exit(1);
}
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET) {
  console.error('Missing R2 credentials in scripts/.env');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET },
});

// ── CSV parser (no external dependency) ────────────────────────────────────

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const rows = [];
  for (const line of lines) {
    const fields = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        fields.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    rows.push(fields);
  }
  return rows;
}

// ── Determine content-type from extension ──────────────────────────────────

function guessContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = { pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    mp4: 'video/mp4', zip: 'application/zip' };
  return map[ext] || 'application/octet-stream';
}

// ── FTP: auto-detect moodledata directory ──────────────────────────────────

async function findMoodleDataDir(client) {
  if (FTP_MOODLE_DATA_PATH) return FTP_MOODLE_DATA_PATH;

  console.log('Auto-detecting moodledata directory...');
  // Try common SiteGround / cPanel paths
  const candidates = [
    '/moodledata',
    '/public_html/moodledata',
    '/campus.maximoexponente.es/moodledata',
    '/campus.maximoexponente.es/public_html/moodledata',
    '/maximoexponente.es/moodledata',
    '/maximoexponente.es/public_html/moodledata',
    '/home/akademo/moodledata',
    '/home/akademo/public_html/moodledata',
    '/var/www/html/moodledata',
  ];

  for (const candidate of candidates) {
    try {
      await client.cd(candidate + '/filedir');
      console.log(`  Found moodledata at: ${candidate}`);
      return candidate;
    } catch {
      // not found, continue
    }
  }

  // List root to help debugging
  console.log('\nCould not auto-detect moodledata. Listing FTP root:');
  try { await client.cd('/'); } catch {}
  const list = await client.list('/');
  list.forEach(e => console.log(' ', e.type === 2 ? '[DIR]' : '     ', e.name));
  console.error('\nSet FTP_MOODLE_DATA_PATH in scripts/.env to the path of the moodledata folder.');
  process.exit(1);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(FILES_CSV)) {
    console.error(`files.csv not found at ${FILES_CSV}`);
    process.exit(1);
  }

  // Parse CSV
  const raw = fs.readFileSync(FILES_CSV, 'utf-8');
  const rows = parseCsv(raw);
  const [header, ...dataRows] = rows;

  const idx = (name) => header.indexOf(name);
  const cols = {
    fileTitle:     idx('file_title'),
    courseName:    idx('course_name'),
    sectionNumber: idx('section_number'),
    sectionName:   idx('section_name'),
    filename:      idx('filename'),
    filesize:      idx('filesize'),
    filePath:      idx('file_path'),
    fileTimestamp: idx('file_timestamp'),
    visible:       idx('visible'),
  };

  // Check columns exist (file_timestamp is optional for backwards compat)
  for (const [k, v] of Object.entries(cols)) {
    if (k === 'fileTimestamp') continue;
    if (v === -1) { console.error(`Column not found in CSV: ${k}`); process.exit(1); }
  }

  // The CSV is sorted ORDER BY course_name, visible DESC, section_number so:
  // - For R2 upload: one upload per unique filePath (content hash).
  // - For manifest: one entry per (courseName + filePath), keeping the FIRST
  //   occurrence per pair — which is the visible=1 row if one exists.
  //   This means the same hash can appear in multiple courses (all get a manifest
  //   entry) but the same hash won't create two entries for the same course.
  const seenUpload = new Set();   // for R2 dedup (global by hash)
  const uploadFiles = [];          // unique hashes to upload

  // Filename pattern: title is just the raw filename (no meaningful display name)
  const FILENAME_RE = /\.(jpg|jpeg|png|gif|bmp|webp|pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|mp3|zip|rar|7z)\s*$/i;

  // Two-pass manifest building:
  // Pass 1 — collect all CSV rows grouped by (course, filePath)
  const manifestGroups = new Map(); // "course::fp" -> [{fileTitle, sectionNumber, sectionName, filename, filesize, filePath, courseName}]

  for (const row of dataRows) {
    if (!row[cols.filePath]) continue;
    const filePath   = row[cols.filePath].trim();
    const courseName = row[cols.courseName].trim();
    if (!filePath || !courseName) continue;

    // R2 upload dedup: only once per hash regardless of course
    if (!seenUpload.has(filePath)) {
      seenUpload.add(filePath);
      uploadFiles.push(filePath);
    }

    const manifestKey = `${courseName}::${filePath}`;
    if (!manifestGroups.has(manifestKey)) manifestGroups.set(manifestKey, []);
    manifestGroups.get(manifestKey).push({
      fileTitle:     row[cols.fileTitle].trim(),
      courseName,
      sectionNumber: parseInt(row[cols.sectionNumber], 10) || 0,
      sectionName:   row[cols.sectionName].trim(),
      filename:      row[cols.filename].trim(),
      filesize:      parseInt(row[cols.filesize], 10) || 0,
      filePath,
      fileTimestamp: cols.fileTimestamp !== -1 ? parseInt(row[cols.fileTimestamp], 10) || null : null,
    });
  }

  // Pass 2 — resolve each group to one or more manifest entries:
  //  • Prefer real titles over filename-as-title entries.
  //  • If the same file has multiple DISTINCT real titles in the same course,
  //    keep ALL of them (e.g. "NUCLEOLO" and "NUCLEOLO _II" from the same PNG).
  //  • If every entry has a filename-as-title, keep just the first one (fallback).
  const manifestFiles = [];
  for (const entries of manifestGroups.values()) {
    const realTitleEntries = entries.filter(e => !FILENAME_RE.test(e.fileTitle));
    const candidates = realTitleEntries.length > 0 ? realTitleEntries : [entries[0]];
    // Use the latest (max) timestamp in the group
    const maxTimestamp = entries.reduce((m, e) => (e.fileTimestamp && e.fileTimestamp > m ? e.fileTimestamp : m), 0) || null;
    // Deduplicate by normalized title within the group
    const seenTitles = new Set();
    for (const entry of candidates) {
      const norm = entry.fileTitle.toLowerCase().trim();
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        manifestFiles.push({ ...entry, fileTimestamp: maxTimestamp });
      }
    }
  }

  console.log(`Loaded ${uploadFiles.length} unique files to upload, ${manifestFiles.length} manifest entries across all courses`);

  // Load progress
  const progress = fs.existsSync(PROGRESS)
    ? JSON.parse(fs.readFileSync(PROGRESS, 'utf-8'))
    : {};
  const alreadyDone = new Set(Object.keys(progress).filter(k => progress[k] === 'ok'));
  console.log(`Already uploaded: ${alreadyDone.size} files`);

  // For R2 upload loop we only need the unique hashes (not per-course duplicates)
  const todo = uploadFiles.filter(fp => !alreadyDone.has(fp));
  console.log(`To upload: ${todo.length} files${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

  if (DRY_RUN) {
    console.log('Dry run — first 5 files:');
    todo.slice(0, 5).forEach(fp =>
      console.log(`  FTP: moodledata/filedir/${fp}  →  R2: ${R2_PREFIX}/${fp}`)
    );
    return;
  }

  // --regen-manifest: rebuild manifest from CSV + progress, skip FTP upload entirely
  if (REGEN_MANIFEST) {
    console.log('\nRegenerating manifest (no FTP upload)...');
    const manifest = [];
    for (const f of manifestFiles) {
      // Include all entries — if progress exists, only include uploaded files;
      // if no progress info, include everything (assumes files are already in R2).
      if (Object.keys(progress).length > 0 && progress[f.filePath] !== 'ok') continue;
      manifest.push({
        courseName:         f.courseName,
        sectionNumber:      f.sectionNumber,
        sectionName:        f.sectionName,
        fileTitle:          f.fileTitle,
        filename:           f.filename,
        filesize:           f.filesize,
        contentType:        guessContentType(f.filename),
        r2Key:              `${R2_PREFIX}/${f.filePath}`,
        uploadId:           f.filePath.replace(/\//g, ''),
        originalUploadedAt: f.fileTimestamp ? new Date(f.fileTimestamp * 1000).toISOString() : null,
      });
    }
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    console.log(`Wrote ${manifest.length} entries to ${MANIFEST}`);
    return;
  }

  // Connect FTP
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;

  try {
    await ftpClient.access({
      host:     FTP_HOST,
      user:     FTP_USER,
      password: FTP_PASS,
      secure:   FTP_SECURE,
    });
    console.log('FTP connected');

    const moodleDataDir = await findMoodleDataDir(ftpClient);

    let uploaded = 0;
    let failed = 0;
    const tmpFile = path.join(__dirname, '.ftp-tmp');

    // Build a quick lookup: filePath → filename (for display during upload)
    const filenameByPath = new Map(manifestFiles.map(f => [f.filePath, f.filename]));

    for (let i = 0; i < todo.length; i++) {
      const fp      = todo[i];
      const ftpPath = `${moodleDataDir}/filedir/${fp}`;
      const r2Key   = `${R2_PREFIX}/${fp}`;
      const display = filenameByPath.get(fp) || fp;
      process.stdout.write(`[${i + 1}/${todo.length}] ${display} ... `);

      try {
        // Download to temp file
        await ftpClient.downloadTo(tmpFile, ftpPath);
        const fileBuffer = fs.readFileSync(tmpFile);

        // Upload to R2
        await s3.send(new PutObjectCommand({
          Bucket:      R2_BUCKET,
          Key:         r2Key,
          Body:        fileBuffer,
          ContentType: guessContentType(display),
        }));

        progress[fp] = 'ok';
        uploaded++;
        process.stdout.write('ok\n');
      } catch (err) {
        progress[fp] = `error: ${err.message}`;
        failed++;
        process.stdout.write(`FAILED: ${err.message}\n`);

        // Re-connect on FTP timeout
        if (err.message && err.message.includes('timeout')) {
          try {
            await ftpClient.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: FTP_SECURE });
          } catch { /* ignore */ }
        }
      }

      // Save progress every 10 files
      if ((i + 1) % 10 === 0) {
        fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
      }
    }

    // Final progress save
    fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`);

  } finally {
    ftpClient.close();
  }

  // Generate manifest — one entry per (course, section, fileTitle) using manifestFiles
  // which has already been deduped per (courseName, filePath) keeping best section.
  console.log('\nGenerating documents-manifest.json...');
  const manifest = [];
  for (const f of manifestFiles) {
    if (progress[f.filePath] !== 'ok') continue;
    const fullHash = f.filePath.replace(/\//g, '');  // strip slashes → content hash
    manifest.push({
      courseName:          f.courseName,
      sectionNumber:       f.sectionNumber,
      sectionName:         f.sectionName,
      fileTitle:           f.fileTitle,
      filename:            f.filename,
      filesize:            f.filesize,
      contentType:         guessContentType(f.filename),
      r2Key:               `${R2_PREFIX}/${f.filePath}`,
      uploadId:            fullHash,
      originalUploadedAt:  f.fileTimestamp ? new Date(f.fileTimestamp * 1000).toISOString() : null,
    });
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.length} entries to ${MANIFEST}`);

  // ── Auto-import documents into AKADEMO ──────────────────────────────────
  const apiUrl      = (process.env.AKADEMO_API_URL || 'https://akademo-api.alexxvives.workers.dev').replace(/\/$/, '');
  const adminEmail  = process.env.AKADEMO_EMAIL;
  const adminPass   = process.env.AKADEMO_PASSWORD;
  const academyId   = process.env.AKADEMO_ACADEMY_ID;

  if (!adminEmail || !adminPass || !academyId ||
      adminEmail === 'your_admin_email@example.com' || academyId === 'your_academy_id_here') {
    console.log('\nSkipping auto-import: set AKADEMO_EMAIL, AKADEMO_PASSWORD and AKADEMO_ACADEMY_ID in scripts/.env');
    return;
  }

  console.log('\nLogging in to AKADEMO...');
  const loginRes = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPass }),
  });
  if (!loginRes.ok) {
    console.error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    return;
  }
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken || loginData.data?.token || loginData.data?.accessToken;
  if (!token) {
    console.error('Login response did not include a token:', JSON.stringify(loginData));
    return;
  }
  console.log('Logged in. Importing documents...');

  // Warm up the Worker before the big request
  await fetch(`${apiUrl}/`, { method: 'GET' }).catch(() => {});

  const importRes = await fetch(`${apiUrl}/admin/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      academyId,
      users: [],
      classes: [],
      quizzes: [],
      questions: [],
      files: [],
      urls: [],
      documents: manifest,
      approveAll: false,
    }),
  });
  const importData = await importRes.json();
  if (!importRes.ok) {
    console.error(`Import failed: ${importRes.status}`, JSON.stringify(importData));
    return;
  }
  const summary = importData.summary || importData;
  console.log(`\nDocuments imported successfully!`);
  console.log(`  Documents created: ${summary.documentsCreated ?? summary.documents ?? '?'}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
