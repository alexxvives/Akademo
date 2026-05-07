#!/usr/bin/env node
/**
 * Static auditor: fails CI if anyone reintroduces the `teacherId === session.id`
 * (or `!== session.id`) anti-pattern in workers/akademo-api routes.
 *
 * Why: `Class.teacherId` and `LiveStream.teacherId` historically were ambiguous
 * (Teacher.id vs User.id). Even though the data is currently User.id, comparing
 * directly skips the academy-fallback that lets co-teachers in the same academy
 * collaborate. Use `teacherCanAccessClass(db, userId, classId)` (or the Lesson/
 * LiveStream variants) from `workers/akademo-api/src/lib/utils.ts` instead.
 *
 * Allowlist: a few intentional sites (positive checks for ownership flags,
 * cross-cutting broadcast permissions, Assignment.teacherId which has a real
 * FK to User) are documented inline below.
 *
 * Run: `node scripts/audit-teacher-access-checks.mjs`
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', 'workers', 'akademo-api', 'src', 'routes');

// Patterns that count as the anti-pattern when found in route guards.
const PATTERNS = [
  /\.teacherId\s*!==\s*session\.id/g,
  /\.teacherId\s*!==\s*user\.id/g,
];

// Files where `*.teacherId === session.id` is INTENTIONAL (analytics flags,
// positive ownership flags, etc.). Documented & accepted.
const ALLOWLIST = new Set([
  // assignments.ts: Assignment.teacherId has a real FK to User.id; the assigned-teacher
  // restriction is intentional spec, not a bug. (Lines 608, 809, 869, 950, 1066, 1111.)
  'assignments.ts',
  // student-payments.ts:38 — variable assignment for permission flag, not a guard.
  'student-payments.ts',
  // live.ts:1469 (positive `===`, ownership flag), 1675 (broadcast notify with
  // role !== 'ADMIN' inversion). Both intentional.
  // We don't allowlist live.ts wholesale because most of its checks WERE bugs
  // and have been migrated. Instead the patterns below are negative-pattern
  // only, and these two sites use `===`, so they don't match.
]);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.ts')) out.push(p);
  }
  return out;
}

let failures = 0;
for (const file of walk(ROOT)) {
  const base = file.split(/[\\/]/).pop();
  if (ALLOWLIST.has(base)) continue;
  const src = readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  for (const pat of PATTERNS) {
    pat.lastIndex = 0;
    let m;
    while ((m = pat.exec(src)) !== null) {
      const lineNo =
        src.substring(0, m.index).split(/\r?\n/).length;
      const line = lines[lineNo - 1] || '';
      console.error(
        `[audit-teacher-access] ${base}:${lineNo}\n    ${line.trim()}\n` +
        '    -> Use teacherCanAccessClass / teacherCanAccessLesson / ' +
        'teacherCanAccessLiveStream from ../lib/utils instead.\n'
      );
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\n[audit-teacher-access] ${failures} forbidden pattern(s) found.`);
  process.exit(1);
}
console.log('[audit-teacher-access] OK — no forbidden patterns found.');
