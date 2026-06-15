const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clone_optera',
  };
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('Adding dispatch approval columns to department_tasks...');
    await connection.query(`
      ALTER TABLE department_tasks
      ADD COLUMN dispatch_approved_by_id INT(11) DEFAULT NULL,
      ADD COLUMN dispatch_approved_by_name VARCHAR(255) DEFAULT NULL,
      ADD COLUMN dispatch_approval_status VARCHAR(50) DEFAULT NULL,
      ADD COLUMN dispatch_approval_notes TEXT DEFAULT NULL,
      ADD COLUMN dispatch_approved_at DATETIME DEFAULT NULL
    `);
    console.log('Migration successful!');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN') {
      console.log('Columns already exist.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    await connection.end();
  }
}

run();
