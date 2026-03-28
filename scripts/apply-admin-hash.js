const { execSync } = require('child_process');
const fs = require('fs');

const sql = fs.readFileSync('scripts/reset-admin-password.sql', 'utf8');
const hash = sql.match(/password='([^']+)'/)[1];
console.log('Hash to insert:', hash);

// Use --command with the exact hash
const command = `npx wrangler d1 execute akademo-db --remote --command "UPDATE User SET password='${hash}' WHERE id='admin'"`;
console.log('Running command...');
try {
  const output = execSync(command, { encoding: 'utf8', cwd: 'C:\\Users\\alexx\\Desktop\\Projects\\AKADEMO' });
  console.log('Output:', output);
} catch (e) {
  console.error('Error:', e.message);
  console.error('stdout:', e.stdout);
  console.error('stderr:', e.stderr);
}
