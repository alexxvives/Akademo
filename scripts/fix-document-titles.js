/**
 * Fixes document titles in the DB where the manifest used filename instead of fileTitle.
 * Matches by hash + courseName + sectionName to handle duplicate hashes across courses.
 * Updates Document records in D1 via the API /admin/fix-document-titles endpoint.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MANIFEST_PATH = path.join(__dirname, '../docs/onboarding/maximo-expo/files/documents-manifest.json');
const CSV_PATH = path.join(__dirname, '../docs/onboarding/maximo-expo/files/files.csv');
const API_BASE = process.env.AKADEMO_API_URL || 'https://akademo-api.alexxvives.workers.dev';
const ACADEMY_ID = process.env.AKADEMO_ACADEMY_ID;

function parseCSVLine(line) {
  const fields = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { fields.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  fields.push(cur.trim());
  return fields;
}

function buildCsvLookup() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
  // Composite key: hash|courseName|sectionName — handles same file reused across courses
  const lookup = {};
  lines.forEach(line => {
    const r = parseCSVLine(line);
    const r2Path = r[6] || '';
    const parts = r2Path.split('/');
    if (parts.length >= 3) {
      const hash = parts[2];
      if (!hash || hash.length < 40) return;
      const courseName = (r[1] || '').trim();
      const sectionName = (r[3] || '').trim();
      const compositeKey = `${hash}|${courseName}|${sectionName}`;
      const entry = { fileTitle: r[0] || '', filename: r[4] || '', courseName, sectionName };
      lookup[compositeKey] = entry;
      // Simple key fallback: first occurrence wins
      if (!lookup[hash]) lookup[hash] = entry;
    }
  });
  return lookup;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const csvLookup = buildCsvLookup();

  const filenamePattern = /\.(jpg|jpeg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|mp4|zip)\s*$/i;
  const bad = manifest.filter(x => filenamePattern.test(x.fileTitle));

  let fixable = 0, notFound = 0, sameTitleInCSV = 0;
  const fixes = [];

  for (const entry of bad) {
    const keyParts = (entry.r2Key || '').split('/');
    const hash = keyParts.length >= 4 ? keyParts[keyParts.length - 1] : null;
    if (!hash) { notFound++; continue; }

    const courseName = (entry.courseName || '').trim();
    const sectionName = (entry.sectionName || '').trim();
    const compositeKey = `${hash}|${courseName}|${sectionName}`;

    const csv = csvLookup[compositeKey] || csvLookup[hash];
    if (!csv) { notFound++; continue; }

    const real = csv.fileTitle.trim();
    if (!real || filenamePattern.test(real)) { sameTitleInCSV++; continue; }
    if (real === entry.fileTitle) { sameTitleInCSV++; continue; }

    fixable++;
    fixes.push({
      uploadId: entry.uploadId,
      r2Key: entry.r2Key,
      oldTitle: entry.fileTitle,
      newTitle: real,
      courseName: entry.courseName,
      sectionName: entry.sectionName,
    });
  }

  console.log(`Manifest entries: ${manifest.length}`);
  console.log(`Filename-as-title entries: ${bad.length}`);
  console.log(`Fixable: ${fixable}, Not found: ${notFound}, CSV also bad/same: ${sameTitleInCSV}`);

  if (fixes.length === 0) {
    console.log('Nothing to fix!');
    return;
  }

  console.log('\nSample fixes:');
  fixes.slice(0, 8).forEach(f => {
    console.log(`  "${f.oldTitle}" -> "${f.newTitle}" | ${f.courseName} / ${f.sectionName}`);
  });

  // Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.AKADEMO_EMAIL, password: process.env.AKADEMO_PASSWORD }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  if (!token) { console.error('Login failed', loginData); process.exit(1); }
  console.log('\nLogged in. Sending fixes...');

  const BATCH = 50;
  let totalUpdated = 0;
  for (let i = 0; i < fixes.length; i += BATCH) {
    const batch = fixes.slice(i, i + BATCH);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(fixes.length / BATCH);
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} fixes)... `);

    const res = await fetch(`${API_BASE}/admin/fix-document-titles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ academyId: ACADEMY_ID, fixes: batch }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch {
      console.error('Non-JSON:', text.slice(0, 200));
      continue;
    }

    if (!res.ok) { console.error('Error:', data); continue; }
    console.log(`OK (${data.updated} updated)`);
    totalUpdated += data.updated || 0;
  }

  console.log(`\nDone! Total documents updated: ${totalUpdated}`);
}

main().catch(err => { console.error(err); process.exit(1); });
