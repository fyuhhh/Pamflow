const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Starting migration for assets table...');
    
    // Add columns
    await db.query('ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_running TINYINT(1) DEFAULT 0');
    await db.query('ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_started_at TIMESTAMP NULL');
    await db.query('ALTER TABLE assets ADD COLUMN IF NOT EXISTS remaining_seconds BIGINT DEFAULT 0');
    
    // Initialize remaining_seconds for existing assets based on maintenance_hours
    await db.query('UPDATE assets SET remaining_seconds = maintenance_hours * 3600 WHERE remaining_seconds = 0 AND maintenance_hours > 0');
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
