#!/usr/bin/env node
/**
 * Finds which quiz titles per course appear more than once in quiz-import.sql
 * (those were blocked by the NOT EXISTS guard and are missing from the DB)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const sqlContent = fs.readFileSync(path.join(ROOT, 'docs/onboarding/maximoexponente/quiz-import.sql'), 'utf8');
const lines = sqlContent.split('\n');

const comments = lines.filter(l => l.startsWith('-- Quiz:'));
const courseTitleCounts = {};
for (const l of comments) {
  const m = l.match(/^-- Quiz: "(.+)" → Course: "(.+)" \(/);
  if (!m) continue;
  const title = m[1];
  const course = m[2];
  const key = course + '|||' + title;
  courseTitleCounts[key] = (courseTitleCounts[key] || 0) + 1;
}

console.log('Duplicate quiz title+course combos (2nd+ would be blocked by NOT EXISTS):');
let total = 0;
for (const [k, v] of Object.entries(courseTitleCounts).sort()) {
  if (v > 1) {
    const [course, title] = k.split('|||');
    const missed = v - 1;
    total += missed;
    console.log(`  x${v} (${missed} blocked): [${course}] "${title}"`);
  }
}
console.log(`Total blocked: ${total}`);
