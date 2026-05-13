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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_maintenance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id INT NOT NULL,
        user_id INT NOT NULL,
        reason TEXT,
        responsible_person VARCHAR(255),
        actions_taken TEXT,
        photos TEXT,
        old_remaining_seconds INT,
        new_remaining_seconds INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      )
    `);
    console.log('Table asset_maintenance_logs created or already exists.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
}

migrate();
