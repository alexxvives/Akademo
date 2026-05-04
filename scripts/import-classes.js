/**
 * import-classes.js
 * Reads asignaturas.csv and re-creates all Class rows via /admin/bulk-import.
 * Run this before import-manifest.js when classes have been wiped.
 *
 * Usage: node scripts/import-classes.js
 * Credentials come from scripts/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs   = require('fs');
const path = require('path');

const ASIGNATURAS_CSV = path.join(__dirname, '..', 'docs', 'onboarding', 'maximo-expo', 'files', 'asignaturas.csv');

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map(function(h) { return h.replace(/^"|"$/g, '').trim(); });
  return lines.slice(1).filter(function(l) { return l.trim(); }).map(function(line) {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach(function(h, i) { row[h] = (values[i] || '').replace(/^"|"$/g, '').trim(); });
    return row;
  });
}

function splitCSVLine(line) {
  const values = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) { values.push(current); current = ''; }
    else { current += ch; }
  }
  values.push(current);
  return values;
}

async function main() {
  const apiUrl      = (process.env.AKADEMO_API_URL || 'https://akademo-api.alexxvives.workers.dev').replace(/\/$/, '');
  const adminEmail  = process.env.AKADEMO_EMAIL;
  const adminPass   = process.env.AKADEMO_PASSWORD;
  const academyId   = process.env.AKADEMO_ACADEMY_ID;

  if (!adminEmail || !adminPass || !academyId) {
    console.error('Missing credentials in scripts/.env (need AKADEMO_EMAIL, AKADEMO_PASSWORD, AKADEMO_ACADEMY_ID)');
    process.exit(1);
  }

  if (!fs.existsSync(ASIGNATURAS_CSV)) {
    console.error('ERROR: ' + ASIGNATURAS_CSV + ' not found.');
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(ASIGNATURAS_CSV, 'utf8'));
  console.log('Loaded ' + rows.length + ' classes from asignaturas.csv');

  // Build classRows in the format expected by /admin/bulk-import
  const classRows = rows.map(function(r) {
    return {
      name:        r.nombre       || r.name || '',
      startDate:   r.fechaInicio  || r.startDate || '',
      price:       r.precio       || r.price || 0,
      cuotas:      r.cuotas       || 0,
      description: r.descripcion  || r.description || '',
      university:  r.universidad  || r.university || '',
      carrera:     r.carrera      || '',
      teacherEmail: r.teacherEmail || '',
    };
  }).filter(function(r) { return r.name; });

  console.log('Prepared ' + classRows.length + ' class rows.');

  // Login
  console.log('Logging in to AKADEMO...');
  const loginRes = await fetch(apiUrl + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPass }),
  });
  if (!loginRes.ok) {
    console.error('Login failed: ' + loginRes.status + ' ' + await loginRes.text());
    process.exit(1);
  }
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken || (loginData.data && (loginData.data.token || loginData.data.accessToken));
  if (!token) {
    console.error('Login response did not include a token:', JSON.stringify(loginData));
    process.exit(1);
  }
  console.log('Logged in. Importing ' + classRows.length + ' classes...');

  const importRes = await fetch(apiUrl + '/admin/bulk-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      academyId,
      users: [],          // no users — classes only
      classes: classRows,
    }),
  });

  const responseText = await importRes.text();
  let importData;
  try {
    importData = JSON.parse(responseText);
  } catch (e) {
    console.error('Non-JSON response (' + importRes.status + '):');
    console.error(responseText.slice(0, 1000));
    process.exit(1);
  }

  if (!importRes.ok) {
    console.error('Import failed: ' + importRes.status, JSON.stringify(importData));
    process.exit(1);
  }

  console.log('\nRaw response:');
  console.log(JSON.stringify(importData, null, 2).slice(0, 3000));

  const meta = (importData.data && importData.data.meta) || importData.meta || importData;
  console.log('\nDone!');
  console.log('  Classes created: ' + (meta.classesCreated || meta.created || 0));
  console.log('  Classes existed: ' + (meta.classesExisted || meta.existed || 0));
  if (meta.classResults) {
    meta.classResults.forEach(function(r) {
      console.log('  [' + r.status + '] ' + r.name + (r.message ? ' — ' + r.message : ''));
    });
  }
}

main().catch(function(err) {
  console.error('Fatal:', err);
  process.exit(1);
});
