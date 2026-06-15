const db = require('../config/db');
const { logAudit } = require('../services/auditService');
const socketService = require('../services/socketService');
const { notifyUsers } = require('../services/pushService');
const { processBase64InObject } = require('../utils/fileHelper');

// ================================================================
// POST /api/checklist-sessions
// Submit hasil checklist harian
// Body: company_id, dept_id, dept_name, template_id, template_name,
//       session_date, session_shift, item_results, submitted_by_id, submitted_by_name
//
// item_results: array of {id, name, status: "ok"|"rusak", notes, photo_url}
// ================================================================
const submitSession = async (req, res) => {
  const {
    company_id, dept_id, dept_name, template_id, template_name,
    session_date, session_time, session_shift, item_results,
    submitted_by_id, submitted_by_name
  } = req.body;

  if (!company_id || !dept_id || !session_date || !Array.isArray(item_results)) {
    return res.status(400).json({ message: 'company_id, dept_id, session_date, item_results wajib diisi' });
  }

  try {
    const total_items = item_results.length;
    const ok_count = item_results.filter(i => i.status === 'ok').length;
    const broken_count = item_results.filter(i => i.status === 'rusak').length;

    // Process base64 images in item_results
    const processedResults = await processBase64InObject(item_results, 'checklists');

    const [result] = await db.query(
      `INSERT INTO checklist_sessions
        (company_id, dept_id, dept_name, template_id, template_name,
         session_date, session_time, session_shift, total_items, ok_count, broken_count,
         item_results, submitted_by_id, submitted_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id, dept_id, dept_name || null, template_id || null, template_name || null,
        session_date, session_time || null, session_shift || 'pagi', total_items, ok_count, broken_count,
        JSON.stringify(processedResults),
        submitted_by_id || null, submitted_by_name || null
      ]
    );

    const sessionId = result.insertId;
    const brokenItems = item_results.filter(i => i.status === 'rusak');

    // Real-time broadcast ke company
    socketService.emitToCompany(company_id, 'checklist-session-created', {
      session_id: sessionId,
      dept_name,
      session_shift,
      broken_count,
      session_date,
      session_time
    });

    // Log Audit
    await logAudit({
      entity_type: 'checklist',
      entity_id: sessionId,
      action: 'SUBMIT',
      new_value: { template_name, session_shift, total_items, ok_count, broken_count },
      notes: `Melakukan submit Checklist Operasional: "${template_name || 'Harian'}" (Shift: ${session_shift}). Total item: ${total_items}, Kondisi OK: ${ok_count}, Rusak: ${broken_count}`,
      req
    });

    res.status(201).json({
      message: 'Checklist berhasil disubmit',
      session_id: sessionId,
      summary: { total_items, ok_count, broken_count },
      broken_items: brokenItems,
      can_generate_wo: broken_count > 0
    });
  } catch (err) {
    console.error('[ChecklistSession] submitSession error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// GET /api/checklist-sessions
// Query: company_id, dept_id, session_date, session_shift, limit
// ================================================================
const getSessions = async (req, res) => {
  const { company_id, dept_id, session_date, session_shift, limit = 50 } = req.query;
  try {
    let query = `
      SELECT 
        cs.*,
        dt.nama_wo AS wo_name,
        dt.status  AS wo_status
      FROM checklist_sessions cs
      LEFT JOIN department_tasks dt ON dt.id = cs.wo_generated_id
      WHERE 1=1
    `;
    const params = [];

    if (company_id) { query += ' AND cs.company_id = ?'; params.push(company_id); }
    if (dept_id) { 
      query += ' AND cs.dept_id = ?'; 
      params.push(dept_id); 
    } else if (req.query.dept_name) {
      query += ' AND cs.dept_name = ?'; 
      params.push(req.query.dept_name); 
    }
    if (session_date) { query += ' AND cs.session_date = ?'; params.push(session_date); }
    if (session_shift) { query += ' AND cs.session_shift = ?'; params.push(session_shift); }

    query += ` ORDER BY cs.submitted_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const [rows] = await db.query(query, params);

    // Parse JSON fields
    const parsed = rows.map(r => ({
      ...r,
      item_results: typeof r.item_results === 'string' ? JSON.parse(r.item_results) : (r.item_results || [])
    }));

    res.json(parsed);
  } catch (err) {
    console.error('[ChecklistSession] getSessions error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// GET /api/checklist-sessions/:id
// ================================================================
const getSession = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT cs.*,
              dt.id AS wo_id, dt.nama_wo, dt.status AS wo_status,
              dt.total_wo_items, dt.fixed_wo_items,
              dt.wo_items, dt.departemen_tujuan
       FROM checklist_sessions cs
       LEFT JOIN department_tasks dt ON dt.id = cs.wo_generated_id
       WHERE cs.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Sesi checklist tidak ditemukan' });

    const session = rows[0];
    if (typeof session.item_results === 'string') session.item_results = JSON.parse(session.item_results);
    if (typeof session.wo_items === 'string') session.wo_items = JSON.parse(session.wo_items);

    res.json(session);
  } catch (err) {
    console.error('[ChecklistSession] getSession error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// POST /api/checklist-sessions/:id/generate-wo
// Generate WO (department_task) dari item rusak di sesi checklist
//
// Body:
//   nama_wo, deskripsi, urgensi, tanggal_mulai, tanggal_selesai,
//   departemen_asal, departemen_tujuan, nama_peminta,
//   company_id, perusahaan, lampiran,
//   selected_item_ids: [1,2,3] (opsional, default semua item rusak)
// ================================================================
const generateWO = async (req, res) => {
  const { id: sessionId } = req.params;
  const {
    nama_wo, deskripsi, urgensi, tanggal_mulai, tanggal_selesai,
    departemen_asal, departemen_tujuan,
    nama_peminta, company_id, perusahaan, lampiran,
    selected_item_ids
  } = req.body;

  if (!nama_wo || !departemen_tujuan || !company_id || !urgensi) {
    return res.status(400).json({ message: 'nama_wo, departemen_tujuan, company_id, urgensi wajib diisi' });
  }

  try {
    // Ambil data sesi
    const [sessRows] = await db.query('SELECT * FROM checklist_sessions WHERE id = ?', [sessionId]);
    if (sessRows.length === 0) return res.status(404).json({ message: 'Sesi checklist tidak ditemukan' });
    const session = sessRows[0];

    // Cek apakah sudah pernah generate WO
    if (session.wo_generated_id) {
      return res.status(409).json({
        message: 'WO sudah pernah dibuat dari sesi ini',
        wo_id: session.wo_generated_id
      });
    }

    const itemResults = typeof session.item_results === 'string'
      ? JSON.parse(session.item_results) : (session.item_results || []);

    // Filter item rusak
    let brokenItems = itemResults.filter(i => i.status === 'rusak');

    // Jika ada selected_item_ids, filter lebih lanjut
    if (Array.isArray(selected_item_ids) && selected_item_ids.length > 0) {
      brokenItems = brokenItems.filter(i => selected_item_ids.includes(i.id));
    }

    if (brokenItems.length === 0) {
      return res.status(400).json({ message: 'Tidak ada item rusak yang dipilih untuk dibuat WO' });
    }

    // Buat wo_items awal (semua status pending)
    const woItems = brokenItems.map(item => ({
      id: item.id,
      name: item.name,
      original_notes: item.notes || '',
      original_photo: item.photo_url || '',
      original_photos: item.photo_urls || (item.photo_url ? [item.photo_url] : []),
      original_video: item.video_url || '',
      status: 'pending',      // pending | fixed | cant_fix
      fixed_at: null,
      fixed_by_id: null,
      fixed_by_name: null,
      fix_notes: '',
      fix_photo_url: ''
    }));

    // Process base64 in lampiran if any (though usually it's already path from checklist)
    const processedLampiran = await processBase64InObject(lampiran, 'dept-tasks');

    // Insert department_task (WO ke Engineering)
    const [taskResult] = await db.query(
      `INSERT INTO department_tasks 
        (perusahaan, company_id, departemen_asal, nama_peminta, departemen_tujuan,
         nama_wo, jenis_tugas, deskripsi, lampiran,
         tanggal_mulai, tanggal_selesai, urgensi,
         wo_items, partial_submissions,
         checklist_session_id, total_wo_items, fixed_wo_items, reopen_count)
       VALUES (?, ?, ?, ?, ?, ?, 'wo', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        perusahaan || '', company_id,
        departemen_asal || session.dept_name, nama_peminta || '',
        departemen_tujuan,
        nama_wo, deskripsi || '',
        processedLampiran ? (typeof processedLampiran === 'string' ? processedLampiran : JSON.stringify(processedLampiran)) : null,
        tanggal_mulai || null, tanggal_selesai || null, urgensi,
        JSON.stringify(woItems),
        JSON.stringify([]),                // partial_submissions kosong awal
        sessionId,
        woItems.length
      ]
    );

    const newWoId = taskResult.insertId;

    // Update sesi: tandai sudah dibuat WO
    await db.query(
      'UPDATE checklist_sessions SET wo_generated_id = ? WHERE id = ?',
      [newWoId, sessionId]
    );

    // Kirim notif ke pengguna di departemen tujuan
    try {
      const [targetUsers] = await db.query(
        'SELECT id FROM users WHERE company_id = ? AND department = ? AND status = "Aktif"',
        [company_id, departemen_tujuan]
      );
      const targetIds = targetUsers.map(u => u.id);
      if (targetIds.length > 0) {
        await notifyUsers(db, targetIds, {
          title: `WO Baru dari ${departemen_asal || session.dept_name}`,
          body: `${nama_wo} — ${woItems.length} item perlu diperbaiki`,
          url: `/tugas-departemen/diterima`
        });
      }
    } catch (pushErr) {
      console.error('[ChecklistSession] Push error:', pushErr.message);
    }

    // Real-time
    socketService.emitToCompany(company_id, 'dept-task-created', {
      id: newWoId, nama_wo, departemen_asal: departemen_asal || session.dept_name
    });

    // Log Audit
    await logAudit({
      entity_type: 'checklist',
      entity_id: sessionId,
      action: 'GENERATE_WO',
      new_value: { wo_id: newWoId, nama_wo, departemen_tujuan, wo_items_count: woItems.length },
      notes: `Membuat Work Order (WO) "${nama_wo}" dari temuan item rusak pada checklist (Sesi ID: ${sessionId}) ditujukan ke departemen ${departemen_tujuan}`,
      req
    });

    res.status(201).json({
      message: 'WO berhasil dibuat',
      wo_id: newWoId,
      wo_items_count: woItems.length
    });
  } catch (err) {
    console.error('[ChecklistSession] generateWO error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// ================================================================
// POST /api/checklist-sessions/check-duplicate-items
// Cek apakah item rusak dari checklist baru sudah ada di WO aktif.
// Response menyertakan detail WO dan sesi checklist asal.
// ================================================================
const checkDuplicateItems = async (req, res) => {
  const { company_id, dept_name, broken_item_names } = req.body;

  if (!company_id || !Array.isArray(broken_item_names) || broken_item_names.length === 0) {
    return res.status(400).json({ message: 'company_id dan broken_item_names wajib diisi' });
  }

  try {
    // JOIN ke checklist_sessions untuk mendapat info sesi asal
    const [activeWOs] = await db.query(
      `SELECT
         dt.id, dt.nama_wo, dt.status, dt.wo_items,
         dt.departemen_tujuan, dt.created_at, dt.urgensi,
         dt.total_wo_items, dt.fixed_wo_items,
         dt.checklist_session_id,
         cs.session_date, cs.session_shift, cs.template_name,
         cs.submitted_by_name, cs.submitted_at
       FROM department_tasks dt
       LEFT JOIN checklist_sessions cs ON cs.id = dt.checklist_session_id
       WHERE dt.company_id = ?
         AND dt.departemen_asal = ?
         AND dt.status NOT IN ('Selesai', 'Ditolak', 'Batal')
         AND dt.jenis_tugas = 'wo'
         AND dt.wo_items IS NOT NULL
         AND dt.wo_items != '[]'
       ORDER BY dt.created_at DESC`,
      [company_id, dept_name]
    );

    const duplicates = {};
    const safeItems = [];

    // Build item-level lookup dari semua WO aktif
    const activeItemMap = {};
    for (const wo of activeWOs) {
      let woItems = [];
      try {
        woItems = typeof wo.wo_items === 'string' ? JSON.parse(wo.wo_items) : (wo.wo_items || []);
      } catch { woItems = []; }

      const fixedCount = woItems.filter(i => i.status === 'fixed').length;
      const pendingCount = woItems.filter(i => i.status === 'pending' || i.status === 'in_progress').length;

      for (const item of woItems) {
        // Hanya tandai sebagai duplikat jika item ini belum diperbaiki
        if (item.status === 'pending' || item.status === 'in_progress') {
          const key = (item.name || '').trim().toLowerCase();
          if (key && !activeItemMap[key]) {
            activeItemMap[key] = {
              wo_id: wo.id,
              wo_name: wo.nama_wo,
              wo_status: wo.status,
              wo_urgensi: wo.urgensi,
              wo_dept_target: wo.departemen_tujuan,
              wo_created_at: wo.created_at,
              wo_total_items: wo.total_wo_items,
              wo_fixed_items: fixedCount,
              wo_pending_items: pendingCount,
              // Data sesi checklist asal
              checklist_session_id: wo.checklist_session_id,
              session_date: wo.session_date,
              session_shift: wo.session_shift,
              template_name: wo.template_name,
              submitted_by_name: wo.submitted_by_name,
              // Status item spesifik ini
              item_status: item.status
            };
          }
        }
      }
    }

    for (const name of broken_item_names) {
      const key = name.trim().toLowerCase();
      if (activeItemMap[key]) {
        duplicates[name] = activeItemMap[key];
      } else {
        safeItems.push(name);
      }
    }

    res.json({
      has_duplicates: Object.keys(duplicates).length > 0,
      duplicates,
      safe_items: safeItems,
      active_wo_count: activeWOs.length
    });
  } catch (err) {
    console.error('[ChecklistSession] checkDuplicateItems error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = {
  submitSession,
  getSessions,
  getSession,
  generateWO,
  checkDuplicateItems
};
