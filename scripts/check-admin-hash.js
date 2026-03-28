// Verify admin password update 
const { execSync } = require('child_process');
const output = execSync('npx wrangler d1 execute akademo-db --remote --command "SELECT password FROM User WHERE id=\'admin\'"', {
  encoding: 'utf8',
  cwd: 'C:\\Users\\alexx\\Desktop\\Projects\\AKADEMO'
});
console.log(output);
