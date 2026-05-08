const userService = require('../services/userService');

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
    // Check uniqueness (simplified for brevity, service could handle this too)
    const existing = await userService.getUserByEmailOrUsername(req.body.orgId, username, true);
    if (existing) {
      return res.status(400).json({ message: `Username ${username} sudah terdaftar.` });
    }

    const userId = await userService.createUser({ ...req.body, username, userType: type });
    res.status(201).json({ message: 'User created successfully', id: userId });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateUserDetails = async (req, res) => {
  const { firstName, lastName, username: manualUsername } = req.body;
  const username = manualUsername || (firstName + (lastName || '')).toLowerCase().replace(/\s/g, '');

  try {
    await userService.updateUser(req.params.id, { ...req.body, username });
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
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
    res.status(200).json({ message: 'PIN berhasil diperbarui' });
  } catch (err) {
    console.error('Update PIN error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
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
  removeUser
};
