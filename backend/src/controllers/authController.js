const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { logAudit } = require('../services/auditService');
require('dotenv').config();

const login = async (req, res) => {
  const { orgId, email, username, password, pin, isMobile } = req.body;
  const identifier = isMobile ? (username || email) : email;

  try {
    const userRecord = await userService.getUserByEmailOrUsername(orgId, identifier, isMobile);

    if (!userRecord) {
      // Log failed login attempt
      await logAudit({
        entity_type: 'auth',
        entity_id: null,
        user_id: null,
        user_name: identifier || 'Unknown',
        action: 'LOGIN_FAILED',
        action_label: 'Gagal Login',
        notes: `Login gagal: Akun tidak ditemukan (${isMobile ? 'Mobile' : 'Web'})`,
        req
      });
      return res.status(401).json({ message: 'Akun tidak ditemukan' });
    }

    // Platform & Role Enforcement
    if (isMobile) {
      if (userRecord.userType !== 'agen') {
        return res.status(403).json({ message: 'Akses Ditolak: Admin hanya dapat mengakses Dashboard melalui PC.' });
      }
      const isPinValid = await bcrypt.compare(pin, userRecord.pin);
      if (!isPinValid) {
        await logAudit({
          entity_type: 'auth',
          entity_id: userRecord.id,
          user_id: userRecord.id,
          user_name: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || identifier,
          action: 'LOGIN_FAILED',
          action_label: 'Gagal Login (PIN Salah)',
          notes: 'Login gagal: PIN salah pada aplikasi Mobile',
          req
        });
        return res.status(401).json({ message: 'PIN yang Anda masukkan salah.' });
      }
    } else {
      if (userRecord.userType !== 'admin') {
        return res.status(403).json({ message: 'Akses Ditolak: Agen hanya dapat mengakses aplikasi melalui perangkat Mobile.' });
      }
      const isPasswordValid = await bcrypt.compare(password, userRecord.password);
      if (!isPasswordValid) {
        await logAudit({
          entity_type: 'auth',
          entity_id: userRecord.id,
          user_id: userRecord.id,
          user_name: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || identifier,
          action: 'LOGIN_FAILED',
          action_label: 'Gagal Login (Password Salah)',
          notes: 'Login gagal: Password salah pada Dashboard Web',
          req
        });
        return res.status(401).json({ message: 'Password yang Anda masukkan salah.' });
      }
    }

    // Parse and Merge permissions
    let finalPermissions = {};
    const parsePerms = (p) => {
      if (!p) return {};
      try {
        return typeof p === 'string' ? JSON.parse(p) : p;
      } catch (e) {
        return {};
      }
    };

    const rolePerms = parsePerms(userRecord.role_permissions);
    const userPerms = parsePerms(userRecord.user_permissions);

    // Merge logic: Combine both. If a module exists in both, merge actions (union)
    const allModules = new Set([...Object.keys(rolePerms), ...Object.keys(userPerms)]);
    
    allModules.forEach(mod => {
      const rActions = rolePerms[mod] || [];
      const uActions = userPerms[mod] || [];
      // Union of actions
      finalPermissions[mod] = Array.from(new Set([...rActions, ...uActions]));
    });

    console.log(`Permissions merged for ${userRecord.firstName}:`, JSON.stringify(finalPermissions));

    // Generate JWT Tokens
    const tokenPayload = { 
      id: userRecord.id, 
      company_id: userRecord.company_id,
      orgId: userRecord.orgId, 
      userType: userRecord.userType,
      role: userRecord.role
    };
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'pamflow_secret_fallback_key',
      { expiresIn: '6h' }
    );
    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET || 'pamflow_refresh_secret_fallback_key',
      { expiresIn: '7d' }
    );

    // Log successful login
    await logAudit({
      entity_type: 'auth',
      entity_id: userRecord.id,
      user_id: userRecord.id,
      user_name: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || identifier,
      action: 'LOGIN',
      action_label: `Login Berhasil (${isMobile ? 'Mobile App' : 'Dashboard Web'})`,
      notes: `Login berhasil sebagai ${userRecord.role || userRecord.userType}`,
      req
    });
    
    res.status(200).json({ 
      message: 'Login successful', 
      token,
      refreshToken,
      user: { 
        id: userRecord.id, 
        company_id: userRecord.company_id,
        orgId: userRecord.orgId, 
        email: userRecord.email,
        username: userRecord.username,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        userType: userRecord.userType,
        role: userRecord.role,
        role_id: userRecord.role_id,
        permissions: finalPermissions,
        department: userRecord.department,
        companyName: userRecord.company_name,
        phone: userRecord.phone,
        employeeId: userRecord.employeeId,
        can_approve: userRecord.can_approve === 1 || userRecord.can_approve === true,
      } 
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    const user = req.user; // From authMiddleware
    if (user) {
      await logAudit({
        entity_type: 'auth',
        entity_id: user.id,
        user_id: user.id,
        user_name: req.body?.user_name || `User #${user.id}`,
        action: 'LOGOUT',
        action_label: 'Logout',
        notes: 'Pengguna keluar dari sistem',
        req
      });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};



const requestPasswordReset = async (req, res) => {
  const { orgId, email, username } = req.body;
  const identifier = username || email;
  
  if (!orgId || !identifier) {
    return res.status(400).json({ message: 'ID Organisasi dan Email/Username wajib diisi.' });
  }
  try {
    const isMobileReset = !!username;
    const user = await userService.getUserByEmailOrUsername(orgId, identifier, isMobileReset);
    if (!user) {
      return res.status(404).json({ message: 'Akun tidak ditemukan. Periksa kembali ID Organisasi dan Email/Username Anda.' });
    }
    await userService.createPasswordResetRequest(orgId, user.email || user.username, user.id);
    return res.status(200).json({ message: 'Permintaan berhasil dikirim. Admin akan segera menghubungi Anda.' });
  } catch (err) {
    console.error('Atur ulang pw error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const refreshAuthToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'pamflow_refresh_secret_fallback_key');
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        id: decoded.id, 
        company_id: decoded.company_id,
        orgId: decoded.orgId, 
        userType: decoded.userType,
        role: decoded.role
      },
      process.env.JWT_SECRET || 'pamflow_secret_fallback_key',
      { expiresIn: '6h' }
    );

    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

module.exports = {
  login,
  logout,
  requestPasswordReset,
  refreshAuthToken
};

