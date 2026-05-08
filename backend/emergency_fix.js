const db = require('./db');
const bcrypt = require('bcrypt');

async function run() {
  const pool = await db();
  console.log('Running emergency fix...');
  try {
    await pool.query("ALTER TABLE users MODIFY COLUMN pin VARCHAR(255)");
    console.log('Altered table users pin to VARCHAR(255)');
    
    const [corruptedUsers] = await pool.query("SELECT id FROM users WHERE CHAR_LENGTH(pin) = 10 AND pin LIKE '$2b$%'");
    if (corruptedUsers.length > 0) {
      const defaultHashedPin = await bcrypt.hash('123456', 10);
      for (const user of corruptedUsers) {
        await pool.query("UPDATE users SET pin = ? WHERE id = ?", [defaultHashedPin, user.id]);
      }
      console.log(`Fixed ${corruptedUsers.length} corrupted PINs (Reset to '123456')`);
    } else {
      console.log('No corrupted PINs found.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit();
}

run();
