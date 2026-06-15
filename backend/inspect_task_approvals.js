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
    const [rows] = await connection.query("SHOW CREATE TABLE task_approvals");
    console.log(rows[0]['Create Table']);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
