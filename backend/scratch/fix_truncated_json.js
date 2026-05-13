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
    console.log('Altering tables to use LONGTEXT for JSON data...');
    
    // Update assets table
    await pool.query('ALTER TABLE assets MODIFY COLUMN lampiran LONGTEXT');
    
    // Update asset_maintenance_logs table
    await pool.query('ALTER TABLE asset_maintenance_logs MODIFY COLUMN photos LONGTEXT');
    
    // Update asset_audit_logs table (in case details are large)
    await pool.query('ALTER TABLE asset_audit_logs MODIFY COLUMN details LONGTEXT');

    console.log('Migration successful: Columns updated to LONGTEXT.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
}

migrate();
