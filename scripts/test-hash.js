const b = require('bcryptjs');
const fs = require('fs');
const sql = fs.readFileSync('scripts/reset-admin-password.sql', 'utf8');
// Extract hash from SQL
const match = sql.match(/password='([^']+)'/);
if (!match) { console.log('No hash found'); process.exit(1); }
const h = match[1];
console.log('Hash from file:', h);
b.compare('Akademo2024!', h).then(r => console.log('Akademo2024! match:', r));
