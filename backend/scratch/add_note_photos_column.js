const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Adding photos column to asset_audit_logs...');
    
    // Check if column exists first
    const [cols] = await pool.query('SHOW COLUMNS FROM asset_audit_logs LIKE "photos"');
    if (cols.length === 0) {
      await pool.query('ALTER TABLE asset_audit_logs ADD COLUMN photos LONGTEXT AFTER details');
      console.log('Column "photos" added.');
    } else {
      await pool.query('ALTER TABLE asset_audit_logs MODIFY COLUMN photos LONGTEXT');
      console.log('Column "photos" updated to LONGTEXT.');
    }

    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
}

migrate();
