const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clone_optera'
};

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('Adding last_operated_by to assets table...');
    await connection.query(`
      ALTER TABLE assets 
      ADD COLUMN last_operated_by INT NULL AFTER remaining_seconds,
      ADD CONSTRAINT fk_assets_operated_by FOREIGN KEY (last_operated_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('Migration successful!');
  } catch (error) {
    if (error.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column last_operated_by already exists.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await connection.end();
  }
}

migrate();
