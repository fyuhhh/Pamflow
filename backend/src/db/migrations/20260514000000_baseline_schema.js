/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Companies
  if (!await knex.schema.hasTable('companies')) {
    await knex.schema.createTable('companies', table => {
      table.increments('id').primary();
      table.string('orgId', 100).notNullable().defaultTo('PAM');
      table.string('companyId', 100).notNullable().unique();
      table.string('name', 255).notNullable();
      table.string('type', 50).defaultTo('internal');
      table.string('timezone', 255).defaultTo('UTC+07:00');
      table.text('address');
      table.string('phone', 50);
      table.string('status', 50).defaultTo('Aktif');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 2. Organizations
  if (!await knex.schema.hasTable('organizations')) {
    await knex.schema.createTable('organizations', table => {
      table.increments('id').primary();
      table.string('orgId', 100).notNullable().unique();
      table.string('name', 255).notNullable();
      table.string('picName', 255);
      table.string('picEmail', 255);
      table.string('logo', 255);
      table.integer('totalQuota').defaultTo(100);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 3. Departments
  if (!await knex.schema.hasTable('departments')) {
    await knex.schema.createTable('departments', table => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('dept_id', 100).notNullable();
      table.integer('company_id').notNullable();
      table.string('phone', 50);
      table.string('whatsapp', 50);
      table.string('status', 50).defaultTo('Aktif');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 4. Users
  if (!await knex.schema.hasTable('users')) {
    await knex.schema.createTable('users', table => {
      table.increments('id').primary();
      table.string('orgId', 255).notNullable().defaultTo('PAM');
      table.integer('company_id');
      table.string('email', 255).unique().nullable();
      table.string('username', 255).unique().nullable();
      table.string('password', 255).nullable();
      table.string('employeeId', 100);
      table.string('firstName', 255);
      table.string('lastName', 255);
      table.string('phone', 50);
      table.string('role', 100);
      table.integer('role_id');
      table.string('department', 100);
      table.string('userType', 50).defaultTo('admin');
      table.string('pin', 255).defaultTo('123456');
      table.string('status', 50).defaultTo('Aktif');
      table.boolean('can_approve').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 5. Password Reset Requests
  if (!await knex.schema.hasTable('atur_ulang_pw')) {
    await knex.schema.createTable('atur_ulang_pw', table => {
      table.increments('id').primary();
      table.string('orgId', 255);
      table.string('email', 255);
      table.integer('user_id');
      table.string('status', 50).defaultTo('pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 6. Tasks
  if (!await knex.schema.hasTable('tasks')) {
    await knex.schema.createTable('tasks', table => {
      table.increments('id').primary();
      table.string('perusahaan', 255);
      table.integer('company_id');
      table.string('departemen', 255);
      table.string('nama_tugas', 255).notNullable();
      table.string('jenis_tugas', 50).defaultTo('checklist');
      table.string('urgensi', 100);
      table.string('nomor_perintah_kerja', 255);
      table.text('deskripsi');
      table.string('lokasi', 255);
      table.text('detail_alamat');
      table.string('aturan_waktu', 100);
      table.date('tanggal_mulai');
      table.time('waktu_mulai');
      table.date('tanggal_selesai');
      table.time('waktu_selesai');
      table.boolean('pengulangan').defaultTo(false);
      table.string('jenis_pengulangan', 100);
      table.string('waktu_berakhir', 100);
      table.date('tanggal_pengulangan_berakhir');
      table.integer('kali_pengulangan');
      table.boolean('tugas_departemen').defaultTo(false);
      table.integer('dept_task_id');
      table.integer('checklist_session_id');
      table.text('catatan_material');
      table.timestamp('waktu_catatan_material').nullable();
      table.json('agen_id');
      table.boolean('verifikasi_kehadiran').defaultTo(false);
      table.string('maksimum_radius', 50);
      table.string('selfie', 10);
      table.boolean('butuh_persetujuan').defaultTo(false);
      table.string('admin_pemeriksa_id', 100);
      table.string('approval_status', 50).defaultTo('Pending');
      table.json('details');
      table.specificType('submission_data', 'LONGTEXT');
      table.timestamp('waktu_dimulai').nullable();
      table.timestamp('waktu_dikirim').nullable();
      table.timestamp('waktu_selesai_aktual').nullable();
      table.string('progres', 50).defaultTo('Terbuka');
      table.string('status', 50).defaultTo('Draft');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.date('next_recurrence_date').nullable();
      table.integer('recurrence_count').defaultTo(0);
      table.decimal('start_latitude', 10, 8).nullable();
      table.decimal('start_longitude', 11, 8).nullable();
      table.decimal('finish_latitude', 10, 8).nullable();
      table.decimal('finish_longitude', 11, 8).nullable();
    });
  }

  // 7. Department Tasks
  if (!await knex.schema.hasTable('department_tasks')) {
    await knex.schema.createTable('department_tasks', table => {
      table.increments('id').primary();
      table.string('perusahaan', 255);
      table.integer('company_id');
      table.string('departemen_asal', 255);
      table.string('nama_peminta', 255);
      table.string('departemen_tujuan', 255);
      table.string('template', 255);
      table.integer('template_id');
      table.string('nama_wo', 255).notNullable();
      table.string('jenis_tugas', 50).defaultTo('wo');
      table.text('deskripsi');
      table.string('lokasi', 255);
      table.text('detail_alamat');
      table.string('lampiran', 500);
      table.date('tanggal_mulai');
      table.date('tanggal_selesai');
      table.string('urgensi', 100);
      table.string('status', 50).defaultTo('Baru');
      table.integer('accepted_by_id');
      table.string('accepted_by_name', 255);
      table.datetime('waktu_diterima');
      table.json('wo_items');
      table.json('partial_submissions');
      table.integer('checklist_session_id');
      table.integer('total_wo_items').defaultTo(0);
      table.integer('fixed_wo_items').defaultTo(0);
      table.integer('reopen_count').defaultTo(0);
      table.integer('parent_wo_id');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 8. Task History
  if (!await knex.schema.hasTable('task_history')) {
    await knex.schema.createTable('task_history', table => {
      table.increments('id').primary();
      table.integer('task_id').unsigned().references('id').inTable('tasks').onDelete('CASCADE');
      table.string('nama_agen', 255);
      table.string('progres', 50);
      table.timestamp('waktu_mulai').nullable();
      table.timestamp('waktu_selesai').nullable();
      table.json('submission_data');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 9. Push Subscriptions
  if (!await knex.schema.hasTable('push_subscriptions')) {
    await knex.schema.createTable('push_subscriptions', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.text('endpoint').notNullable();
      table.string('p256dh', 255).notNullable();
      table.string('auth', 255).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 10. Audit Logs
  if (!await knex.schema.hasTable('audit_logs')) {
    await knex.schema.createTable('audit_logs', table => {
      table.increments('id').primary();
      table.string('entity_type', 50).notNullable();
      table.integer('entity_id');
      table.integer('user_id');
      table.string('user_name', 255);
      table.string('action', 255).notNullable();
      table.string('action_label', 255);
      table.text('old_value');
      table.text('new_value');
      table.text('notes');
      table.string('ip_address', 100);
      table.text('user_agent');
      table.string('device_brand', 100);
      table.string('device_name', 100);
      table.string('browser', 100);
      table.string('os', 100);
      table.string('page_url', 512);
      table.string('session_id', 128);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 11. Roles
  if (!await knex.schema.hasTable('roles')) {
    await knex.schema.createTable('roles', table => {
      table.increments('id').primary();
      table.integer('company_id');
      table.string('level', 10);
      table.string('name', 255).notNullable();
      table.json('permissions');
      table.string('status', 50).defaultTo('Aktif');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 12. Task Templates
  if (!await knex.schema.hasTable('task_templates')) {
    await knex.schema.createTable('task_templates', table => {
      table.increments('id').primary();
      table.integer('company_id');
      table.integer('department_id');
      table.string('jenis_template', 50).defaultTo('checklist');
      table.string('name', 255).notNullable();
      table.json('details');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 13. Assets
  if (!await knex.schema.hasTable('assets')) {
    await knex.schema.createTable('assets', table => {
      table.increments('id').primary();
      table.integer('company_id');
      table.string('nama_mesin', 255).notNullable();
      table.string('brand', 255);
      table.string('model_tipe', 255);
      table.string('serial_number', 255);
      table.string('lokasi', 255);
      table.string('prioritas', 100);
      table.string('status', 100);
      table.text('catatan');
      table.specificType('lampiran', 'LONGTEXT');
      table.integer('maintenance_hours').defaultTo(0);
      table.integer('remaining_seconds').defaultTo(0);
      table.integer('user_pendaftar_id');
      table.integer('last_operated_by');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 14. Asset Priorities, Statuses, Locations
  if (!await knex.schema.hasTable('asset_priorities')) {
    await knex.schema.createTable('asset_priorities', table => {
      table.increments('id').primary();
      table.integer('company_id');
      table.string('label', 100).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
  if (!await knex.schema.hasTable('asset_statuses')) {
    await knex.schema.createTable('asset_statuses', table => {
      table.increments('id').primary();
      table.integer('company_id');
      table.string('label', 100).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
  if (!await knex.schema.hasTable('asset_locations')) {
    await knex.schema.createTable('asset_locations', table => {
      table.increments('id').primary();
      table.integer('company_id');
      table.string('label', 255).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 15. Asset Logs
  if (!await knex.schema.hasTable('asset_audit_logs')) {
    await knex.schema.createTable('asset_audit_logs', table => {
      table.increments('id').primary();
      table.integer('asset_id');
      table.string('action', 50);
      table.integer('user_id');
      table.text('details');
      table.specificType('photos', 'LONGTEXT');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
  if (!await knex.schema.hasTable('asset_maintenance_logs')) {
    await knex.schema.createTable('asset_maintenance_logs', table => {
      table.increments('id').primary();
      table.integer('asset_id');
      table.string('reason', 255);
      table.text('actions_taken');
      table.string('responsible_person', 255);
      table.integer('old_remaining_seconds');
      table.integer('new_remaining_seconds');
      table.specificType('photos', 'LONGTEXT');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 16. Dept Relations & Checklist Sessions
  if (!await knex.schema.hasTable('dept_relations')) {
    await knex.schema.createTable('dept_relations', table => {
      table.increments('id').primary();
      table.integer('company_id');
      table.integer('source_dept_id');
      table.integer('target_dept_id');
      table.string('source_name', 255);
      table.string('target_name', 255);
      table.boolean('is_active').defaultTo(true);
      table.integer('created_by_id');
      table.string('created_by_name', 255);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
  if (!await knex.schema.hasTable('checklist_sessions')) {
    await knex.schema.createTable('checklist_sessions', table => {
      table.increments('id').primary();
      table.integer('company_id').notNullable();
      table.integer('dept_id').notNullable();
      table.string('dept_name', 255);
      table.integer('template_id');
      table.string('template_name', 255);
      table.date('session_date').notNullable();
      table.string('session_time', 20);
      table.string('session_shift', 50).defaultTo('pagi');
      table.integer('total_items').defaultTo(0);
      table.integer('ok_count').defaultTo(0);
      table.integer('broken_count').defaultTo(0);
      table.json('item_results');
      table.integer('submitted_by_id');
      table.string('submitted_by_name', 255);
      table.integer('wo_generated_id');
      table.timestamp('submitted_at').defaultTo(knex.fn.now());
    });
  }

  // 17. Task Approvals (Legacy/Optional)
  if (!await knex.schema.hasTable('task_approvals')) {
    await knex.schema.createTable('task_approvals', table => {
      table.increments('id').primary();
      table.integer('task_id');
      table.integer('approver_id');
      table.string('status', 50);
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // We don't want to drop tables in the baseline down migration to avoid accidental data loss
  // If needed, specific tables can be dropped here
};
