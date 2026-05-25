const knex = require('../config/knex');

/**
 * Middleware to enforce granular permissions based on user role and specific user overrides.
 * @param {string} moduleId - The ID of the module to check (e.g., 'pure_asset_register').
 * @param {string} action - The action required (e.g., 'Lihat', 'Buat', 'Edit', 'Hapus').
 */
const checkPermission = (moduleId, action = 'Lihat') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Akses ditolak: Sesi tidak terautentikasi' });
      }

      const userId = req.user.id;

      // 1. Fetch user role and permissions from DB
      const user = await knex('users')
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .where('users.id', userId)
        .select(
          'users.role',
          'users.permissions as user_permissions',
          'roles.permissions as role_permissions'
        )
        .first();

      if (!user) {
        return res.status(404).json({ message: 'Akses ditolak: Pengguna tidak ditemukan' });
      }

      // 2. Super Admin bypasses all checks
      if (user.role && user.role.toLowerCase() === 'super admin') {
        return next();
      }

      // 3. Parse and merge permissions (matches the merge logic of login)
      const parsePerms = (p) => {
        if (!p) return {};
        try {
          return typeof p === 'string' ? JSON.parse(p) : p;
        } catch (e) {
          return {};
        }
      };

      const rolePerms = parsePerms(user.role_permissions);
      const userPerms = parsePerms(user.user_permissions);

      // Extract allowed actions for this module
      const modulesToCheck = Array.isArray(moduleId) ? moduleId : [moduleId];
      const allowedActions = new Set();
      
      modulesToCheck.forEach(mId => {
        if (Array.isArray(rolePerms[mId])) {
          rolePerms[mId].forEach(act => allowedActions.add(act));
        }
        if (Array.isArray(userPerms[mId])) {
          userPerms[mId].forEach(act => allowedActions.add(act));
        }
      });

      // 4. Verify permission
      if (allowedActions.has(action)) {
        return next();
      }

      console.warn(`[PERMISSION DENIED] User #${userId} (${user.role}) attempted to access ${moduleId}:${action} on ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ 
        message: `Akses ditolak: Anda tidak memiliki izin '${action}' pada modul '${moduleId}'.` 
      });
    } catch (error) {
      console.error('[PERMISSION ERROR] Error verifying permissions:', error);
      return res.status(500).json({ message: 'Internal server error saat verifikasi hak akses' });
    }
  };
};

module.exports = { checkPermission };
