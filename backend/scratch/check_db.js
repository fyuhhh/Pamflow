const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDepts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clone_optera'
  });

  const [rows] = await connection.query('SELECT * FROM departments');
  console.log('Departments in DB:', JSON.stringify(rows, null, 2));
  
  const [templates] = await connection.query('SELECT id, name, company_id, department_id FROM task_templates');
  console.log('Templates in DB:', JSON.stringify(templates, null, 2));

  await connection.end();
}

checkDepts().catch(console.error);
