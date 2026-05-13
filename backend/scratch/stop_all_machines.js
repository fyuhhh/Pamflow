const mysql = require('mysql2/promise');
require('dotenv').config();

async function stopAllMachines() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pamflow',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Fetching running assets...');
    const [rows] = await pool.query('SELECT id, last_started_at, remaining_seconds FROM assets WHERE is_running = 1');
    
    if (rows.length === 0) {
      console.log('No machines are currently running.');
      return;
    }

    console.log(`Found ${rows.length} running machines. Stopping them...`);

    for (const asset of rows) {
      const now = new Date();
      const startedAt = new Date(asset.last_started_at);
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      const newRemaining = Math.max(0, asset.remaining_seconds - elapsedSeconds);

      await pool.query(
        'UPDATE assets SET is_running = 0, last_started_at = NULL, remaining_seconds = ? WHERE id = ?',
        [newRemaining, asset.id]
      );
      
      console.log(`Stopped asset ID ${asset.id}. Remaining time: ${newRemaining}s`);
    }

    console.log('All machines stopped successfully.');
  } catch (error) {
    console.error('Error stopping machines:', error);
  } finally {
    await pool.end();
  }
}

stopAllMachines();
