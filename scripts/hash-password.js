// scripts/hash-password.js — run locally: node scripts/hash-password.js <password>
// Prints a bcrypt (cost 12) hash to paste into sql/schema.sql or straight
// into the users.password_hash column for a password reset.
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}
bcrypt.hash(password, 12).then((hash) => {
  console.log(hash);
});
