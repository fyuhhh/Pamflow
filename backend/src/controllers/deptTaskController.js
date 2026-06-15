const db = require('../config/db');
const { logAudit } = require('../services/auditService');
const socketService = require('../services/socketService');
const { notifyUsers } = require('../services/pushService');
const { processBase64InObject } = require('../utils/fileHelper');

// Helper: format Date to local YYYY-MM-DD string to prevent timezone shift
const formatLocalDate = (d) => {
  if (!d) return null;
  if (d instanceof Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return d;
};

const formatDeptTaskDates = (task) => ({
  ...task,
  tanggal_mulai: formatLocalDate(task.tanggal_mulai),
  tanggal_selesai: formatLocalDate(task.tanggal_selesai),
});

const getDeptTasks = async (req, res) => {
  const { company_id, departemen_tujuan } = req.query;
  try {
    let query = `
      SELECT dt.*, dt.created_at as last_update_at, d_asal.dept_id as dept_id_asal,
             t.progres as agent_progres, t.catatan_material, t.waktu_catatan_material,
             t.catatan_pengerjaan, t.waktu_catatan_pengerjaan, t.waktu_material_dicek
      FROM department_tasks dt
      LEFT JOIN departments d_asal ON d_asal.name = dt.departemen_asal AND d_asal.company_id = dt.company_id
      LEFT JOIN (
        SELECT t1.dept_task_id, t1.progres, t1.catatan_material, t1.waktu_catatan_material,
               t1.catatan_pengerjaan, t1.waktu_catatan_pengerjaan, t1.waktu_material_dicek
        FROM tasks t1
        JOIN (
          SELECT dept_task_id, MAX(created_at) as max_created
          FROM tasks
          WHERE dept_task_id IS NOT NULL
          GROUP BY dept_task_id
        ) t2 ON t1.dept_task_id = t2.dept_task_id AND t1.created_at = t2.max_created
      ) t ON t.dept_task_id = dt.id
    `;
    let params = [];
    let conditions = [];

    if (company_id) {
      conditions.push('dt.company_id = ?');
      params.push(company_id);
    }

    if (departemen_tujuan) {
      conditions.push('dt.departemen_tujuan = ?');
      params.push(departemen_tujuan);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY dt.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows.map(formatDeptTaskDates));
  } catch (err) {
    console.error('Fetch department tasks error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDeptTask = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT dt.*, d_asal.dept_id as dept_id_asal
       FROM department_tasks dt
       LEFT JOIN departments d_asal ON d_asal.name = dt.departemen_asal AND d_asal.company_id = dt.company_id
       WHERE dt.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Department task not found' });
    res.json(formatDeptTaskDates(rows[0]));
  } catch (err) {
    console.error('Fetch single department task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createDeptTask = async (req, res) => {
  const {
    perusahaan, company_id, departemen_asal, nama_peminta, departemen_tujuan, template, template_id,
    nama_wo, deskripsi, lokasi, detail_alamat, lampiran,
    tanggal_mulai, tanggal_selesai, urgensi, jenis_tugas,
    wo_items, checklist_session_id
  } = req.body;

  try {
    const woItemsJson = Array.isArray(wo_items) ? JSON.stringify(wo_items) : '[]';
    const totalWoItems = Array.isArray(wo_items) ? wo_items.length : 0;

    // Process base64 in lampiran
    const processedLampiran = await processBase64InObject(lampiran, 'dept-tasks');

    const [result] = await db.query(
      `INSERT INTO department_tasks (
        perusahaan, company_id, departemen_asal, nama_peminta, departemen_tujuan, template, template_id,
        nama_wo, jenis_tugas, deskripsi, lokasi, detail_alamat, lampiran,
        tanggal_mulai, tanggal_selesai, urgensi,
        wo_items, partial_submissions, total_wo_items, checklist_session_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, 'Menunggu Approval (Dikirim)')`,
      [
        perusahaan, company_id, departemen_asal, nama_peminta, departemen_tujuan, template || null, template_id || null,
        nama_wo, jenis_tugas || 'wo', deskripsi || null, lokasi || null, detail_alamat || null, 
        processedLampiran ? (typeof processedLampiran === 'string' ? processedLampiran : JSON.stringify(processedLampiran)) : null,
        tanggal_mulai || null, tanggal_selesai || null, urgensi,
        woItemsJson, totalWoItems, checklist_session_id || null
      ]
    );

    // Sync to sender company for general updates
    socketService.emitToCompany(company_id, 'dept-task-created-for-approval', {
      id: result.insertId,
      nama_wo,
      departemen_asal
    });

    // Notify sender department managers/supervisors/atasans
    try {
      const [approvers] = await db.query(
        `SELECT id FROM users 
         WHERE company_id = ? AND department = ? AND status = 'Aktif'
           AND (role LIKE '%manager%' OR role LIKE '%supervisor%' OR role LIKE '%kepala%' OR role LIKE '%atasan%')`,
        [company_id, departemen_asal]
      );
      const approverIds = approvers.map(u => u.id);
      if (approverIds.length > 0) {
        await notifyUsers(db, approverIds, {
          title: `WO/Checklist Butuh Approval: ${nama_wo}`,
          body: `Permintaan dari ${nama_peminta} menunggu persetujuan Anda untuk dikirim.`,
          url: `/demo/mobile/approvals`
        });
      }
    } catch (pushErr) {
      console.error('[DeptTaskController] Push approvers error:', pushErr.message);
    }

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: result.insertId,
      action: 'CREATE',
      new_value: { nama_wo, departemen_asal, departemen_tujuan, urgensi, jenis_tugas },
      notes: `Membuat Tugas Departemen (WO) baru: "${nama_wo}" dari ${departemen_asal} ke ${departemen_tujuan}`,
      req
    });

    res.status(201).json({ message: 'Department task created successfully, pending approval', id: result.insertId });
  } catch (err) {
    console.error('Create department task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const acceptDeptTask = async (req, res) => {
  const { accepted_by_id, accepted_by_name } = req.body;
  try {
    await db.query(
      `UPDATE department_tasks SET 
        status = 'Diterima',
        accepted_by_id = ?,
        accepted_by_name = ?,
        waktu_diterima = NOW()
      WHERE id = ?`,
      [accepted_by_id, accepted_by_name, req.params.id]
    );
    // Real-time Sync
    const [taskRows] = await db.query('SELECT company_id FROM department_tasks WHERE id = ?', [req.params.id]);
    socketService.emitToCompany(taskRows[0]?.company_id, 'dept-task-updated', { id: req.params.id, status: 'Diterima' });

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: req.params.id,
      action: 'ACCEPT',
      notes: `Tugas Departemen disetujui/diterima oleh ${accepted_by_name}`,
      req
    });

    res.status(200).json({ message: 'Task accepted successfully' });
  } catch (err) {
    console.error('Accept department task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const rejectDeptTask = async (req, res) => {
  const { rejected_by_id, rejected_by_name } = req.body;
  try {
    await db.query(
      `UPDATE department_tasks SET 
        status = 'Ditolak',
        accepted_by_id = ?,
        accepted_by_name = ?,
        waktu_diterima = NOW()
      WHERE id = ?`,
      [rejected_by_id, rejected_by_name, req.params.id]
    );
    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: req.params.id,
      action: 'REJECT',
      notes: `Tugas Departemen ditolak oleh ${rejected_by_name}`,
      req
    });

    res.status(200).json({ message: 'Task rejected successfully' });
  } catch (err) {
    console.error('Reject department task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeDeptTask = async (req, res) => {
  try {
    await db.query('DELETE FROM department_tasks WHERE id = ?', [req.params.id]);

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: req.params.id,
      action: 'DELETE',
      notes: `Menghapus Tugas Departemen (ID: ${req.params.id})`,
      req
    });

    res.status(200).json({ message: 'Department task deleted successfully' });
  } catch (err) {
    console.error('Delete department task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const claimAndStartDeptTask = async (req, res) => {
  const { agent_id, agent_name } = req.body;
  const { id } = req.params;

  try {
    // 1. Get Department Task details
    const [dtRows] = await db.query('SELECT * FROM department_tasks WHERE id = ?', [id]);
    if (dtRows.length === 0) return res.status(404).json({ message: 'Department task not found' });
    const dt = dtRows[0];

    // 2. Update Department Task status to 'Berlangsung'
    await db.query(
      `UPDATE department_tasks SET 
        status = 'Berlangsung',
        accepted_by_id = ?,
        accepted_by_name = ?,
        waktu_diterima = NOW()
      WHERE id = ?`,
      [agent_id, agent_name, id]
    );

    // 3. Create Agent Task
    // Map department_tasks fields to tasks fields
    const isAuditTask = dt.checklist_session_id != null;
    const initialProgress = isAuditTask ? 'Menunggu Material' : 'Berlangsung';

    const [result] = await db.query(
      `INSERT INTO tasks (
        perusahaan, company_id, departemen, nama_tugas, jenis_tugas, urgensi, 
        deskripsi, lokasi, detail_alamat, tanggal_mulai, tanggal_selesai,
        tugas_departemen, dept_task_id, checklist_session_id, agen_id, progres, status, waktu_dimulai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        dt.perusahaan, dt.company_id, dt.departemen_tujuan, dt.nama_wo, dt.jenis_tugas || 'wo', dt.urgensi,
        dt.deskripsi, dt.lokasi, dt.detail_alamat, dt.tanggal_mulai, dt.tanggal_selesai,
        false, id, dt.checklist_session_id, JSON.stringify([agent_id]), initialProgress, 'Aktif'
      ]
    );

    const newTaskId = result.insertId;

    // 4. Record in history
    await db.query(
      'INSERT INTO task_history (task_id, nama_agen, progres, waktu_mulai) VALUES (?, ?, ?, NOW())',
      [newTaskId, agent_name || 'Agen', initialProgress]
    );

    // 5. Real-time Sync
    socketService.emitToCompany(dt.company_id, 'dept-task-updated', { id, status: 'Berlangsung' });
    socketService.emitToCompany(dt.company_id, 'task-created', { id: newTaskId, nama_tugas: dt.nama_wo });

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: id,
      action: 'CLAIM',
      notes: `Agen ${agent_name} mengklaim dan mulai mengerjakan Tugas Departemen: "${dt.nama_wo}"`,
      req
    });

    res.status(200).json({
      message: 'Task claimed and started successfully',
      taskId: newTaskId
    });
  } catch (err) {
    console.error('Claim & Start dept task error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// PATCH /department-tasks/:id/partial-submit
// Engineering simpan progress sebagian item selesai
// Body: submitted_by_id, submitted_by_name, fixed_item_ids: [1,3], notes, photo_urls
// ================================================================
const submitPartial = async (req, res) => {
  const { id } = req.params;
  const { submitted_by_id, submitted_by_name, fixed_item_ids, notes, photo_urls } = req.body;

  if (!Array.isArray(fixed_item_ids)) {
    return res.status(400).json({ message: 'fixed_item_ids harus berupa array' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM department_tasks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'WO tidak ditemukan' });
    const task = rows[0];

    if (['Selesai', 'Ditolak'].includes(task.status)) {
      return res.status(400).json({ message: `WO sudah berstatus ${task.status}, tidak bisa diupdate` });
    }

    // Parse wo_items
    let woItems = typeof task.wo_items === 'string' ? JSON.parse(task.wo_items) : (task.wo_items || []);
    let partialSubs = typeof task.partial_submissions === 'string'
      ? JSON.parse(task.partial_submissions) : (task.partial_submissions || []);

    // Update status item yang sudah diselesaikan
    const now = new Date().toISOString();
    woItems = woItems.map(item => {
      if (fixed_item_ids.includes(item.id)) {
        return {
          ...item,
          status: 'fixed',
          fixed_at: now,
          fixed_by_id: submitted_by_id || null,
          fixed_by_name: submitted_by_name || null
        };
      }
      return item;
    });

    const fixedCount = woItems.filter(i => i.status === 'fixed').length;
    const totalCount = woItems.length;

    // Process base64 in photo_urls
    const processedPhotos = await processBase64InObject(photo_urls, 'dept-tasks');

    // Record partial submission ke history
    partialSubs.push({
      submitted_at: now,
      submitted_by_id: submitted_by_id || null,
      submitted_by_name: submitted_by_name || null,
      items_fixed: fixed_item_ids,
      notes: notes || '',
      photo_urls: processedPhotos || []
    });

    await db.query(
      `UPDATE department_tasks SET
        wo_items = ?, partial_submissions = ?,
        fixed_wo_items = ?, status = 'Partial WO'
       WHERE id = ?`,
      [JSON.stringify(woItems), JSON.stringify(partialSubs), fixedCount, id]
    );

    // Notif ke Operasional (dept asal)
    try {
      const [srcUsers] = await db.query(
        'SELECT id FROM users WHERE company_id = ? AND department = ? AND status = "Aktif"',
        [task.company_id, task.departemen_asal]
      );
      const srcIds = srcUsers.map(u => u.id);
      if (srcIds.length > 0) {
        await notifyUsers(db, srcIds, {
          title: `Progress WO: ${task.nama_wo}`,
          body: `Engineering selesaikan ${fixedCount} dari ${totalCount} item`,
          url: `/tugas-departemen/terkirim`
        });
      }
    } catch (pushErr) {
      console.error('[DeptTask] Push notif partial error:', pushErr.message);
    }

    socketService.emitToCompany(task.company_id, 'dept-task-updated', {
      id, status: 'Partial WO', fixed: fixedCount, total: totalCount
    });

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: id,
      action: 'UPDATE',
      notes: `Engineering (${submitted_by_name}) menyelesaikan progress sebagian: ${fixedCount} dari ${totalCount} item selesai. Catatan: ${notes || '-'}`,
      req
    });

    res.json({
      message: `Progress disimpan: ${fixedCount} dari ${totalCount} item selesai`,
      fixed_count: fixedCount,
      total_count: totalCount
    });
  } catch (err) {
    console.error('[DeptTask] submitPartial error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// PATCH /department-tasks/:id/final-submit
// Engineering submit final — semua item harus sudah fixed
// Body: submitted_by_id, submitted_by_name, notes
// ================================================================
const submitFinal = async (req, res) => {
  const { id } = req.params;
  const { submitted_by_id, submitted_by_name, notes } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM department_tasks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'WO tidak ditemukan' });
    const task = rows[0];

    let woItems = typeof task.wo_items === 'string' ? JSON.parse(task.wo_items) : (task.wo_items || []);

    // Validasi: semua item harus fixed
    const pendingItems = woItems.filter(i => i.status === 'pending');
    if (pendingItems.length > 0) {
      return res.status(400).json({
        message: `Masih ada ${pendingItems.length} item yang belum selesai. Semua item harus diselesaikan sebelum submit final.`,
        pending_items: pendingItems.map(i => ({ id: i.id, name: i.name }))
      });
    }

    await db.query(
      `UPDATE department_tasks SET
        status = 'Menunggu Approval Penyelesaian',
        fixed_wo_items = total_wo_items,
        waktu_diterima = NOW()
       WHERE id = ?`,
      [id]
    );

    // Notif ke atasan Engineering untuk approval
    try {
      const [approvers] = await db.query(
        `SELECT id FROM users 
         WHERE company_id = ? AND department = ? AND status = 'Aktif'
           AND (role LIKE '%manager%' OR role LIKE '%supervisor%' OR role LIKE '%kepala%' OR role LIKE '%atasan%')`,
        [task.company_id, task.departemen_tujuan]
      );
      const approverIds = approvers.map(u => u.id);
      if (approverIds.length > 0) {
        await notifyUsers(db, approverIds, {
          title: `WO Butuh Approval: ${task.nama_wo}`,
          body: `Semua item selesai. Silakan review dan approve.`,
          url: `/demo/mobile/approvals`
        });
      }
    } catch (pushErr) {
      console.error('[DeptTask] Push notif final error:', pushErr.message);
    }

    socketService.emitToCompany(task.company_id, 'dept-task-updated', {
      id, status: 'Menunggu Approval Penyelesaian'
    });

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: id,
      action: 'UPDATE_STATUS',
      new_value: 'Menunggu Approval Penyelesaian',
      notes: `Engineering (${submitted_by_name}) melakukan submit final untuk WO: "${task.nama_wo}". Menunggu approval atasan. Catatan: ${notes || '-'}`,
      req
    });

    res.json({ message: 'WO berhasil disubmit final. Menunggu approval atasan.' });
  } catch (err) {
    console.error('[DeptTask] submitFinal error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// POST /department-tasks/:id/reopen
// Operasional ajukan ulang WO yang sudah selesai
// Body: reopen_by_id, reopen_by_name, problem_item_ids: [1,3],
//       nama_wo, deskripsi, urgensi, tanggal_selesai
// ================================================================
const reopenWO = async (req, res) => {
  const { id: parentId } = req.params;
  const {
    reopen_by_id, reopen_by_name,
    problem_item_ids,
    nama_wo, deskripsi, urgensi, tanggal_selesai
  } = req.body;

  if (!Array.isArray(problem_item_ids) || problem_item_ids.length === 0) {
    return res.status(400).json({ message: 'Pilih minimal 1 item yang masih bermasalah' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM department_tasks WHERE id = ?', [parentId]);
    if (rows.length === 0) return res.status(404).json({ message: 'WO tidak ditemukan' });
    const parent = rows[0];

    if (parent.status !== 'Selesai') {
      return res.status(400).json({ message: 'Hanya WO berstatus Selesai yang bisa diajukan ulang' });
    }

    const parentItems = typeof parent.wo_items === 'string'
      ? JSON.parse(parent.wo_items) : (parent.wo_items || []);

    // Ambil hanya item yang dipilih sebagai masih bermasalah
    const problemItems = parentItems
      .filter(i => problem_item_ids.includes(i.id))
      .map(i => ({
        id: i.id,
        name: i.name,
        original_notes: i.fix_notes || i.original_notes || '',
        status: 'pending',
        fixed_at: null, fixed_by_id: null, fixed_by_name: null,
        fix_notes: '', fix_photo_url: ''
      }));

    if (problemItems.length === 0) {
      return res.status(400).json({ message: 'Item yang dipilih tidak ditemukan di WO induk' });
    }

    const newNamaWo = nama_wo || `Re-open: ${parent.nama_wo}`;

    const [result] = await db.query(
      `INSERT INTO department_tasks
        (perusahaan, company_id, departemen_asal, nama_peminta,
         departemen_tujuan, nama_wo, jenis_tugas, deskripsi, urgensi,
         tanggal_mulai, tanggal_selesai,
         wo_items, partial_submissions,
         parent_wo_id, checklist_session_id,
         reopen_count, total_wo_items, fixed_wo_items)
       VALUES (?, ?, ?, ?, ?, ?, 'wo', ?, ?, NOW(), ?, ?, '[]', ?, ?, ?, ?, 0)`,
      [
        parent.perusahaan, parent.company_id,
        parent.departemen_asal, reopen_by_name || parent.nama_peminta,
        parent.departemen_tujuan,
        newNamaWo, deskripsi || parent.deskripsi, urgensi || parent.urgensi,
        tanggal_selesai || null,
        JSON.stringify(problemItems),
        parseInt(parentId),
        parent.checklist_session_id || null,
        (parent.reopen_count || 0) + 1,
        problemItems.length
      ]
    );

    const newWoId = result.insertId;

    // Update parent WO status jadi Diajukan Ulang
    await db.query(
      "UPDATE department_tasks SET status = 'Diajukan Ulang' WHERE id = ?",
      [parentId]
    );

    // Notif ke Engineering
    try {
      const [engUsers] = await db.query(
        'SELECT id FROM users WHERE company_id = ? AND department = ? AND status = "Aktif"',
        [parent.company_id, parent.departemen_tujuan]
      );
      const engIds = engUsers.map(u => u.id);
      if (engIds.length > 0) {
        await notifyUsers(db, engIds, {
          title: `WO Diajukan Ulang: ${newNamaWo}`,
          body: `${problemItems.length} item perlu diperbaiki ulang oleh ${parent.departemen_asal}`,
          url: `/tugas-departemen/diterima`
        });
      }
    } catch (pushErr) {
      console.error('[DeptTask] Push notif reopen error:', pushErr.message);
    }

    socketService.emitToCompany(parent.company_id, 'dept-task-created', {
      id: newWoId, nama_wo: newNamaWo, is_reopen: true, parent_wo_id: parentId
    });

    // Log Audit
    await logAudit({
      entity_type: 'task',
      entity_id: newWoId,
      action: 'REOPEN',
      notes: `Tugas/WO "${parent.nama_wo}" diajukan ulang (re-open) oleh ${reopen_by_name} karena ${problemItems.length} item masih bermasalah.`,
      req
    });

    res.status(201).json({
      message: 'WO berhasil diajukan ulang',
      new_wo_id: newWoId,
      problem_items_count: problemItems.length
    });
  } catch (err) {
    console.error('[DeptTask] reopenWO error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// GET /department-tasks/:id/monitor
// Khusus Operasional: lihat full timeline WO (dept task + linked tasks + history)
// ================================================================
const monitorWO = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Dept task utama
    const [dtRows] = await db.query(
      `SELECT dt.*,
              cs.session_date, cs.session_shift, cs.ok_count, cs.broken_count AS session_broken_count
       FROM department_tasks dt
       LEFT JOIN checklist_sessions cs ON cs.id = dt.checklist_session_id
       WHERE dt.id = ?`,
      [id]
    );
    if (dtRows.length === 0) return res.status(404).json({ message: 'WO tidak ditemukan' });
    const deptTask = dtRows[0];

    // Parse JSON
    deptTask.wo_items = typeof deptTask.wo_items === 'string'
      ? JSON.parse(deptTask.wo_items) : (deptTask.wo_items || []);
    deptTask.partial_submissions = typeof deptTask.partial_submissions === 'string'
      ? JSON.parse(deptTask.partial_submissions) : (deptTask.partial_submissions || []);

    // 2. Task-task agen yang dibuat Engineering dari WO ini
    const [linkedTasks] = await db.query(
      `SELECT t.id, t.nama_tugas, t.progres, t.status, t.departemen,
              t.waktu_dimulai, t.waktu_selesai_aktual,
              t.agen_id, t.approval_status
       FROM tasks t
       WHERE t.dept_task_id = ?
       ORDER BY t.created_at ASC`,
      [id]
    );

    // 3. History setiap task agen
    for (const task of linkedTasks) {
      const [hist] = await db.query(
        'SELECT nama_agen, progres, waktu_mulai, waktu_selesai FROM task_history WHERE task_id = ? ORDER BY created_at ASC',
        [task.id]
      );
      task.history = hist;
      if (typeof task.agen_id === 'string') {
        try { task.agen_id = JSON.parse(task.agen_id); } catch (e) { }
      }
    }

    // 4. WO re-open children
    const [children] = await db.query(
      'SELECT id, nama_wo, status, created_at, total_wo_items, fixed_wo_items FROM department_tasks WHERE parent_wo_id = ? ORDER BY created_at ASC',
      [id]
    );

    res.json({
      dept_task: deptTask,
      linked_agent_tasks: linkedTasks,
      child_wo_list: children
    });
  } catch (err) {
    console.error('[DeptTask] monitorWO error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDeptTasks,
  getDeptTask,
  createDeptTask,
  acceptDeptTask,
  rejectDeptTask,
  removeDeptTask,
  claimAndStartDeptTask,
  submitPartial,
  submitFinal,
  reopenWO,
  monitorWO
};
