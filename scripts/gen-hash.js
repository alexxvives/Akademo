const bcrypt = require('bcryptjs');
const fs = require('fs');
bcrypt.hash('Akademo2024!', 12).then(h => {
  const sql = `UPDATE User SET password='${h}' WHERE id='admin';`;
  fs.writeFileSync('scripts/reset-admin-password.sql', sql);
  console.log('SQL file written. Hash prefix:', h.slice(0, 7));
});
