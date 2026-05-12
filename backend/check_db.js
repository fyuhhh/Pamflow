const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Adding checklist_session_id...');
    await connection.query("ALTER TABLE tasks ADD COLUMN checklist_session_id INT DEFAULT NULL AFTER dept_task_id");
    console.log('Added checklist_session_id');
  } catch (e) {
    console.log('checklist_session_id error:', e.message);
  }

  try {
    console.log('Adding catatan_material...');
    await connection.query("ALTER TABLE tasks ADD COLUMN catatan_material TEXT DEFAULT NULL AFTER checklist_session_id");
    await connection.query("ALTER TABLE tasks ADD COLUMN waktu_catatan_material TIMESTAMP NULL DEFAULT NULL AFTER catatan_material");
    console.log('Added catatan_material');
  } catch (e) {
    console.log('catatan_material error:', e.message);
  }

  const [cols] = await connection.query('SHOW COLUMNS FROM tasks');
  console.log('Columns in tasks:', cols.map(c => c.Field));
  process.exit(0);
}
run();
