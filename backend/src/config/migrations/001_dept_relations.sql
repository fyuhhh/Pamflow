-- ============================================================
-- Migration 001: Fitur Relasi Departemen
-- Jalankan sekali di database pamflow_db
-- ============================================================

-- -------------------------------------------------------------
-- 1. Tabel relasi antar departemen
-- -------------------------------------------------------------
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
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_dept_relation (company_id, source_dept_id, target_dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. Tabel sesi checklist harian
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_sessions (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  company_id          INT NOT NULL,
  dept_id             INT NOT NULL,
  dept_name           VARCHAR(100),
  template_id         INT,
  template_name       VARCHAR(200),
  session_date        DATE NOT NULL,
  session_shift       ENUM('pagi','siang','sore','malam') NOT NULL DEFAULT 'pagi',
  total_items         INT NOT NULL DEFAULT 0,
  ok_count            INT NOT NULL DEFAULT 0,
  broken_count        INT NOT NULL DEFAULT 0,
  item_results        JSON,
  -- Format item_results:
  -- [{"id": 1, "name": "CCTV Lobby", "status": "ok"|"rusak", "notes": "...", "photo_url": "..."}]
  wo_generated_id     INT NULL,          -- FK ke department_tasks.id
  submitted_by_id     INT,
  submitted_by_name   VARCHAR(100),
  submitted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. Tambah kolom baru ke department_tasks
-- -------------------------------------------------------------

-- Item-item checklist yang perlu diperbaiki
-- Format: [{"id":1,"name":"CCTV Lobby","status":"pending"|"fixed"|"cant_fix","fixed_at":null,"fixed_by":null,"notes":"","photo_url":""}]
ALTER TABLE department_tasks
  ADD COLUMN IF NOT EXISTS wo_items JSON NULL AFTER lampiran;

-- Riwayat setiap partial submission (audit trail)
-- Format: [{"submitted_at":"...","submitted_by_id":1,"submitted_by_name":"...","items_fixed":[1,3],"notes":"...","photo_urls":["..."]}]
ALTER TABLE department_tasks
  ADD COLUMN IF NOT EXISTS partial_submissions JSON NULL AFTER wo_items;

-- Referensi ke WO induk (untuk kasus re-open)
ALTER TABLE department_tasks
  ADD COLUMN IF NOT EXISTS parent_wo_id INT NULL AFTER partial_submissions;

-- Referensi ke sesi checklist yang men-generate WO ini
ALTER TABLE department_tasks
  ADD COLUMN IF NOT EXISTS checklist_session_id INT NULL AFTER parent_wo_id;

-- Berapa kali WO ini sudah di-reopen
ALTER TABLE department_tasks
  ADD COLUMN IF NOT EXISTS reopen_count INT NOT NULL DEFAULT 0 AFTER checklist_session_id;

-- Total item & item yang sudah selesai (untuk progress bar cepat)
ALTER TABLE department_tasks
  ADD COLUMN IF NOT EXISTS total_wo_items INT NOT NULL DEFAULT 0 AFTER reopen_count;

ALTER TABLE department_tasks
  ADD COLUMN IF NOT EXISTS fixed_wo_items INT NOT NULL DEFAULT 0 AFTER total_wo_items;

-- Update ENUM status jika belum ada nilai baru
-- Perlu cek dulu apakah kolom status bertipe ENUM atau VARCHAR
-- Jika VARCHAR, tidak perlu ALTER. Jika ENUM, jalankan:
-- ALTER TABLE department_tasks MODIFY COLUMN status ENUM('Terkirim','Diterima','Berlangsung','Partial WO','Menunggu Pengerjaan','Menunggu Approval','Selesai','Ditolak','Diajukan Ulang') NOT NULL DEFAULT 'Terkirim';

-- Jika kolom status bertipe VARCHAR (lebih fleksibel), tidak perlu ALTER sama sekali.
-- Cek dengan: SHOW COLUMNS FROM department_tasks LIKE 'status';

-- -------------------------------------------------------------
-- 4. Index untuk performa query
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_checklist_sessions_dept_date
  ON checklist_sessions (dept_id, session_date);

CREATE INDEX IF NOT EXISTS idx_dept_relations_company
  ON dept_relations (company_id, is_active);

CREATE INDEX IF NOT EXISTS idx_dept_tasks_parent_wo
  ON department_tasks (parent_wo_id);

CREATE INDEX IF NOT EXISTS idx_dept_tasks_checklist_session
  ON department_tasks (checklist_session_id);
