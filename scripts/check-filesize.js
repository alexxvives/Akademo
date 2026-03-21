#!/usr/bin/env node
/**
 * File size checker — enforces the 250-line max component rule.
 * Run: npm run check:filesize
 * 
 * Exits with code 1 if any file exceeds the limit.
 */
const fs = require('fs');
const path = require('path');

const MAX_LINES = 250;
const SCAN_DIRS = ['src/app', 'src/components', 'src/hooks', 'src/lib'];
const EXTENSIONS = ['.ts', '.tsx'];

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getFiles(full, files);
    } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

let violations = 0;
for (const dir of SCAN_DIRS) {
  for (const file of getFiles(dir)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n').length;
    if (lines > MAX_LINES) {
      const rel = path.relative('.', file).replace(/\\/g, '/');
      console.log(`  ❌ ${rel} — ${lines} lines (limit: ${MAX_LINES})`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.log(`\n⚠️  ${violations} file(s) exceed the ${MAX_LINES}-line limit.`);
  process.exit(1);
} else {
  console.log(`✅ All files within ${MAX_LINES}-line limit.`);
}
