const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { logAudit } = require('../services/auditService');
const db = require('../config/db');

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.' }
});

// Auth routes
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/atur-ulang-pw', authController.requestPasswordReset);
router.post('/refresh', authController.refreshAuthToken);

// Page Navigation Tracking endpoint
router.post('/audit/page-view', authMiddleware, async (req, res) => {
  try {
    const { page_url, page_name, session_id } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // Get user name from DB
    const [rows] = await db.query('SELECT firstName, lastName, username FROM users WHERE id = ?', [user.id]);
    const u = rows[0];
    const userName = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username : `User #${user.id}`;

    await logAudit({
      entity_type: 'navigation',
      entity_id: null,
      user_id: user.id,
      user_name: userName,
      action: 'PAGE_VIEW',
      action_label: `Mengunjungi: ${page_name || page_url}`,
      notes: `Pengguna membuka halaman: ${page_name || page_url}`,
      page_url,
      session_id,
      req
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    // Silent fail — never break the app for analytics
    res.status(200).json({ ok: true });
  }
});

module.exports = router;

