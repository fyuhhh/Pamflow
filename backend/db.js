const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clone_optera',
  connectionLimit: 100,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 30000
};

async function initializeDB(retries = 5, delay = 5000) {
  while (retries > 0) {
    try {
      // Connect without database first to ensure it exists
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        connectTimeout: 30000
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
      await connection.end();

      // Now connect with database
      const pool = mysql.createPool(dbConfig);

      // 1. Companies
      await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orgId VARCHAR(100) NOT NULL DEFAULT 'PAM',
        companyId VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'internal',
        timezone VARCHAR(255) DEFAULT 'UTC+07:00',
        address TEXT,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Migration: Add orgId to companies
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM companies LIKE 'orgId'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE companies ADD COLUMN orgId VARCHAR(100) NOT NULL DEFAULT 'PAM' AFTER id");
        }
      } catch (e) { }

      // 2. Organizations
      await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orgId VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        picName VARCHAR(255),
        picEmail VARCHAR(255),
        logo VARCHAR(255),
        totalQuota INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Seed PAM Org
      const [orgs] = await pool.query('SELECT * FROM organizations WHERE orgId = ?', ['PAM']);
      if (orgs.length === 0) {
        await pool.query(
          'INSERT INTO organizations (orgId, name, picName, picEmail, totalQuota) VALUES (?, ?, ?, ?, ?)',
          ['PAM', 'PAM', 'Affan', 'affan.ridha@pam-group.com', 100]
        );
      }

      // Seed PAM Company
      const [comps] = await pool.query('SELECT * FROM companies WHERE companyId = ?', ['PAM']);
      if (comps.length === 0) {
        await pool.query(
          'INSERT INTO companies (companyId, orgId, name, type, timezone, address, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['PAM', 'PAM', 'Ewalk Pentacity Mall', 'internal', 'UTC+07:00', 'Not Set', '6285200000000', 'Aktif']
        );
      }

      // 3. Departments
      await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dept_id VARCHAR(100) NOT NULL,
        company_id INT NOT NULL,
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Seed PAM Depts
      const [depts] = await pool.query('SELECT * FROM departments WHERE company_id = (SELECT id FROM companies WHERE companyId = ?)', ['PAM']);
      if (depts.length === 0) {
        const [pamRows] = await pool.query('SELECT id FROM companies WHERE companyId = ?', ['PAM']);
        if (pamRows.length > 0) {
          const pamId = pamRows[0].id;
          const list = ['IT', 'HR & GA', 'OPERASIONAL', 'BUILDING MAINTENANCE'];
          for (const n of list) {
            await pool.query('INSERT INTO departments (name, dept_id, company_id) VALUES (?, ?, ?)', [n, n.substring(0, 3), pamId]);
          }
        }
      }

      // 4. Users
      await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orgId VARCHAR(255) NOT NULL DEFAULT 'PAM',
        company_id INT,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        employeeId VARCHAR(100),
        firstName VARCHAR(255),
        lastName VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(100),
        department VARCHAR(100),
        userType VARCHAR(50) DEFAULT 'admin',
        pin VARCHAR(255) DEFAULT '123456',
        status VARCHAR(50) DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Migration: Add pin to users
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'pin'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE users ADD COLUMN pin VARCHAR(255) DEFAULT '123456' AFTER userType");
          await pool.query("UPDATE users SET pin = '123456' WHERE userType = 'agen' AND (pin IS NULL OR pin = '')");
        }
      } catch (e) { }

      // Migration: Add username to users
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'username'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE users ADD COLUMN username VARCHAR(255) AFTER email");
          // Update existing users: lower(firstName+lastName)
          await pool.query("UPDATE users SET username = LOWER(CONCAT(REPLACE(firstName, ' ', ''), REPLACE(lastName, ' ', ''))) WHERE username IS NULL");
          // Ensure username is unique if possible or at least set
          await pool.query("UPDATE users SET username = CONCAT(username, id) WHERE id IN (SELECT id FROM (SELECT username, id FROM users GROUP BY username HAVING COUNT(*) > 1) as t)");
        }

        // Make email/password nullable for distinct auth
        await pool.query("ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL");
        await pool.query("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL");

        // Add unique index to username if not exists
        const [indexes] = await pool.query("SHOW INDEX FROM users WHERE Key_name = 'idx_username'");
        if (indexes.length === 0) {
          await pool.query("ALTER TABLE users ADD UNIQUE INDEX idx_username (username)");
        }
      } catch (e) { }

      // Sanitizers
      await pool.query("UPDATE companies SET orgId = 'PAM' WHERE orgId IS NULL OR orgId = ''");
      await pool.query("UPDATE users SET orgId = 'PAM' WHERE orgId IS NULL OR orgId = ''");

      // Seed initial user
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['adil@gmail.com']);
      if (users.length === 0) {
        await pool.query(
          'INSERT INTO users (orgId, email, password, firstName, role, department) VALUES (?, ?, ?, ?, ?, ?)',
          ['PAM', 'adil@gmail.com', 'adil', 'Adil', 'Super Admin', 'IT']
        );
      }

      // 4b. Password Reset Requests
      await pool.query(`
      CREATE TABLE IF NOT EXISTS atur_ulang_pw (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orgId VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        user_id INT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // 5. Tasks
      await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        perusahaan VARCHAR(255),
        company_id INT,
        departemen VARCHAR(255),
        nama_tugas VARCHAR(255) NOT NULL,
        jenis_tugas VARCHAR(50) DEFAULT 'checklist',
        urgensi VARCHAR(100),
        nomor_perintah_kerja VARCHAR(255),
        deskripsi TEXT,
        lokasi VARCHAR(255),
        detail_alamat TEXT,
        aturan_waktu VARCHAR(100),
        tanggal_mulai DATE,
        waktu_mulai TIME,
        tanggal_selesai DATE,
        waktu_selesai TIME,
        pengulangan BOOLEAN DEFAULT FALSE,
        jenis_pengulangan VARCHAR(100),
        waktu_berakhir VARCHAR(100),
        tanggal_pengulangan_berakhir DATE,
        kali_pengulangan INT,
        tugas_departemen BOOLEAN DEFAULT FALSE,
        dept_task_id INT DEFAULT NULL,
        agen_id JSON,
        verifikasi_kehadiran BOOLEAN DEFAULT FALSE,
        maksimum_radius VARCHAR(50),
        selfie VARCHAR(10),
        butuh_persetujuan BOOLEAN DEFAULT FALSE,
        admin_pemeriksa_id VARCHAR(100),
        details JSON,
        submission_data LONGTEXT,
        waktu_dimulai TIMESTAMP NULL,
        waktu_dikirim TIMESTAMP NULL,
        waktu_selesai_aktual TIMESTAMP NULL,
        progres VARCHAR(50) DEFAULT 'Terbuka',
        status VARCHAR(50) DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        next_recurrence_date DATE DEFAULT NULL,
        recurrence_count INT DEFAULT 0,
        start_latitude DECIMAL(10, 8) DEFAULT NULL,
        start_longitude DECIMAL(11, 8) DEFAULT NULL,
        finish_latitude DECIMAL(10, 8) DEFAULT NULL,
        finish_longitude DECIMAL(11, 8) DEFAULT NULL
      )
    `);

      // Migration: Add recurrence columns to tasks
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'next_recurrence_date'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE tasks ADD COLUMN next_recurrence_date DATE DEFAULT NULL AFTER created_at");
          await pool.query("ALTER TABLE tasks ADD COLUMN recurrence_count INT DEFAULT 0 AFTER next_recurrence_date");
        }
      } catch (e) { }

      // Migration: Add dept_task_id to tasks
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'dept_task_id'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE tasks ADD COLUMN dept_task_id INT DEFAULT NULL AFTER tugas_departemen");
        }
      } catch (e) { }

      // Migration: Add checklist_session_id to tasks
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'checklist_session_id'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE tasks ADD COLUMN checklist_session_id INT DEFAULT NULL AFTER dept_task_id");
        }
      } catch (e) { console.error('Migration error checklist_session_id:', e); }

      // Migration: Add catatan_material to tasks
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'catatan_material'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE tasks ADD COLUMN catatan_material TEXT DEFAULT NULL AFTER checklist_session_id");
          await pool.query("ALTER TABLE tasks ADD COLUMN waktu_catatan_material TIMESTAMP NULL DEFAULT NULL AFTER catatan_material");
        }
      } catch (e) { }

      // Migration: Add jenis_tugas to tasks
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'jenis_tugas'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE tasks ADD COLUMN jenis_tugas VARCHAR(50) DEFAULT 'checklist' AFTER nama_tugas");
        }
      } catch (e) { }

      // Migration: Add approval_status to tasks
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'approval_status'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE tasks ADD COLUMN approval_status VARCHAR(50) DEFAULT 'Pending' AFTER admin_pemeriksa_id");
        }
      } catch (e) { }

      // Migration: Add GPS columns to tasks
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'start_latitude'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE tasks ADD COLUMN start_latitude DECIMAL(10, 8) DEFAULT NULL");
          await pool.query("ALTER TABLE tasks ADD COLUMN start_longitude DECIMAL(11, 8) DEFAULT NULL");
          await pool.query("ALTER TABLE tasks ADD COLUMN finish_latitude DECIMAL(10, 8) DEFAULT NULL");
          await pool.query("ALTER TABLE tasks ADD COLUMN finish_longitude DECIMAL(11, 8) DEFAULT NULL");
        }
      } catch (e) { }


      // 6. Department Tasks
      await pool.query(`
      CREATE TABLE IF NOT EXISTS department_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        perusahaan VARCHAR(255),
        company_id INT,
        departemen_asal VARCHAR(255),
        nama_peminta VARCHAR(255),
        departemen_tujuan VARCHAR(255),
        template VARCHAR(255),
        nama_wo VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        lokasi VARCHAR(255),
        detail_alamat TEXT,
        lampiran VARCHAR(500),
        tanggal_mulai DATE,
        tanggal_selesai DATE,
        urgensi VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Baru',
        accepted_by_id INT DEFAULT NULL,
        accepted_by_name VARCHAR(255) DEFAULT NULL,
        waktu_diterima DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Migration: Add jenis_tugas to department_tasks
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM department_tasks LIKE 'jenis_tugas'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE department_tasks ADD COLUMN jenis_tugas VARCHAR(50) DEFAULT 'wo' AFTER template_id");
        }
      } catch (e) { }

      // 8. Task History Log (Agent side)
      await pool.query(`
      CREATE TABLE IF NOT EXISTS task_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT,
        nama_agen VARCHAR(255),
        progres VARCHAR(50),
        waktu_mulai TIMESTAMP NULL,
        waktu_selesai TIMESTAMP NULL,
        submission_data JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

      // 8c. Push Subscriptions
      await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY idx_endpoint (endpoint(255)),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

      // 8b. General Audit Logs (Admin & System side)
      await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT,
        user_id INT,
        user_name VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        action_label VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        notes TEXT,
        ip_address VARCHAR(100),
        user_agent TEXT,
        device_brand VARCHAR(100),
        device_name VARCHAR(100),
        browser VARCHAR(100),
        os VARCHAR(100),
        page_url VARCHAR(512),
        session_id VARCHAR(128),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Migration: Add detailed device/session columns to audit_logs (per-column)
      const auditMigrations = [
        { col: 'user_agent', sql: "ALTER TABLE audit_logs ADD COLUMN user_agent TEXT AFTER ip_address" },
        { col: 'device_brand', sql: "ALTER TABLE audit_logs ADD COLUMN device_brand VARCHAR(100) AFTER user_agent" },
        { col: 'device_name', sql: "ALTER TABLE audit_logs ADD COLUMN device_name VARCHAR(100) AFTER device_brand" },
        { col: 'browser', sql: "ALTER TABLE audit_logs ADD COLUMN browser VARCHAR(100) AFTER device_name" },
        { col: 'os', sql: "ALTER TABLE audit_logs ADD COLUMN os VARCHAR(100) AFTER browser" },
        { col: 'page_url', sql: "ALTER TABLE audit_logs ADD COLUMN page_url VARCHAR(512) AFTER os" },
        { col: 'session_id', sql: "ALTER TABLE audit_logs ADD COLUMN session_id VARCHAR(128) AFTER page_url" },
        { col: 'action_label', sql: "ALTER TABLE audit_logs ADD COLUMN action_label VARCHAR(255) AFTER action" },
      ];
      for (const m of auditMigrations) {
        try {
          const [cols] = await pool.query(`SHOW COLUMNS FROM audit_logs LIKE '${m.col}'`);
          if (cols.length === 0) {
            await pool.query(m.sql);
            console.log(`[DB] audit_logs: Added column '${m.col}'.`);
          }
        } catch (e) { console.warn(`[DB] audit_logs migration '${m.col}' skipped:`, e.message); }
      }
      // Allow entity_id to be NULL for navigation/auth logs
      try {
        await pool.query("ALTER TABLE audit_logs MODIFY COLUMN entity_id INT NULL");
      } catch (e) { }


      // 9. Roles & Permissions
      await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        level VARCHAR(10), 
        name VARCHAR(255) NOT NULL,
        permissions JSON,
        status VARCHAR(50) DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // 10. Task Templates
      await pool.query(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        department_id INT,
        name VARCHAR(255) NOT NULL,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // 10.1 Assets
      await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        nama_mesin VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        model_tipe VARCHAR(255),
        serial_number VARCHAR(255),
        lokasi VARCHAR(255),
        prioritas VARCHAR(100),
        status VARCHAR(100),
        catatan TEXT,
        lampiran LONGTEXT,
        maintenance_hours INT DEFAULT 0,
        user_pendaftar_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

      // 10.2 Asset Priorities
      await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_priorities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        label VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // 10.3 Asset Statuses
      await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_statuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        label VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // 10.4 Asset Locations
      await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Seed Default Asset Priorities
      const [prioCheck] = await pool.query('SELECT * FROM asset_priorities LIMIT 1');
      if (prioCheck.length === 0) {
        const defaults = ['Rendah', 'Sedang', 'Tinggi'];
        for (const label of defaults) {
          await pool.query('INSERT INTO asset_priorities (label) VALUES (?)', [label]);
        }
      }

      // Seed Default Asset Statuses
      const [statusCheck] = await pool.query('SELECT * FROM asset_statuses LIMIT 1');
      if (statusCheck.length === 0) {
        const defaults = ['Baik', 'Maintenance', 'Rusak'];
        for (const label of defaults) {
          await pool.query('INSERT INTO asset_statuses (label) VALUES (?)', [label]);
        }
      }

      // Migration: Add jenis_template to task_templates
      try {
        const [cols] = await pool.query("SHOW COLUMNS FROM task_templates LIKE 'jenis_template'");
        if (cols.length === 0) {
          await pool.query("ALTER TABLE task_templates ADD COLUMN jenis_template VARCHAR(50) DEFAULT 'checklist' AFTER department_id");
        }
      } catch (e) { }

      // 10.5 Password Reset Requests
      await pool.query(`
      CREATE TABLE IF NOT EXISTS atur_ulang_pw (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orgId VARCHAR(255),
        email VARCHAR(255),
        user_id INT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Migration: Update users role_id from role name if null
      try {
        await pool.query(`
        UPDATE users u 
        JOIN roles r ON u.role = r.name 
        SET u.role_id = r.id 
        WHERE u.role_id IS NULL OR u.role_id = 0
      `);
        console.log('User roles successfully migrated (linked by name)');
      } catch (e) {
        console.warn('User role migration failed:', e.message);
      }

      // Optimize for large payloads (Images)
      try {
        await pool.query('SET GLOBAL max_allowed_packet = 16777216');
        console.log('Successfully set GLOBAL max_allowed_packet to 16MB');
      } catch (e) {
        console.warn('Could not set GLOBAL max_allowed_packet. Ensure DB user has SUPER privileges or set manually in config.');
      }

      try {
        await pool.query('SET SESSION max_allowed_packet = 16777216');
        console.log('Successfully set SESSION max_allowed_packet to 16MB');
      } catch (e) {
        console.warn('Could not set SESSION max_allowed_packet. In some MySQL versions, this is read-only at session level.');
      }

      // 11. Bcrypt Auto-Migration for Plaintext Passwords & PINs
      try {
        // Emergency Fix for truncated PIN hashes
        await pool.query("ALTER TABLE users MODIFY COLUMN pin VARCHAR(255)");
        const [corruptedUsers] = await pool.query("SELECT id FROM users WHERE CHAR_LENGTH(pin) = 10 AND pin LIKE '$2b$%'");
        if (corruptedUsers.length > 0) {
          const defaultHashedPin = await bcrypt.hash('123456', 10);
          for (const user of corruptedUsers) {
            await pool.query("UPDATE users SET pin = ? WHERE id = ?", [defaultHashedPin, user.id]);
          }
          console.log(`Emergency fixed ${corruptedUsers.length} truncated PINs (Reset to '123456').`);
        }

        const [users] = await pool.query('SELECT id, password, pin FROM users');
        let migratedCount = 0;

        for (const user of users) {
          let updated = false;
          let updateQuery = 'UPDATE users SET ';
          let updateParams = [];

          // Check password
          if (user.password && !user.password.startsWith('$2b$')) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            updateQuery += 'password = ?, ';
            updateParams.push(hashedPassword);
            updated = true;
          }

          // Check pin
          if (user.pin && !user.pin.startsWith('$2b$')) {
            const hashedPin = await bcrypt.hash(user.pin, 10);
            updateQuery += 'pin = ? ';
            updateParams.push(hashedPin);
            updated = true;
          }

          if (updated) {
            if (updateQuery.endsWith(', ')) {
              updateQuery = updateQuery.slice(0, -2); // remove trailing comma
            }
            updateQuery += ' WHERE id = ?';
            updateParams.push(user.id);
            await pool.query(updateQuery, updateParams);
            migratedCount++;
          }
        }
        if (migratedCount > 0) {
          console.log(`Successfully migrated ${migratedCount} user passwords/PINs to bcrypt.`);
        }
      } catch (e) {
        console.warn('Bcrypt auto-migration failed:', e.message);
      }

      // 12. Performance Optimization (Database Indexing)
      const addIndexIfNotExists = async (table, columnName, indexName) => {
        try {
          const [indexes] = await pool.query(`SHOW INDEX FROM ${table} WHERE Key_name = ?`, [indexName]);
          if (indexes.length === 0) {
            await pool.query(`ALTER TABLE ${table} ADD INDEX ${indexName} (${columnName})`);
            console.log(`Index ${indexName} added to ${table}`);
          }
        } catch (e) {
          console.warn(`Could not create index ${indexName} on ${table}:`, e.message);
        }
      };

      await addIndexIfNotExists('tasks', 'company_id', 'idx_tasks_company');
      await addIndexIfNotExists('tasks', 'status', 'idx_tasks_status');
      await addIndexIfNotExists('tasks', 'progres', 'idx_tasks_progres');
      await addIndexIfNotExists('tasks', 'created_at', 'idx_tasks_created_at');

      await addIndexIfNotExists('department_tasks', 'company_id', 'idx_dept_tasks_company');
      await addIndexIfNotExists('department_tasks', 'status', 'idx_dept_tasks_status');
      await addIndexIfNotExists('department_tasks', 'created_at', 'idx_dept_tasks_created_at');

      await addIndexIfNotExists('users', 'company_id', 'idx_users_company');
      await addIndexIfNotExists('users', 'department', 'idx_users_department');

      console.log('Database initialized successfully.');
      return pool;
    } catch (err) {
      console.error(`Database initialization failed (${retries} retries left):`, err.message);
      retries -= 1;
      if (retries === 0) {
        console.error('All retries failed. Exiting...');
        process.exit(1);
      }
      console.log(`Waiting ${delay / 1000} seconds before retrying...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

module.exports = initializeDB;
