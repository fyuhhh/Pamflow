const db = require('../config/db');

// --- Departments ---
const getDepartments = async (req, res) => {
  const { company_id } = req.query;
  try {
    let query = `
      SELECT d.*, c.name as company_name 
      FROM departments d
      JOIN companies c ON d.company_id = c.id
    `;
    let params = [];
    if (company_id) {
      query += ' WHERE d.company_id = ?';
      params.push(company_id);
    }
    query += ' ORDER BY d.name ASC';
    const [rows] = await db.query(query, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Fetch departments error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDepartment = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, c.name as company_name 
       FROM departments d
       JOIN companies c ON d.company_id = c.id
       WHERE d.id = ?`, 
      [req.params.id]
    );
    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ message: 'Department not found' });
    }
  } catch (err) {
    console.error('Fetch single department error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createDepartment = async (req, res) => {
  const { name, dept_id, company_id, phone, whatsapp, status } = req.body;
  try {
    await db.query(
      'INSERT INTO departments (name, dept_id, company_id, phone, whatsapp, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, dept_id, company_id, phone, whatsapp, status || 'Aktif']
    );
    res.status(201).json({ message: 'Department created successfully' });
  } catch (err) {
    console.error('Create department error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateDepartment = async (req, res) => {
  const { name, dept_id, company_id, phone, whatsapp, status } = req.body;
  try {
    await db.query(
      'UPDATE departments SET name=?, dept_id=?, company_id=?, phone=?, whatsapp=?, status=? WHERE id=?',
      [name, dept_id, company_id, phone, whatsapp, status, req.params.id]
    );
    res.status(200).json({ message: 'Department updated successfully' });
  } catch (err) {
    console.error('Update department error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeDepartment = async (req, res) => {
  try {
    await db.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Delete department error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Companies ---
const getCompanies = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM companies ORDER BY name ASC');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Fetch companies error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCompany = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    if (rows.length > 0) res.status(200).json(rows[0]);
    else res.status(404).json({ message: 'Company not found' });
  } catch (err) {
    console.error('Fetch single company error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCompany = async (req, res) => {
  const { companyId, name, type, timezone, address, phone, status } = req.body;
  try {
    await db.query(
      'INSERT INTO companies (companyId, name, type, timezone, address, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [companyId, name, type || 'internal', timezone || 'UTC+07:00', address, phone, status || 'Aktif']
    );
    res.status(201).json({ message: 'Company created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'ID Perusahaan sudah terdaftar' });
    console.error('Create company error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCompany = async (req, res) => {
  const { companyId, name, type, timezone, address, phone, status } = req.body;
  try {
    await db.query(
      'UPDATE companies SET companyId=?, name=?, type=?, timezone=?, address=?, phone=?, status=? WHERE id=?',
      [companyId, name, type, timezone, address, phone, status, req.params.id]
    );
    res.status(200).json({ message: 'Company updated successfully' });
  } catch (err) {
    console.error('Update company error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeCompany = async (req, res) => {
  try {
    await db.query('DELETE FROM companies WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error('Delete company error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Organization ---
const getOrganizationDetails = async (req, res) => {
  const { orgId } = req.params;
  try {
    const [orgRows] = await db.query('SELECT * FROM organizations WHERE orgId = ?', [orgId]);
    if (orgRows.length === 0) return res.status(404).json({ message: 'Organization not found' });
    
    const organization = orgRows[0];
    const [userCountRows] = await db.query('SELECT COUNT(*) as usedCount FROM users WHERE orgId = ?', [orgId]);
    organization.usedQuota = userCountRows[0].usedCount;

    const [companies] = await db.query('SELECT * FROM companies WHERE orgId = ?', [orgId]);
    const companyIds = companies.map(c => c.id);
    let departments = [];
    if (companyIds.length > 0) {
      const [deptRows] = await db.query('SELECT * FROM departments WHERE company_id IN (?)', [companyIds]);
      departments = deptRows;
    }

    organization.companies = companies.map(company => ({
      ...company,
      departments: departments.filter(d => d.company_id === company.id)
    }));

    res.status(200).json(organization);
  } catch (err) {
    console.error('Fetch organization details error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  removeDepartment,
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  removeCompany,
  getOrganizationDetails
};
