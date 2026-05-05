#!/usr/bin/env node
/**
 * Backfill topicId on migrated quizzes for Maximo Expo.
 * Matches quiz titles to topics using TEMA number extraction + keyword matching.
 * Writes quiz-topic-backfill.sql and prints a report.
 *
 * Run from project root: node scripts/backfill-quiz-topics.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ACADEMY_ID = '93ab97cf-271b-48de-924b-10fb7eab0a38';
const WRANGLER_CWD = path.join(__dirname, '..', 'workers', 'akademo-api');

function query(sql) {
  const flatSql = sql.replace(/\s+/g, ' ').trim();
  // SQL uses single quotes; wrap in double quotes for cmd.exe --command="..."
  const cmd = `npx wrangler d1 execute akademo-db --remote --yes --json --command="${flatSql}"`;
  const out = execSync(cmd, {
    cwd: WRANGLER_CWD,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const parsed = JSON.parse(out);
  return parsed[0].results || [];
}

function norm(str) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTemaNumber(title) {
  const m = norm(title).match(/\btema\s+(\d+)\b/);
  return m ? parseInt(m[1], 10) : null;
}

function keywords(title) {
  let s = norm(title);
  // Remove leading test/exam/autoevaluacion + optional number
  s = s.replace(/^(test|tets|autoevaluacion|examen|problema|mix)\s*\d*\s*[-.]?\s*/i, '');
  // Remove "tema X" anywhere
  s = s.replace(/\btema\s+\d+\b\s*[-.]?/gi, '');
  // Remove trailing numbers
  s = s.replace(/\b\d+\b/g, '');
  // Remove short words
  s = s.replace(/\b\w{1,3}\b/g, '');
  return s.replace(/\s+/g, ' ').trim().split(' ').filter(k => k.length > 3);
}

function match(quiz, topics) {
  if (!topics || topics.length === 0) return null;

  // Strategy 1: TEMA number
  const temaNum = extractTemaNumber(quiz.title);
  if (temaNum !== null) {
    const hits = topics.filter(t => {
      const tn = norm(t.name);
      // "tema X" as whole word, not followed immediately by another digit (so tema 1 != tema 10)
      return new RegExp(`\\btema\\s+${temaNum}(?!\\d)`).test(tn);
    });
    if (hits.length === 1) return { topicId: hits[0].id, topicName: hits[0].name, confidence: 'high', method: 'tema_number' };
    if (hits.length > 1) return { topicId: null, confidence: 'ambiguous_tema', candidates: hits.map(h => h.name) };
  }

  // Strategy 2: keyword scoring
  const kws = keywords(quiz.title);
  if (kws.length === 0) return null;

  const scored = topics
    .map(t => {
      const tn = norm(t.name);
      const score = kws.reduce((acc, k) => acc + (tn.includes(k) ? 1 : 0), 0);
      return { topic: t, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  if (scored.length === 1) return { topicId: scored[0].topic.id, topicName: scored[0].topic.name, confidence: 'high', method: 'keyword' };
  if (scored[0].score > scored[1].score)
    return { topicId: scored[0].topic.id, topicName: scored[0].topic.name, confidence: 'medium', method: 'keyword' };
  return { topicId: null, confidence: 'ambiguous_keyword', candidates: scored.slice(0, 3).map(s => s.topic.name) };
}

console.log('Fetching quizzes...');
const quizzes = query(`
  SELECT a.id, a.title, a.classId, c.name AS className
  FROM Assignment a
  JOIN Class c ON c.id = a.classId
  WHERE c.academyId = '${ACADEMY_ID}' AND a.topicId IS NULL AND a.type = 'quiz'
  ORDER BY c.name, a.title
`);
console.log(`  Found ${quizzes.length} quizzes without topicId`);

const classIds = [...new Set(quizzes.map(q => q.classId))];
const topicsByClass = {};
for (const cid of classIds) {
  const topics = query(`SELECT id, name FROM Topic WHERE classId = '${cid}' ORDER BY orderIndex`);
  topicsByClass[cid] = topics;
}

const updates = [], ambiguous = [], unmatched = [];

for (const quiz of quizzes) {
  const result = match(quiz, topicsByClass[quiz.classId]);
  if (result && result.topicId) {
    updates.push({ ...quiz, topicId: result.topicId, topicName: result.topicName, confidence: result.confidence, method: result.method });
  } else if (result && result.confidence.startsWith('ambiguous')) {
    ambiguous.push({ ...quiz, candidates: result.candidates });
  } else {
    unmatched.push(quiz);
  }
}

console.log(`\n=== MATCHES (${updates.length}) ===`);
for (const u of updates) console.log(`  [${u.confidence}/${u.method}] "${u.title}" → "${u.topicName}" (${u.className})`);

console.log(`\n=== AMBIGUOUS (${ambiguous.length}) - NOT updating ===`);
for (const a of ambiguous) console.log(`  "${a.title}" (${a.className}) → candidates: ${a.candidates?.join(' | ')}`);

console.log(`\n=== NO MATCH (${unmatched.length}) ===`);
for (const q of unmatched) console.log(`  "${q.title}" (${q.className})`);

if (updates.length > 0) {
  const sql = updates.map(u => `UPDATE Assignment SET topicId = '${u.topicId}' WHERE id = '${u.id}';`).join('\n');
  const outPath = path.join(__dirname, '..', 'quiz-topic-backfill.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`\nSQL written to quiz-topic-backfill.sql (${updates.length} updates)`);
} else {
  console.log('\nNo updates to apply.');
}
