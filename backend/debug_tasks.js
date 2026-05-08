const mysql = require('mysql2/promise');
require('dotenv').config({path: '../backend/.env'});

async function test() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clone_optera'
    });

    console.log('--- Current Tasks ---');
    const [tasks] = await db.query('SELECT id, nama_tugas, agen_id, status FROM tasks ORDER BY id DESC LIMIT 10');
    console.log(JSON.stringify(tasks, null, 2));

    console.log('\n--- Checking JSON_CONTAINS behavior ---');
    // Test with string "4"
    const [res1] = await db.query('SELECT id FROM tasks WHERE JSON_CONTAINS(agen_id, CAST("\"4\"" AS JSON))');
    console.log('Result for "4" (string):', res1.length > 0 ? res1.map(r => r.id) : 'None');

    // Test with number 4
    const [res2] = await db.query('SELECT id FROM tasks WHERE JSON_CONTAINS(agen_id, CAST("4" AS JSON))');
    console.log('Result for 4 (number):', res2.length > 0 ? res2.map(r => r.id) : 'None');

    await db.end();
  } catch (e) {
    console.error(e);
  }
}

test();
