/**
 * Centralized Permission Utility for PamFlow
 */

/**
 * Checks if a user has a specific permission for a module.
 * @param {Object} user - The user object containing role and permissions.
 * @param {string} moduleId - The ID of the module to check.
 * @param {string} action - The action to check (e.g., 'Lihat', 'Buat', 'Edit', 'Hapus').
 * @returns {boolean} - True if permitted, false otherwise.
 */
export const hasPermission = (user, moduleId, action = 'Lihat') => {
  if (!user) return false;
  
  const isSuperAdmin = user.role?.toLowerCase() === 'super admin';
  
  // Super Admin sees everything
  if (isSuperAdmin) return true;

  // Items without a moduleId are always visible (base UI)
  if (!moduleId) return true;
  
  // If they have no permissions object, they have NO access.
  if (!user.permissions || Object.keys(user.permissions).length === 0) {
    return false;
  }
  
  // Explicit permission check
  return user.permissions[moduleId]?.includes(action);
};
