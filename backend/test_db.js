const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clone_optera'
};

async function test() {
  console.log('Connecting via pool to:', dbConfig.host);
  const pool = mysql.createPool(dbConfig);
  console.log('Pool created!');
  
  const [rows] = await pool.query('SELECT 1 + 1 as result');
  console.log('Pool query result:', rows[0].result);
  
  await pool.end();
  console.log('Pool closed.');
}

test().catch(console.error);
