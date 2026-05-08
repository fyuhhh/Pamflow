const db = require('../config/db');
const socketService = require('../services/socketService');
const { notifyUsers } = require('../services/pushService');

// ================================================================
// GET /api/dept-relations
// Query: company_id, source_dept_id, target_dept_id, is_active
// ================================================================
const getRelations = async (req, res) => {
  const { company_id, source_dept_id, is_active } = req.query;
  try {
    let query = `
      SELECT 
        dr.*,
        ds.dept_id AS source_dept_code,
        dt.dept_id AS target_dept_code
      FROM dept_relations dr
      LEFT JOIN departments ds ON ds.id = dr.source_dept_id
      LEFT JOIN departments dt ON dt.id = dr.target_dept_id
      WHERE 1=1
    `;
    const params = [];

    if (company_id) {
      query += ' AND dr.company_id = ?';
      params.push(company_id);
    }
    if (source_dept_id) {
      query += ' AND dr.source_dept_id = ?';
      params.push(source_dept_id);
    }
    if (is_active !== undefined) {
      query += ' AND dr.is_active = ?';
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    query += ' ORDER BY dr.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[DeptRelation] getRelations error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// GET /api/dept-relations/:id
// ================================================================
const getRelation = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT dr.*, ds.dept_id AS source_dept_code, dt.dept_id AS target_dept_code
       FROM dept_relations dr
       LEFT JOIN departments ds ON ds.id = dr.source_dept_id
       LEFT JOIN departments dt ON dt.id = dr.target_dept_id
       WHERE dr.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Relasi tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[DeptRelation] getRelation error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// POST /api/dept-relations
// Body: company_id, source_dept_id, target_dept_id, created_by_id, created_by_name
// ================================================================
const createRelation = async (req, res) => {
  const { company_id, source_dept_id, target_dept_id, created_by_id, created_by_name } = req.body;

  if (!company_id || !source_dept_id || !target_dept_id) {
    return res.status(400).json({ message: 'company_id, source_dept_id, dan target_dept_id wajib diisi' });
  }
  if (String(source_dept_id) === String(target_dept_id)) {
    return res.status(400).json({ message: 'Departemen asal dan tujuan tidak boleh sama' });
  }

  try {
    // Ambil nama dept
    const [depts] = await db.query(
      'SELECT id, name FROM departments WHERE id IN (?, ?) AND company_id = ?',
      [source_dept_id, target_dept_id, company_id]
    );
    const srcDept = depts.find(d => d.id == source_dept_id);
    const tgtDept = depts.find(d => d.id == target_dept_id);

    if (!srcDept || !tgtDept) {
      return res.status(400).json({ message: 'Departemen tidak ditemukan di perusahaan ini' });
    }

    // Cek duplikat
    const [existing] = await db.query(
      'SELECT id FROM dept_relations WHERE company_id = ? AND source_dept_id = ? AND target_dept_id = ?',
      [company_id, source_dept_id, target_dept_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: `Relasi ${srcDept.name} → ${tgtDept.name} sudah ada` });
    }

    const [result] = await db.query(
      `INSERT INTO dept_relations 
        (company_id, source_dept_id, target_dept_id, source_name, target_name, created_by_id, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [company_id, source_dept_id, target_dept_id, srcDept.name, tgtDept.name, created_by_id || null, created_by_name || null]
    );

    res.status(201).json({
      id: result.insertId,
      message: `Relasi ${srcDept.name} → ${tgtDept.name} berhasil dibuat`
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Relasi ini sudah ada' });
    }
    console.error('[DeptRelation] createRelation error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// PATCH /api/dept-relations/:id/toggle
// Toggle aktif/nonaktif
// ================================================================
const toggleRelation = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dept_relations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Relasi tidak ditemukan' });

    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE dept_relations SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({
      message: `Relasi ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      is_active: newStatus
    });
  } catch (err) {
    console.error('[DeptRelation] toggleRelation error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// DELETE /api/dept-relations/:id
// ================================================================
const deleteRelation = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM dept_relations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Relasi tidak ditemukan' });

    await db.query('DELETE FROM dept_relations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Relasi berhasil dihapus' });
  } catch (err) {
    console.error('[DeptRelation] deleteRelation error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================================================================
// GET /api/dept-relations/check
// Query: company_id, source_dept_id, target_dept_id
// Cek apakah relasi aktif ada antara dua dept
// ================================================================
const checkRelation = async (req, res) => {
  const { company_id, source_dept_id, target_dept_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT id, source_name, target_name, is_active 
       FROM dept_relations 
       WHERE company_id = ? AND source_dept_id = ? AND target_dept_id = ? AND is_active = 1`,
      [company_id, source_dept_id, target_dept_id]
    );
    res.json({
      has_relation: rows.length > 0,
      relation: rows[0] || null
    });
  } catch (err) {
    console.error('[DeptRelation] checkRelation error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRelations,
  getRelation,
  createRelation,
  toggleRelation,
  deleteRelation,
  checkRelation
};
