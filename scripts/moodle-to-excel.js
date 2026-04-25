#!/usr/bin/env node
/**
 * Moodle → AKADEMO Excel migration converter
 *
 * Reads two CSVs exported from phpMyAdmin and produces a ready-to-import
 * Excel file in the AKADEMO migration format.
 *
 * STEP 1 — Run these two queries in phpMyAdmin and export each as CSV
 *          (use "Export" → Format: CSV, keep column names in first row)
 *
 * ── enrollments.csv ─────────────────────────────────────────────────────────
 * SELECT
 *   u.email,
 *   u.firstname AS nombre,
 *   u.lastname  AS apellido,
 *   c.fullname  AS asignatura,
 *   r.shortname AS moodle_rol
 * FROM mdl3y_user_enrolments ue
 * JOIN mdl3y_enrol e   ON ue.enrolid   = e.id
 * JOIN mdl3y_course c  ON e.courseid   = c.id
 * JOIN mdl3y_context ctx
 *   ON ctx.instanceid = c.id AND ctx.contextlevel = 50
 * JOIN mdl3y_role_assignments ra
 *   ON ra.userid = ue.userid AND ra.contextid = ctx.id
 * JOIN mdl3y_role r  ON r.id  = ra.roleid
 * JOIN mdl3y_user u  ON u.id  = ue.userid
 * WHERE u.deleted = 0 AND u.suspended = 0
 *   AND r.shortname IN ('student','editingteacher')
 * ORDER BY u.email;
 *
 * ── asignaturas.csv (also accepted: courses.csv) ──────────────────────────
 * SELECT
 *   fullname AS nombre,
 *   FROM_UNIXTIME(startdate, '%d/%m/%Y') AS fechaInicio
 * FROM mdl3y_course
 * WHERE id > 1
 * ORDER BY fullname;
 *
 * STEP 2 — Place both CSV files in the same folder as this script and run:
 *   node scripts/moodle-to-excel.js
 *
 * Output: scripts/moodle-migration.xlsx
 */

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
// Courses starting before this date are treated as "already paid in full".
// Their startDate is preserved but all current enrollments get a COMPLETED
// payment record generated in the post-import SQL file.
const LEGACY_CUTOFF_DATE = new Date('2025-01-01');
const TODAY_ISO = new Date().toISOString().split('T')[0];
const TODAY_DDMMYYYy = TODAY_ISO.split('-').reverse().join('/');

// CSVs live in the project root (one level up from scripts/)
const ROOT = path.join(__dirname, '..');
const ENROLLMENTS_CSV = path.join(ROOT, 'enrollments.csv');
// Accept both asignaturas.csv (preferred) and courses.csv (legacy)
const COURSES_CSV = fs.existsSync(path.join(ROOT, 'asignaturas.csv'))
  ? path.join(ROOT, 'asignaturas.csv')
  : path.join(ROOT, 'courses.csv');
const OUTPUT_XLSX     = path.join(ROOT, 'moodle-migration.xlsx');

// Moodle roles that map to AKADEMO TEACHER
const TEACHER_ROLES = new Set(['editingteacher', 'teacher', 'manager']);

// Admin/system usernames to skip
const SKIP_EMAILS = new Set(['campusmanager@maximoexponente.es', 'amaximoexponente@gmail.com']);

// ── Parse CSV ────────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const wb = XLSX.read(content, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (!fs.existsSync(ENROLLMENTS_CSV)) {
  console.error(`❌  Missing file: ${ENROLLMENTS_CSV}`);
  console.error('    Export the enrollments query from phpMyAdmin as CSV first.');
  process.exit(1);
}
if (!fs.existsSync(COURSES_CSV)) {
  console.error('❌  Missing file: asignaturas.csv (or courses.csv)');
  console.error('    Export the courses query from phpMyAdmin as CSV and save as asignaturas.csv');
  process.exit(1);
}

const enrollments = parseCSV(ENROLLMENTS_CSV);
const coursesRaw  = parseCSV(COURSES_CSV);

// ── Build user map ────────────────────────────────────────────────────────────
// email → { nombre, apellido, rol, asignaturas: Set }
const userMap = new Map();

for (const row of enrollments) {
  const email     = (row.email     || '').trim().toLowerCase();
  const nombre    = (row.nombre    || '').trim();
  const apellido  = (row.apellido  || '').trim();
  const asignatura = (row.asignatura || '').trim();
  const moodle_rol = (row.moodle_rol || '').trim().toLowerCase();

  if (!email || SKIP_EMAILS.has(email)) continue;

  if (!userMap.has(email)) {
    userMap.set(email, {
      email,
      nombre,
      apellido,
      // default to STUDENT; upgrade to TEACHER if any teacher role found
      rol: 'STUDENT',
      asignaturas: new Set(),
    });
  }

  const user = userMap.get(email);

  // Upgrade role if needed (teacher beats student)
  if (TEACHER_ROLES.has(moodle_rol)) {
    user.rol = 'TEACHER';
  }

  if (asignatura) user.asignaturas.add(asignatura);
}

// ── Build course → teacher map ────────────────────────────────────────────────
const courseTeacher = new Map(); // courseName → email

for (const row of enrollments) {
  const email      = (row.email     || '').trim().toLowerCase();
  const asignatura = (row.asignatura || '').trim();
  const moodle_rol = (row.moodle_rol || '').trim().toLowerCase();

  if (TEACHER_ROLES.has(moodle_rol) && asignatura && !courseTeacher.has(asignatura)) {
    courseTeacher.set(asignatura, email);
  }
}

// ── Build Usuarios sheet rows ─────────────────────────────────────────────────
const userHeaders = ['email', 'nombre', 'apellido', 'rol', 'asignaturas'];

const userRows = Array.from(userMap.values()).map(u => [
  u.email,
  u.nombre,
  u.apellido,
  u.rol,
  Array.from(u.asignaturas).join(','),
]);

// Sort: teachers first, then students, both alphabetically by email
userRows.sort((a, b) => {
  if (a[3] !== b[3]) return a[3] === 'TEACHER' ? -1 : 1;
  return a[0].localeCompare(b[0]);
});

// ── Build Asignaturas sheet rows ──────────────────────────────────────────────
const classHeaders = [
  'nombre',
  'precio',
  'cuotas (opcional)',
  'fechaInicio',
  'profesorEmail (opcional)',
  'descripcion (opcional)',
  'universidad (opcional)',
  'carrera (opcional)',
  'maxEstudiantes (opcional)',
  'whatsapp (opcional)',
];

const classRows = coursesRaw.map(c => {
  const nombre = (c.nombre || '').trim();
  const rawDate = String(c.fechaInicio || '').trim(); // dd/mm/yyyy from Moodle

  // Parse dd/mm/yyyy → Date object
  let parsedDate = null;
  if (rawDate) {
    const [dd, mm, yyyy] = rawDate.split('/');
    parsedDate = new Date(`${yyyy}-${mm}-${dd}`);
  }

  const isLegacy = parsedDate && parsedDate < LEGACY_CUTOFF_DATE;
  // Keep original date even for legacy courses — the post-import SQL handles payment status
  const fechaInicio = rawDate || TODAY_DDMMYYYy;

  return [
    nombre,
    '',  // precio — fill manually (or leave empty → isPublished=0 until academy sets it)
    '',  // cuotas — fill manually
    fechaInicio,
    courseTeacher.get(nombre) || '',
    '',  // descripcion
    '',  // universidad
    '',  // carrera
    '',  // maxEstudiantes
    '',  // whatsapp
    isLegacy ? 'LEGACY_PAID' : '',  // internal marker — strip before importing if importer rejects extra cols
  ];
});

classRows.sort((a, b) => a[0].localeCompare(b[0]));

// ── Write Excel ───────────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

// Strip the internal LEGACY_PAID marker column before writing — importer doesn't expect it
const classHeadersForExcel = classHeaders;
const classRowsForExcel = classRows.map(r => r.slice(0, classHeaders.length));

const wsUsers = XLSX.utils.aoa_to_sheet([userHeaders, ...userRows]);
wsUsers['!cols'] = [32, 16, 20, 10, 60].map(w => ({ wch: w }));
XLSX.utils.book_append_sheet(wb, wsUsers, 'Usuarios');

const wsClases = XLSX.utils.aoa_to_sheet([classHeadersForExcel, ...classRowsForExcel]);
wsClases['!cols'] = [30, 10, 8, 14, 34, 30, 16, 16, 16, 44].map(w => ({ wch: w }));
XLSX.utils.book_append_sheet(wb, wsClases, 'Asignaturas');

XLSX.writeFile(wb, OUTPUT_XLSX);

// ── Generate post-import SQL ──────────────────────────────────────────────────
// After you run the Excel import in AKADEMO, run this SQL via wrangler d1 execute
// to mark all migrated students' enrollments as APPROVED and create a COMPLETED
// payment record (amount=0, method='migration') for each legacy course enrollment.
//
// This reflects that these students already paid in Moodle — no new payments owed.

const legacyCourses = classRows
  .filter(r => r[10] === 'LEGACY_PAID')
  .map(r => r[0].replace(/'/g, "''"));   // SQL-escape single quotes

const sqlLines = [
  '-- AKADEMO post-import migration SQL',
  `-- Generated: ${new Date().toISOString()}`,
  '-- Run with: npx wrangler d1 execute akademo-db --remote --file=scripts/post-import.sql',
  '',
  '-- 1. Approve all enrollments for migrated legacy courses',
  `UPDATE ClassEnrollment`,
  `SET status = 'APPROVED', approvedAt = '${TODAY_ISO}'`,
  `WHERE classId IN (`,
  `  SELECT id FROM Class WHERE name IN (${legacyCourses.map(n => `'${n}'`).join(',\n    ')})`,
  `);`,
  '',
  '-- 2. Create a COMPLETED payment record for each approved enrollment',
  '-- (amount=0 because we don\'t know what they originally paid in Moodle)',
  `INSERT INTO Payment (id, type, payerId, payerType, payerName, payerEmail, receiverId, amount, currency, status, paymentMethod, classId, description, createdAt, completedAt)`,
  `SELECT`,
  `  lower(hex(randomblob(16))),`,
  `  'STUDENT_TO_ACADEMY',`,
  `  ce.userId,`,
  `  'STUDENT',`,
  `  u.firstName || ' ' || u.lastName,`,
  `  u.email,`,
  `  c.academyId,`,
  `  0,`,
  `  'EUR',`,
  `  'COMPLETED',`,
  `  'migration',`,
  `  ce.classId,`,
  `  'Migrated from Moodle — payment already collected',`,
  `  '${TODAY_ISO}',`,
  `  '${TODAY_ISO}'`,
  `FROM ClassEnrollment ce`,
  `JOIN User u ON u.id = ce.userId`,
  `JOIN Class c ON c.id = ce.classId`,
  `WHERE ce.status = 'APPROVED'`,
  `  AND c.name IN (${legacyCourses.map(n => `'${n}'`).join(',\n    ')})`,
  `  AND NOT EXISTS (`,
  `    SELECT 1 FROM Payment p WHERE p.classId = ce.classId AND p.payerId = ce.userId AND p.paymentMethod = 'migration'`,
  `  );`,
];

const sqlPath = path.join(ROOT, 'post-import.sql');
fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf8');

// ── Summary ───────────────────────────────────────────────────────────────────
const teachers = userRows.filter(r => r[3] === 'TEACHER').length;
const students  = userRows.filter(r => r[3] === 'STUDENT').length;

console.log(`✅  Done: ${OUTPUT_XLSX}`);
console.log(`   Users   : ${userRows.length} (${teachers} teachers, ${students} students)`);
console.log(`   Courses : ${classRows.length} (${legacyCourses.length} legacy/pre-2025 → marked as paid)`);
console.log(`✅  SQL    : ${sqlPath}`);
console.log('');
console.log('Next steps:');
console.log('  1. Fill in "precio" column in Asignaturas tab (leave blank → class created unpublished)');
console.log('  2. Import the Excel in AKADEMO admin panel');
console.log('  3. Run the post-import SQL: npx wrangler d1 execute akademo-db --remote --file=scripts/post-import.sql');
