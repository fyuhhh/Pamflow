const db = require('./src/config/db');

async function check() {
  try {
    const [rows] = await db.query('DESCRIBE assets');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
