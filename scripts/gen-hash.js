/**
 * Generate a bcrypt password hash and print the SQL UPDATE to reset the admin password.
 *
 * Usage:
 *   node scripts/gen-hash.js <plaintext-password>
 *
 * Then run the printed SQL via:
 *   npx wrangler d1 execute akademo-db --remote --command "UPDATE User SET password='<hash>' WHERE id='admin'"
 *
 * Never commit plaintext passwords or generated SQL files.
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/gen-hash.js <plaintext-password>');
  process.exit(1);
}

bcrypt.hash(password, 12).then(hash => {
  console.log('\nRun this command to apply:\n');
  console.log(`npx wrangler d1 execute akademo-db --remote --command "UPDATE User SET password='${hash}' WHERE id='admin'"`);
  console.log('\nDo NOT save this output to a file or commit it.\n');
});
