const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clone_optera'
  });

  try {
    console.log('Adding columns to tasks table...');
    await connection.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS catatan_pengerjaan TEXT AFTER catatan_material,
      ADD COLUMN IF NOT EXISTS waktu_catatan_pengerjaan TIMESTAMP NULL DEFAULT NULL AFTER catatan_pengerjaan
    `);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
