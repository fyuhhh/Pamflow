const db = require('../config/db');
const bcrypt = require('bcrypt');

const getUserByEmailOrUsername = async (orgId, identifier, isMobile) => {
  // Unified query to ensure roles and permissions are always fetched
  const query = `
    SELECT u.*, c.id as company_id, c.name as company_name, c.phone as company_phone, r.permissions
    FROM users u 
    JOIN companies c ON u.orgId = c.companyId 
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.orgId = ? AND ${isMobile ? '(u.username = ? OR u.email = ?)' : 'u.email = ?'}
  `;
  
  const params = isMobile ? [orgId, identifier, identifier] : [orgId, identifier];

  const [rows] = await db.query(query, params);
  return rows[0];
};

const createPasswordResetRequest = async (orgId, email, userId) => {
  await db.query(
    'INSERT INTO atur_ulang_pw (orgId, email, user_id, status) VALUES (?, ?, ?, ?)',
    [orgId, email, userId, 'pending']
  );
};

const getAllUsers = async (filters) => {
  const { type, company_id, department, role } = filters;
  let query = 'SELECT * FROM users WHERE 1=1';
  let params = [];
  
  if (type) {
    query += ' AND userType = ?';
    params.push(type);
  }
  
  if (company_id) {
    query += ' AND company_id = ?';
    params.push(company_id);
  }

  if (department) {
    query += ' AND department = ?';
    params.push(department);
  }

  if (role) {
    query += ' AND role LIKE ?';
    params.push(`%${role}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  const [rows] = await db.query(query, params);
  return rows;
};

const getUserById = async (id) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

const createUser = async (userData) => {
  const { employeeId, firstName, lastName, email, username, phone, role, role_id, orgId, company_id, department, password, pin, userType, status, can_approve } = userData;
  
  const finalPassword = password ? await bcrypt.hash(password, 10) : null;
  const finalPin = pin ? await bcrypt.hash(pin, 10) : null;

  const [result] = await db.query(
    'INSERT INTO users (employeeId, firstName, lastName, email, username, phone, role, role_id, orgId, company_id, department, password, pin, userType, status, can_approve) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [employeeId, firstName, lastName, email || null, username, phone, role, role_id || null, orgId || 'PAM', company_id || null, department || 'IT', finalPassword, finalPin, userType, status || 'Aktif', can_approve ? 1 : 0]
  );
  return result.insertId;
};

const updateUser = async (id, userData) => {
  const { employeeId, firstName, lastName, email, username, phone, role, role_id, orgId, company_id, department, password, pin, status, can_approve } = userData;
  
  const [currentUserRows] = await db.query('SELECT password, pin FROM users WHERE id = ?', [id]);
  const currentPassword = currentUserRows.length > 0 ? currentUserRows[0].password : null;
  const currentPin = currentUserRows.length > 0 ? currentUserRows[0].pin : null;
  
  let finalPassword = currentPassword;
  if (password && !password.startsWith('$2b$')) {
    finalPassword = await bcrypt.hash(password, 10);
  } else if (password) {
    finalPassword = password; // Already hashed or passed as is
  }

  let finalPin = pin !== undefined ? pin : currentPin;
  if (pin && !pin.startsWith('$2b$')) {
    finalPin = await bcrypt.hash(pin, 10);
  } else if (pin) {
    finalPin = pin;
  }

  await db.query(
    'UPDATE users SET employeeId=?, firstName=?, lastName=?, email=?, username=?, phone=?, role=?, role_id=?, orgId=?, company_id=?, department=?, password=?, pin=?, status=?, can_approve=? WHERE id=?',
    [employeeId, firstName, lastName, email || null, username, phone, role, role_id || null, orgId || 'PAM', company_id || null, department || 'IT', finalPassword, finalPin, status, can_approve !== undefined ? (can_approve ? 1 : 0) : undefined, id]
  );
};

const updatePassword = async (id, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
};

const updatePin = async (id, newPin) => {
  const hashedPin = await bcrypt.hash(newPin, 10);
  await db.query('UPDATE users SET pin = ? WHERE id = ?', [hashedPin, id]);
};

const deleteUser = async (id) => {
  await db.query('DELETE FROM users WHERE id = ?', [id]);
};

module.exports = {
  getUserByEmailOrUsername,
  createPasswordResetRequest,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updatePassword,
  updatePin,
  deleteUser
};
