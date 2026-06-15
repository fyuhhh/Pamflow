const db = require('../config/db');
const { logAudit } = require('../services/auditService');

const getTemplates = async (req, res) => {
  const { company_id, department_id, jenis_template } = req.query;
  try {
    let query = `
      SELECT t.*, c.name as company_name, d.name as department_name 
      FROM task_templates t
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN departments d ON t.department_id = d.id
    `;
    let params = [];
    let conditions = [];
    
    if (company_id) {
      conditions.push('t.company_id = ?');
      params.push(company_id);
    }
    if (department_id) {
      conditions.push('t.department_id = ?');
      params.push(department_id);
    }
    if (jenis_template) {
      conditions.push('t.jenis_template = ?');
      params.push(jenis_template);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';
    
    const [rows] = await db.query(query, params);
    const parsedRows = rows.map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : (row.details || [])
    }));
    res.status(200).json(parsedRows);
  } catch (err) {
    console.error('Error fetching templates:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTemplate = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, c.name as company_name, d.name as department_name 
      FROM task_templates t
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (rows.length > 0) {
      const template = rows[0];
      template.details = typeof template.details === 'string' ? JSON.parse(template.details) : (template.details || []);
      res.status(200).json(template);
    } else {
      res.status(404).json({ message: 'Template not found' });
    }
  } catch (err) {
    console.error('Error fetching template:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTemplate = async (req, res) => {
  const { company_id, department_id, jenis_template, name, details } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO task_templates (company_id, department_id, jenis_template, name, details) VALUES (?, ?, ?, ?, ?)',
      [company_id, department_id, jenis_template || 'checklist', name, JSON.stringify(details)]
    );

    // Log Audit
    await logAudit({
      entity_type: 'template',
      entity_id: result.insertId,
      action: 'CREATE',
      new_value: { name, jenis_template, department_id },
      notes: `Membuat template baru: "${name}" (${jenis_template})`,
      req
    });

    res.status(201).json({ id: result.insertId, message: 'Template created successfully' });
  } catch (err) {
    console.error('Error creating template:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTemplate = async (req, res) => {
  const { company_id, department_id, jenis_template, name, details } = req.body;
  try {
    const [oldRows] = await db.query('SELECT * FROM task_templates WHERE id = ?', [req.params.id]);
    await db.query(
      'UPDATE task_templates SET company_id = ?, department_id = ?, jenis_template = ?, name = ?, details = ? WHERE id = ?',
      [company_id, department_id, jenis_template, name, JSON.stringify(details), req.params.id]
    );

    // Log Audit
    if (oldRows.length > 0) {
      await logAudit({
        entity_type: 'template',
        entity_id: req.params.id,
        action: 'UPDATE',
        old_value: oldRows[0],
        new_value: { name, jenis_template, department_id },
        notes: `Memperbarui template: "${name}" (${jenis_template})`,
        req
      });
    }

    res.status(200).json({ message: 'Template updated successfully' });
  } catch (err) {
    console.error('Error updating template:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeTemplate = async (req, res) => {
  try {
    const [oldRows] = await db.query('SELECT * FROM task_templates WHERE id = ?', [req.params.id]);
    await db.query('DELETE FROM task_templates WHERE id = ?', [req.params.id]);

    // Log Audit
    if (oldRows.length > 0) {
      await logAudit({
        entity_type: 'template',
        entity_id: req.params.id,
        action: 'DELETE',
        old_value: oldRows[0],
        notes: `Menghapus template: "${oldRows[0].name}"`,
        req
      });
    }

    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (err) {
    console.error('Error deleting template:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  removeTemplate
};
