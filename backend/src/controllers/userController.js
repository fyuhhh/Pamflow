const userService = require('../services/userService');
const { logAudit } = require('../services/auditService');

const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.query);
    res.status(200).json(users);
  } catch (err) {
    console.error('Fetch users error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Fetch single user error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createNewUser = async (req, res) => {
  const { firstName, lastName, email, username: manualUsername, userType } = req.body;
  const type = userType || 'admin';
  
  if (type === 'admin' && !email) {
    return res.status(400).json({ message: 'Email wajib diisi untuk akun Admin.' });
  }
  if (type === 'agen' && !firstName) {
    return res.status(400).json({ message: 'Nama depan wajib diisi.' });
  }

  const username = manualUsername || (firstName + (lastName || '')).toLowerCase().replace(/\s/g, '');

  try {
    // Validate email uniqueness globally if provided
    if (email) {
      const existingEmail = await userService.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: `Email ${email} sudah terdaftar.` });
      }
    }

    // Validate username uniqueness globally
    const existingUsername = await userService.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: `Username ${username} sudah terdaftar.` });
    }

    const userId = await userService.createUser({ ...req.body, username, userType: type });

    // Log Audit
    await logAudit({
      entity_type: 'user',
      entity_id: userId,
      action: 'CREATE',
      new_value: { firstName, lastName, username, email, userType: type },
      notes: `Membuat pengguna baru: ${firstName} ${lastName || ''} (${username}) sebagai ${type}`,
      req
    });

    res.status(201).json({ message: 'User created successfully', id: userId });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

const updateUserDetails = async (req, res) => {
  const { firstName, lastName, username: manualUsername } = req.body;
  const username = manualUsername || (firstName + (lastName || '')).toLowerCase().replace(/\s/g, '');

  try {
    const oldUser = await userService.getUserById(req.params.id);
    await userService.updateUser(req.params.id, { ...req.body, username });

    // Log Audit
    await logAudit({
      entity_type: 'user',
      entity_id: req.params.id,
      action: 'UPDATE',
      old_value: oldUser,
      new_value: { firstName, lastName, username, ...req.body },
      notes: `Memperbarui data pengguna: ${firstName} ${lastName || ''} (${username})`,
      req
    });

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password salah' });
    }

    await userService.updatePassword(req.params.id, newPassword);

    // Log Audit
    await logAudit({
      entity_type: 'user',
      entity_id: req.params.id,
      action: 'UPDATE_PASSWORD',
      notes: `Memperbarui kata sandi pengguna: ${user.firstName} ${user.lastName || ''}`,
      req
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const changePin = async (req, res) => {
  const { currentPin, newPin } = req.body;
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.pin !== currentPin) {
      return res.status(400).json({ message: 'PIN saat ini salah' });
    }

    await userService.updatePin(req.params.id, newPin);

    // Log Audit
    await logAudit({
      entity_type: 'user',
      entity_id: req.params.id,
      action: 'UPDATE_PIN',
      notes: `Memperbarui PIN transaksi pengguna: ${user.firstName} ${user.lastName || ''}`,
      req
    });

    res.status(200).json({ message: 'PIN berhasil diperbarui' });
  } catch (err) {
    console.error('Update PIN error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateUserPermissions = async (req, res) => {
  const { permissions } = req.body;
  try {
    const db = require('../config/db');
    const [oldUserRows] = await db.query('SELECT firstName, lastName, permissions FROM users WHERE id = ?', [req.params.id]);
    await db.query('UPDATE users SET permissions = ? WHERE id = ?', [JSON.stringify(permissions), req.params.id]);

    // Log Audit
    if (oldUserRows && oldUserRows.length > 0) {
      await logAudit({
        entity_type: 'user',
        entity_id: req.params.id,
        action: 'UPDATE_PERMISSIONS',
        old_value: oldUserRows[0].permissions,
        new_value: permissions,
        notes: `Memperbarui hak akses/izin pengguna: ${oldUserRows[0].firstName} ${oldUserRows[0].lastName || ''}`,
        req
      });
    }

    res.status(200).json({ message: 'User permissions updated successfully' });
  } catch (err) {
    console.error('Update user permissions error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    await userService.deleteUser(req.params.id);

    // Log Audit
    if (user) {
      await logAudit({
        entity_type: 'user',
        entity_id: req.params.id,
        action: 'DELETE',
        old_value: user,
        notes: `Menghapus pengguna: ${user.firstName} ${user.lastName || ''} (${user.username})`,
        req
      });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUsers,
  getUser,
  createNewUser,
  updateUserDetails,
  changePassword,
  changePin,
  updateUserPermissions,
  removeUser
};
