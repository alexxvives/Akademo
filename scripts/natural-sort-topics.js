/**
 * Natural-sort topics for an academy in D1.
 * Handles numeric segments correctly (TEMA 9 before TEMA 10).
 * Usage: CLOUDFLARE_ACCOUNT_ID=... node scripts/natural-sort-topics.js [academyId]
 */

const { execSync } = require('child_process');
const fs = require('fs');

const ACADEMY_ID = process.argv[2] || '93ab97cf-271b-48de-924b-10fb7eab0a38';

const env = {
  ...process.env,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || '53808754f4bd94365d6e31351aa426c0',
};

console.log(`Fetching topics for academy ${ACADEMY_ID}...`);

const raw = execSync(
  `npx wrangler d1 execute akademo-db --remote --json --command="SELECT id, name, classId FROM Topic WHERE classId IN (SELECT id FROM Class WHERE academyId = '${ACADEMY_ID}') ORDER BY classId, id"`,
  { env, encoding: 'utf8' }
);

const parsed = JSON.parse(raw);
const rows = parsed[0]?.results ?? [];
console.log(`Found ${rows.length} topics`);

// Group by classId
const byClass = new Map();
for (const row of rows) {
  if (!byClass.has(row.classId)) byClass.set(row.classId, []);
  byClass.get(row.classId).push(row);
}

// Natural-sort each class's topics
const updates = [];
for (const [, topics] of byClass) {
  topics.sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { numeric: true, sensitivity: 'base' })
  );
  topics.forEach((t, i) => {
    updates.push(`UPDATE Topic SET orderIndex = ${i} WHERE id = '${t.id}';`);
  });
}

const sqlFile = 'docs/onboarding/maximo-expo/files/natural-sort-topics.sql';
fs.writeFileSync(sqlFile, updates.join('\n') + '\n');
console.log(`Wrote ${updates.length} UPDATE statements to ${sqlFile}`);

// Execute
console.log('Applying to D1...');
execSync(
  `npx wrangler d1 execute akademo-db --remote --yes --file="${sqlFile}"`,
  { env, stdio: 'inherit' }
);
console.log('Done!');
