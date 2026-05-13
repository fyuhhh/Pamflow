const db = require('./src/config/db');

async function check() {
  try {
    const [rows] = await db.query('SELECT firstName, lastName, permissions, role_id FROM users WHERE firstName LIKE "Budi%"');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
