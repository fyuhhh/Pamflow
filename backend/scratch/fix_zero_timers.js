const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Fixing assets with 0 remaining seconds but positive maintenance hours...');
    
    const [result] = await pool.query(
      'UPDATE assets SET remaining_seconds = maintenance_hours * 3600 WHERE remaining_seconds = 0 AND maintenance_hours > 0 AND is_running = 0'
    );
    
    console.log(`Updated ${result.affectedRows} assets.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fix();
