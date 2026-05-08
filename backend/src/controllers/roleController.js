const db = require('../config/db');

const getRoles = async (req, res) => {
  const { company_id } = req.query;
  try {
    let query = 'SELECT * FROM roles';
    let params = [];
    if (company_id) {
      query += ' WHERE company_id = ?';
      params.push(company_id);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    const parsedRows = rows.map(row => ({
      ...row,
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || {})
    }));
    res.status(200).json(parsedRows);
  } catch (err) {
    console.error('Fetch roles error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getRole = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const role = rows[0];
      role.permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : (role.permissions || {});
      res.status(200).json(role);
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
  } catch (err) {
    console.error('Fetch role error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createRole = async (req, res) => {
  const { company_id, level, name, permissions, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO roles (company_id, level, name, permissions, status) VALUES (?, ?, ?, ?, ?)',
      [company_id, level, name, JSON.stringify(permissions), status || 'Aktif']
    );
    res.status(201).json({ message: 'Role created successfully', id: result.insertId });
  } catch (err) {
    console.error('Create role error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateRole = async (req, res) => {
  const { level, name, permissions, status } = req.body;
  try {
    await db.query(
      'UPDATE roles SET level = ?, name = ?, permissions = ?, status = ? WHERE id = ?',
      [level, name, JSON.stringify(permissions), status, req.params.id]
    );
    res.status(200).json({ message: 'Role updated successfully' });
  } catch (err) {
    console.error('Update role error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeRole = async (req, res) => {
  try {
    await db.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Delete role error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  removeRole
};
