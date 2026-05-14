const pool = require('../config/db');
const { processBase64InObject } = require('../utils/fileHelper');
const path = require('path');
const fs = require('fs');

async function migrate() {
  console.log('🚀 Memulai migrasi gambar dari Base64 ke File System...');
  
  try {
    // 1. Migrasi table 'assets'
    console.log('\n--- Memproses table: assets ---');
    const [assets] = await pool.query('SELECT id, lampiran FROM assets WHERE lampiran IS NOT NULL');
    for (const asset of assets) {
      const processed = processBase64InObject(asset.lampiran, 'assets');
      if (JSON.stringify(processed) !== JSON.stringify(asset.lampiran)) {
        await pool.query('UPDATE assets SET lampiran = ? WHERE id = ?', [JSON.stringify(processed), asset.id]);
        console.log(`✅ Asset ID ${asset.id} diperbarui.`);
      }
    }

    // 2. Migrasi table 'asset_audit_logs'
    console.log('\n--- Memproses table: asset_audit_logs ---');
    const [auditLogs] = await pool.query('SELECT id, photos FROM asset_audit_logs WHERE photos IS NOT NULL');
    for (const log of auditLogs) {
      const processed = processBase64InObject(log.photos, 'assets');
      if (JSON.stringify(processed) !== JSON.stringify(log.photos)) {
        await pool.query('UPDATE asset_audit_logs SET photos = ? WHERE id = ?', [JSON.stringify(processed), log.id]);
        console.log(`✅ Audit Log ID ${log.id} diperbarui.`);
      }
    }

    // 3. Migrasi table 'asset_maintenance_logs'
    console.log('\n--- Memproses table: asset_maintenance_logs ---');
    const [maintLogs] = await pool.query('SELECT id, photos FROM asset_maintenance_logs WHERE photos IS NOT NULL');
    for (const log of maintLogs) {
      const processed = processBase64InObject(log.photos, 'assets');
      if (JSON.stringify(processed) !== JSON.stringify(log.photos)) {
        await pool.query('UPDATE asset_maintenance_logs SET photos = ? WHERE id = ?', [JSON.stringify(processed), log.id]);
        console.log(`✅ Maintenance Log ID ${log.id} diperbarui.`);
      }
    }

    // 4. Migrasi table 'tasks' (submission_data)
    console.log('\n--- Memproses table: tasks (submission_data) ---');
    const [tasks] = await pool.query('SELECT id, submission_data FROM tasks WHERE submission_data IS NOT NULL');
    for (const task of tasks) {
      const processed = processBase64InObject(task.submission_data, 'tasks');
      if (JSON.stringify(processed) !== JSON.stringify(task.submission_data)) {
        await pool.query('UPDATE tasks SET submission_data = ? WHERE id = ?', [JSON.stringify(processed), task.id]);
        console.log(`✅ Task ID ${task.id} diperbarui.`);
      }
    }

    // 5. Migrasi table 'checklist_sessions' (item_results)
    console.log('\n--- Memproses table: checklist_sessions ---');
    const [sessions] = await pool.query('SELECT id, item_results FROM checklist_sessions WHERE item_results IS NOT NULL');
    for (const session of sessions) {
      const processed = processBase64InObject(session.item_results, 'checklists');
      if (JSON.stringify(processed) !== JSON.stringify(session.item_results)) {
        await pool.query('UPDATE checklist_sessions SET item_results = ? WHERE id = ?', [JSON.stringify(processed), session.id]);
        console.log(`✅ Checklist Session ID ${session.id} diperbarui.`);
      }
    }

    // 6. Migrasi table 'department_tasks'
    console.log('\n--- Memproses table: department_tasks ---');
    const [deptTasks] = await pool.query('SELECT id, lampiran, wo_items, partial_submissions FROM department_tasks');
    for (const dt of deptTasks) {
      let needsUpdate = false;
      let updateLampiran = dt.lampiran;
      let updateWoItems = dt.wo_items;
      let updatePartial = dt.partial_submissions;

      if (dt.lampiran) {
        const proc = processBase64InObject(dt.lampiran, 'dept-tasks');
        if (JSON.stringify(proc) !== JSON.stringify(dt.lampiran)) {
          updateLampiran = typeof proc === 'string' ? proc : JSON.stringify(proc);
          needsUpdate = true;
        }
      }

      if (dt.wo_items) {
        const proc = processBase64InObject(dt.wo_items, 'dept-tasks');
        if (JSON.stringify(proc) !== JSON.stringify(dt.wo_items)) {
          updateWoItems = JSON.stringify(proc);
          needsUpdate = true;
        }
      }

      if (dt.partial_submissions) {
        const proc = processBase64InObject(dt.partial_submissions, 'dept-tasks');
        if (JSON.stringify(proc) !== JSON.stringify(dt.partial_submissions)) {
          updatePartial = JSON.stringify(proc);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await pool.query(
          'UPDATE department_tasks SET lampiran = ?, wo_items = ?, partial_submissions = ? WHERE id = ?',
          [updateLampiran, updateWoItems, updatePartial, dt.id]
        );
        console.log(`✅ Dept Task ID ${dt.id} diperbarui.`);
      }
    }

    console.log('\n✨ Migrasi Selesai 100%!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat migrasi:', error);
    process.exit(1);
  }
}

migrate();
