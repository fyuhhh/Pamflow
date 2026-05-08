// run: node src/config/migrations/run_migration.js
const db = require('../db');

(async () => {
  console.log('=== Starting Migration: Relasi Departemen ===\n');
  try {

    // 1. dept_relations
    await db.query(`
      CREATE TABLE IF NOT EXISTS dept_relations (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        company_id      INT NOT NULL,
        source_dept_id  INT NOT NULL,
        target_dept_id  INT NOT NULL,
        source_name     VARCHAR(100) NOT NULL,
        target_name     VARCHAR(100) NOT NULL,
        is_active       TINYINT(1) NOT NULL DEFAULT 1,
        created_by_id   INT,
        created_by_name VARCHAR(100),
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_dept_relation (company_id, source_dept_id, target_dept_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[OK] Table: dept_relations');

    // 2. checklist_sessions
    await db.query(`
      CREATE TABLE IF NOT EXISTS checklist_sessions (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        company_id        INT NOT NULL,
        dept_id           INT NOT NULL,
        dept_name         VARCHAR(100),
        template_id       INT,
        template_name     VARCHAR(200),
        session_date      DATE NOT NULL,
        session_shift     ENUM('pagi','siang','sore','malam') NOT NULL DEFAULT 'pagi',
        total_items       INT NOT NULL DEFAULT 0,
        ok_count          INT NOT NULL DEFAULT 0,
        broken_count      INT NOT NULL DEFAULT 0,
        item_results      JSON,
        wo_generated_id   INT NULL,
        submitted_by_id   INT,
        submitted_by_name VARCHAR(100),
        submitted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[OK] Table: checklist_sessions');

    // 3. Alter department_tasks - tambah kolom baru
    const newCols = [
      { name: 'wo_items',            def: 'JSON NULL' },
      { name: 'partial_submissions', def: 'JSON NULL' },
      { name: 'parent_wo_id',        def: 'INT NULL' },
      { name: 'checklist_session_id',def: 'INT NULL' },
      { name: 'reopen_count',        def: 'INT NOT NULL DEFAULT 0' },
      { name: 'total_wo_items',      def: 'INT NOT NULL DEFAULT 0' },
      { name: 'fixed_wo_items',      def: 'INT NOT NULL DEFAULT 0' },
    ];

    for (const col of newCols) {
      try {
        await db.query(`ALTER TABLE department_tasks ADD COLUMN ${col.name} ${col.def}`);
        console.log(`[OK] Column added: ${col.name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`[SKIP] Column already exists: ${col.name}`);
        } else {
          console.warn(`[WARN] ${col.name}: ${e.message}`);
        }
      }
    }

    // 4. Indexes (MySQL < 8 tidak support IF NOT EXISTS pada index)
    const indexes = [
      { name: 'idx_cs_dept_date',  table: 'checklist_sessions',  cols: '(dept_id, session_date)' },
      { name: 'idx_dr_company',    table: 'dept_relations',       cols: '(company_id, is_active)' },
      { name: 'idx_dt_parent_wo',  table: 'department_tasks',     cols: '(parent_wo_id)' },
      { name: 'idx_dt_cs_id',      table: 'department_tasks',     cols: '(checklist_session_id)' },
    ];
    for (const idx of indexes) {
      try {
        await db.query(`CREATE INDEX ${idx.name} ON ${idx.table} ${idx.cols}`);
        console.log(`[OK] Index: ${idx.name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') {
          console.log(`[SKIP] Index already exists: ${idx.name}`);
        } else {
          console.warn(`[WARN] Index ${idx.name}: ${e.message}`);
        }
      }
    }

    console.log('\n=== Migration selesai dengan sukses ===');
  } catch (err) {
    console.error('\n[FATAL]', err.message);
  }
  process.exit(0);
})();
