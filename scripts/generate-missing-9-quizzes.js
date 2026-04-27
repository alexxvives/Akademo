#!/usr/bin/env node
/**
 * Generates SQL for the 9 quizzes that were blocked by NOT EXISTS guard in quiz-import.sql
 * These are quizzes with duplicate titles in the same course — renamed with "(2)" suffix.
 *
 * Usage:
 *   node scripts/generate-missing-9-quizzes.js
 *   npx wrangler d1 execute akademo-db --remote --file=docs/onboarding/maximoexponente/quiz-missing-9.sql
 */

const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT        = path.join(__dirname, '..');
const QUIZZES_CSV = path.join(ROOT, 'docs/onboarding/maximoexponente/quizzes.csv');
const QUESTIONS_CSV = path.join(ROOT, 'docs/onboarding/maximoexponente/questions.csv');
const OUT_SQL     = path.join(ROOT, 'docs/onboarding/maximoexponente/quiz-missing-9.sql');
const NOW         = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

// The 9 duplicate quiz title+course combos that were blocked
const BLOCKED = new Set([
  'Cría|||TEST 2º CUATRIMESTRE',
  'Fisiología Vet 1ºC|||TEST 1- CARDIACO',
  'Fisiología Vet 1ºC|||TEST 1- SISTEMA NERVIOSO Y MUSCULAR',
  'Fisiología Vet 1ºC|||TEST 2 - CARDIACO',
  'Fisiología Vet 1ºC|||TEST 2- SISTEMA NERVIOSO Y MUSCULAR',
  'Fisiología Veterinaria  2ºC|||TEST 1- CARDIACO',
  'Fisiología Veterinaria  2ºC|||TEST 1- SISTEMA NERVIOSO Y MUSCULAR',
  'Fisiología Veterinaria  2ºC|||TEST 2 - CARDIACO',
  'Fisiología Veterinaria  2ºC|||TEST 2- SISTEMA NERVIOSO Y MUSCULAR',
]);

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const wb = XLSX.read(content, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

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

function esc(str) {
  return String(str || '').replace(/'/g, "''");
}

let _seq = 9000; // start high to avoid collisions with existing IDs
function genId(prefix) {
  _seq++;
  const hex = String(_seq).padStart(12, '0');
  return `${prefix}-0000-4000-b000-${hex}`;
}

console.log('Parsing quizzes.csv...');
const quizzesRaw = parseCSV(QUIZZES_CSV);

console.log('Parsing questions.csv (large file, may take a moment)...');
const questionsRaw = parseCSV(QUESTIONS_CSV);
console.log(`  Loaded ${questionsRaw.length} question rows`);

// Build questions map
const questionsByQuiz = new Map();
for (const row of questionsRaw) {
  const quizId = String(row.quiz_id || '').trim();
  const qId    = String(row.question_id || '').trim();
  const aId    = String(row.answer_id || '').trim();
  const aText  = stripHtml(row.answer_text || '');
  const qText  = stripHtml(row.question_text || '');
  const correct = parseFloat(String(row.is_correct || '0')) === 1.0;

  if (!quizId || !qId) continue;
  if (!questionsByQuiz.has(quizId)) questionsByQuiz.set(quizId, new Map());
  const qMap = questionsByQuiz.get(quizId);
  if (!qMap.has(qId)) qMap.set(qId, { text: qText, answers: [] });
  qMap.get(qId).answers.push({ id: aId, text: aText, correct });
}

// Find the 2nd occurrence of each blocked combo in quizzes.csv
// Track seen: course|||title → count
const seen = {};
const targetQuizzes = [];

for (const row of quizzesRaw) {
  const quizId     = String(row.quiz_id || '').trim();
  const courseName = (row.course_name || '').trim();
  const quizName   = stripHtml(row.quiz_name || '');
  const key        = courseName + '|||' + quizName;

  if (!BLOCKED.has(key)) continue;

  seen[key] = (seen[key] || 0) + 1;
  if (seen[key] === 2) {
    // This is the duplicate that was blocked
    targetQuizzes.push({ quizId, courseName, quizName, description: stripHtml(row.quiz_description || '') });
    console.log(`Found blocked quiz: [${courseName}] "${quizName}" (moodle id=${quizId})`);
  }
}

console.log(`\nGenerating SQL for ${targetQuizzes.length} missing quizzes...`);

const sqlLines = [
  '-- quiz-missing-9.sql',
  '-- Generated: ' + new Date().toISOString(),
  '-- Inserts the 9 quizzes that were blocked by NOT EXISTS in quiz-import.sql',
  '-- (same title+course as an existing quiz — renamed with "(2)" suffix)',
  '-- Run once:',
  '--   npx wrangler d1 execute akademo-db --remote --file=docs/onboarding/maximoexponente/quiz-missing-9.sql',
  '',
];

let created = 0;

for (const quiz of targetQuizzes) {
  const questions = questionsByQuiz.get(quiz.quizId);
  if (!questions || questions.size === 0) {
    console.warn(`  SKIP (no questions): [${quiz.courseName}] "${quiz.quizName}"`);
    continue;
  }

  const assignmentId = genId(`c${quiz.quizId.padStart(6, '0')}`);
  const courseName   = esc(quiz.courseName);
  const newTitle     = esc(quiz.quizName + ' (2)'); // renamed to avoid collision
  const quizDesc     = esc(quiz.description);
  const totalQ       = questions.size;

  sqlLines.push(`-- Quiz: "${quiz.quizName}" → Course: "${quiz.courseName}" (${totalQ} questions) [renamed to add "(2)"]`);
  sqlLines.push(`INSERT INTO Assignment (id, classId, teacherId, title, description, type, maxScore, createdAt, updatedAt)`);
  sqlLines.push(`SELECT`);
  sqlLines.push(`  '${assignmentId}',`);
  sqlLines.push(`  c.id,`);
  sqlLines.push(`  COALESCE(c.teacherId, (SELECT ownerId FROM Academy WHERE id = c.academyId LIMIT 1)),`);
  sqlLines.push(`  '${newTitle}',`);
  sqlLines.push(`  ${quizDesc ? `'${quizDesc}'` : 'NULL'},`);
  sqlLines.push(`  'quiz',`);
  sqlLines.push(`  100,`);
  sqlLines.push(`  '${NOW}',`);
  sqlLines.push(`  '${NOW}'`);
  sqlLines.push(`FROM Class c`);
  sqlLines.push(`WHERE c.name = '${courseName}'`);
  sqlLines.push(`  AND NOT EXISTS (SELECT 1 FROM Assignment a WHERE a.classId = c.id AND a.title = '${newTitle}' AND a.type = 'quiz')`);
  sqlLines.push(`LIMIT 1;`);
  sqlLines.push('');

  let questionOrder = 0;
  for (const [, question] of questions.entries()) {
    const correctAnswer = question.answers.find(a => a.correct);
    if (!correctAnswer) continue;

    const questionId   = genId(`d${quiz.quizId}x${questionOrder}`);
    const qText        = esc(question.text);
    const options      = question.answers.map(a => ({ id: a.id, text: a.text }));
    const optionsJson  = esc(JSON.stringify(options));
    const correctOptId = esc(correctAnswer.id);

    sqlLines.push(`INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, createdAt)`);
    sqlLines.push(`VALUES (`);
    sqlLines.push(`  '${questionId}',`);
    sqlLines.push(`  '${assignmentId}',`);
    sqlLines.push(`  '${qText}',`);
    sqlLines.push(`  ${questionOrder},`);
    sqlLines.push(`  '${optionsJson}',`);
    sqlLines.push(`  '${correctOptId}',`);
    sqlLines.push(`  '${NOW}'`);
    sqlLines.push(`);`);
    sqlLines.push('');

    questionOrder++;
  }

  created++;
  console.log(`  Generated: [${quiz.courseName}] "${quiz.quizName} (2)" with ${questionOrder} questions`);
}

fs.writeFileSync(OUT_SQL, sqlLines.join('\n'), 'utf8');
console.log(`\nDone. ${created} quizzes written to ${OUT_SQL}`);
