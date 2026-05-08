const db = require('./src/config/db');

(async () => {
  try {
    // 1. Create task_approvals table
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_approvals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        approved_by_id INT NOT NULL,
        approved_by_name VARCHAR(255),
        approval_status ENUM('Approved', 'Rejected') NOT NULL,
        notes TEXT,
        approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ task_approvals table created');

    // 2. Add can_approve column to users
    try {
      await db.query(`ALTER TABLE users ADD COLUMN can_approve TINYINT(1) DEFAULT 0`);
      console.log('✅ can_approve column added to users');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  can_approve column already exists');
      } else {
        throw e;
      }
    }

    // 3. Set all existing agents to can_approve = 1
    const [result] = await db.query(`UPDATE users SET can_approve = 1 WHERE userType = 'agen'`);
    console.log(`✅ ${result.affectedRows} existing agents set to can_approve = 1`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
})();
