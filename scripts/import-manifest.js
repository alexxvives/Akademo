#!/usr/bin/env node
/**
 * import-manifest.js
 * Reads documents-manifest.json and calls the AKADEMO bulk-import API.
 * Run this when files are already in R2 but documents haven't been linked in the DB.
 *
 * Usage: node scripts/import-manifest.js
 * Credentials come from scripts/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs   = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, '../docs/onboarding/maximo-expo/files/documents-manifest.json');

async function main() {
  const apiUrl    = (process.env.AKADEMO_API_URL || 'https://akademo-api.alexxvives.workers.dev').replace(/\/$/, '');
  const adminEmail = process.env.AKADEMO_EMAIL;
  const adminPass  = process.env.AKADEMO_PASSWORD;
  const academyId  = process.env.AKADEMO_ACADEMY_ID;

  if (!adminEmail || !adminPass || !academyId) {
    console.error('Missing credentials in scripts/.env');
    process.exit(1);
  }

  if (!fs.existsSync(MANIFEST)) {
    console.error(`Manifest not found: ${MANIFEST}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
  console.log(`Loaded ${manifest.length} entries from manifest.`);

  console.log('Logging in to AKADEMO...');
  const loginRes = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPass }),
  });
  if (!loginRes.ok) {
    console.error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    process.exit(1);
  }
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken || loginData.data?.token || loginData.data?.accessToken;
  if (!token) {
    console.error('Login response did not include a token:', JSON.stringify(loginData));
    process.exit(1);
  }
  console.log('Logged in. Sending manifest to bulk-import...');

  await fetch(`${apiUrl}/`, { method: 'GET' }).catch(() => {});

  const BATCH_SIZE = 20;
  let totalCreated = 0;
  const batches = [];
  for (let i = 0; i < manifest.length; i += BATCH_SIZE) {
    batches.push(manifest.slice(i, i + BATCH_SIZE));
  }

  console.log(`Sending ${manifest.length} entries in ${batches.length} batches of ${BATCH_SIZE}...`);

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    process.stdout.write(`  Batch ${b + 1}/${batches.length} (${batch.length} docs)... `);

    const importRes = await fetch(`${apiUrl}/admin/import-documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        academyId,
        documents: batch,
      }),
    });

    const responseText = await importRes.text();
    let importData;
    try {
      importData = JSON.parse(responseText);
    } catch {
      console.error(`\nBatch ${b + 1} got non-JSON response (status ${importRes.status}):`);
      console.error(responseText.slice(0, 500));
      process.exit(1);
    }
    if (!importRes.ok) {
      console.error(`\nBatch ${b + 1} failed: ${importRes.status}`, JSON.stringify(importData));
      process.exit(1);
    }

    const summary = (importData.data) || importData.summary || importData;
    const created = summary.documentsCreated ?? summary.documents ?? 0;
    const skip = summary.skipped ?? 0;
    totalCreated += created;
    console.log(`OK (${created} created, ${skip} skipped)`);
  }

  console.log(`\nDone! Total documents created: ${totalCreated}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
