#!/usr/bin/env node
/**
 * Moodle → AKADEMO quiz + PDF migration
 *
 * Reads quizzes.csv, questions.csv, and files.csv.csv from the project root
 * (exported from phpMyAdmin) and generates:
 *
 *   quiz-import.sql   — INSERT statements for Assignment + QuizQuestion tables
 *   pdf-manifest.txt  — list of PDFs to download from SiteGround + re-upload
 *
 * Run AFTER the main Excel import (moodle-to-excel.js + post-import.sql),
 * because quiz SQL references Class records that must already exist.
 *
 * Usage:
 *   node scripts/generate-quiz-sql.js
 *
 * Then:
 *   npx wrangler d1 execute akademo-db --remote --file=quiz-import.sql
 */

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const QUIZZES_CSV   = path.join(ROOT, 'quizzes.csv');
const QUESTIONS_CSV = path.join(ROOT, 'questions.csv');
const FILES_CSV     = path.join(ROOT, 'files.csv.csv');
const OUT_SQL       = path.join(ROOT, 'quiz-import.sql');
const OUT_MANIFEST  = path.join(ROOT, 'pdf-manifest.txt');

const NOW = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const wb = XLSX.read(content, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

/** Strip HTML tags and decode basic entities */
function stripHtml(str) {
  return String(str || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** SQL-safe string: escape single quotes */
function esc(str) {
  return String(str || '').replace(/'/g, "''");
}

/** Deterministic pseudo-UUID from a string (no crypto needed for SQL gen) */
let _seq = 0;
function genId(prefix) {
  _seq++;
  const hex = String(_seq).padStart(12, '0');
  return `${prefix}-0000-4000-a000-${hex}`;
}

// ── Parse CSVs ────────────────────────────────────────────────────────────────
if (!fs.existsSync(QUIZZES_CSV))   { console.error(`❌  Missing: ${QUIZZES_CSV}`);   process.exit(1); }
if (!fs.existsSync(QUESTIONS_CSV)) { console.error(`❌  Missing: ${QUESTIONS_CSV}`); process.exit(1); }
if (!fs.existsSync(FILES_CSV))     { console.error(`❌  Missing: ${FILES_CSV}`);      process.exit(1); }

const quizzesRaw   = parseCSV(QUIZZES_CSV);
const questionsRaw = parseCSV(QUESTIONS_CSV);
const filesRaw     = parseCSV(FILES_CSV);

// ── Build quiz map: quiz_id → {quizName, courseName, description} ─────────────
const quizMap = new Map();
for (const row of quizzesRaw) {
  const quizId = String(row.quiz_id || '').trim();
  if (!quizId) continue;
  quizMap.set(quizId, {
    quizName:    stripHtml(row.quiz_name || ''),
    courseName:  (row.course_name || '').trim(),
    description: stripHtml(row.quiz_description || ''),
  });
}

// ── Build questions map: quiz_id → question_id → {text, answers[]} ───────────
// Each answer row: {answer_id, answer_text, is_correct (1.0 = correct)}
const questionsByQuiz = new Map(); // quiz_id → Map<question_id, {text, answers[]}>

for (const row of questionsRaw) {
  const quizId  = String(row.quiz_id  || '').trim();
  const qId     = String(row.question_id || '').trim();
  const aId     = String(row.answer_id || '').trim();
  const aText   = stripHtml(row.answer_text || '');
  const qText   = stripHtml(row.question_text || '');
  const correct = parseFloat(String(row.is_correct || '0')) === 1.0;

  if (!quizId || !qId) continue;

  if (!questionsByQuiz.has(quizId)) questionsByQuiz.set(quizId, new Map());
  const qMap = questionsByQuiz.get(quizId);

  if (!qMap.has(qId)) {
    qMap.set(qId, { text: qText, answers: [] });
  }
  qMap.get(qId).answers.push({ id: aId, text: aText, correct });
}

// ── Generate SQL ──────────────────────────────────────────────────────────────
const sqlLines = [
  '-- AKADEMO quiz migration SQL',
  `-- Generated: ${new Date().toISOString()}`,
  '-- Run AFTER the Excel import and post-import.sql:',
  '--   npx wrangler d1 execute akademo-db --remote --file=quiz-import.sql',
  '--',
  '-- This script creates one Assignment (type=quiz) per Moodle quiz,',
  '-- and one QuizQuestion per question, linked to the correct class.',
  '',
];

let assignmentsCreated = 0;
let questionsCreated   = 0;
let skipped            = 0;

for (const [moodleQuizId, quiz] of quizMap.entries()) {
  const questions = questionsByQuiz.get(moodleQuizId);
  if (!questions || questions.size === 0) {
    skipped++;
    continue;
  }

  const assignmentId = genId(`a${moodleQuizId.padStart(6,'0')}`);
  const courseName   = esc(quiz.courseName);
  const quizTitle    = esc(quiz.quizName || `Quiz ${moodleQuizId}`);
  const quizDesc     = esc(quiz.description);
  const totalQ       = questions.size;

  sqlLines.push(`-- Quiz: "${quiz.quizName}" → Course: "${quiz.courseName}" (${totalQ} questions)`);
  sqlLines.push(`INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)`);
  sqlLines.push(`SELECT`);
  sqlLines.push(`  '${assignmentId}',`);
  sqlLines.push(`  c.id,`);
  sqlLines.push(`  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),`);
  sqlLines.push(`  '${quizTitle}',`);
  sqlLines.push(`  ${quizDesc ? `'${quizDesc}'` : 'NULL'},`);
  sqlLines.push(`  'quiz',`);
  sqlLines.push(`  100,`);
  sqlLines.push(`  '${NOW}',`);
  sqlLines.push(`  '${NOW}'`);
  sqlLines.push(`FROM Class c`);
  sqlLines.push(`WHERE c.name = '${courseName}'`);
  sqlLines.push(`  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = '${quizTitle}' AND a.type = 'quiz')`);
  sqlLines.push(`LIMIT 1;`);
  sqlLines.push('');

  assignmentsCreated++;

  let questionOrder = 0;
  for (const [, question] of questions.entries()) {
    const questionId = genId(`q${moodleQuizId}x${questionOrder}`);
    const qText = esc(question.text);
    const correctAnswer = question.answers.find(a => a.correct);
    if (!correctAnswer) continue; // skip questions with no correct answer marked

    // Build options JSON
    const options = question.answers.map(a => ({ id: a.id, text: a.text }));
    const optionsJson = esc(JSON.stringify(options));
    const correctOptionId = esc(correctAnswer.id);

    sqlLines.push(`INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)`);
    sqlLines.push(`VALUES (`);
    sqlLines.push(`  '${questionId}',`);
    sqlLines.push(`  '${assignmentId}',`);
    sqlLines.push(`  '${qText}',`);
    sqlLines.push(`  ${questionOrder},`);
    sqlLines.push(`  '${optionsJson}',`);
    sqlLines.push(`  '${correctOptionId}',`);
    sqlLines.push(`  '${NOW}'`);
    sqlLines.push(`);`);
    sqlLines.push('');

    questionOrder++;
    questionsCreated++;
  }
}

fs.writeFileSync(OUT_SQL, sqlLines.join('\n'), 'utf8');

// ── Generate PDF manifest ─────────────────────────────────────────────────────
// Groups files by course. Provides the SiteGround path to download each file.
const MOODLE_DATA_ROOT = '/home/customer/www/maximoexponente.es/campus/moodledata/filedir';

const manifestLines = [
  'AKADEMO PDF Migration Manifest',
  `Generated: ${new Date().toISOString()}`,
  '',
  'HOW TO DOWNLOAD:',
  '  SiteGround → Sitio Web → Gestor archivos → navigate to:',
  `  ${MOODLE_DATA_ROOT}`,
  '  Download each file at the path shown below.',
  '',
  'HOW TO UPLOAD:',
  '  After downloading, upload each PDF via AKADEMO → Clases → [class] → Lecciones → Nueva lección → Añadir documento',
  '  OR use the Bunny upload API if doing bulk upload.',
  '',
  '─'.repeat(80),
  '',
];

// Group by course
const filesByCourse = new Map();
for (const row of filesRaw) {
  const course = (row.course_name || 'Unknown').trim();
  if (!filesByCourse.has(course)) filesByCourse.set(course, []);
  filesByCourse.get(course).push(row);
}

let totalFiles = 0;
for (const [course, files] of [...filesByCourse.entries()].sort()) {
  // Deduplicate by file_path (Moodle deduplicates by content hash)
  const seen = new Set();
  const unique = files.filter(f => {
    if (seen.has(f.file_path)) return false;
    seen.add(f.file_path);
    return true;
  });

  manifestLines.push(`COURSE: ${course} (${unique.length} files)`);
  manifestLines.push('');
  for (const f of unique) {
    const sizeKB = Math.round(parseInt(f.filesize || '0') / 1024);
    manifestLines.push(`  Title   : ${f.file_title}`);
    manifestLines.push(`  Filename: ${f.filename}`);
    manifestLines.push(`  Size    : ${sizeKB} KB`);
    manifestLines.push(`  Path    : ${MOODLE_DATA_ROOT}/${f.file_path}`);
    manifestLines.push('');
    totalFiles++;
  }
  manifestLines.push('─'.repeat(80));
  manifestLines.push('');
}

fs.writeFileSync(OUT_MANIFEST, manifestLines.join('\n'), 'utf8');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`✅  Quiz SQL  : ${OUT_SQL}`);
console.log(`   Quizzes   : ${assignmentsCreated} created, ${skipped} skipped (no questions)`);
console.log(`   Questions : ${questionsCreated}`);
console.log('');
console.log(`✅  PDF list  : ${OUT_MANIFEST}`);
console.log(`   Files     : ${totalFiles} (deduplicated by content hash)`);
console.log('');
console.log('Next steps:');
console.log('  1. Run: npx wrangler d1 execute akademo-db --remote --file=quiz-import.sql');
console.log('  2. Download PDFs from SiteGround using pdf-manifest.txt');
console.log('  3. Upload PDFs via AKADEMO dashboard to the correct classes');
