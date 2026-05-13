const db = require('./src/config/db');

async function migrate() {
  try {
    await db.query('ALTER TABLE users ADD COLUMN permissions LONGTEXT');
    console.log('Column "permissions" added to users table.');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column "permissions" already exists.');
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  }
}

migrate();
