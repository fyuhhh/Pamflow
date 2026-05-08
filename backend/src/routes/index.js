const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const deptTaskRoutes = require('./deptTaskRoutes');
const orgRoutes = require('./orgRoutes');
const templateRoutes = require('./templateRoutes');
const roleRoutes = require('./roleRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const auditRoutes = require('./auditRoutes');
const uploadRoutes = require('./uploadRoutes');
const passwordResetRoutes = require('./passwordResetRoutes');
const deptRelationRoutes = require('./deptRelationRoutes');
const checklistSessionRoutes = require('./checklistSessionRoutes');
const pushController = require('../controllers/pushController');
const authMiddleware = require('../middleware/authMiddleware');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connectivity test
router.get('/test-connectivity', (req, res) => {
  res.json({ 
    status: 'connected', 
    serverTime: new Date().toISOString(),
    clientIp: req.ip 
  });
});

// Ping
router.get('/ping', (req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
});

// Mounting routes - ORDER MATTERS
router.use('/', authRoutes); // /api/login, /api/atur-ulang-pw - PUBLIC

// Protected routes - REQUIRE TOKEN
router.use('/users', authMiddleware, userRoutes); 
router.use('/tasks', authMiddleware, taskRoutes);
router.use('/department-tasks', authMiddleware, deptTaskRoutes);
router.use('/', authMiddleware, orgRoutes); 
router.use('/templates', authMiddleware, templateRoutes);
router.use('/roles', authMiddleware, roleRoutes);
router.use('/dashboard', authMiddleware, dashboardRoutes);
router.use('/audit-logs', authMiddleware, auditRoutes);
router.use('/upload', authMiddleware, uploadRoutes);
router.use('/password-reset', authMiddleware, passwordResetRoutes);
router.use('/dept-relations', authMiddleware, deptRelationRoutes);
router.use('/checklist-sessions', authMiddleware, checklistSessionRoutes);

// Extra dept-task endpoints (partial, final, reopen, monitor)
const deptTaskCtrl = require('../controllers/deptTaskController');
router.patch('/department-tasks/:id/partial-submit', authMiddleware, deptTaskCtrl.submitPartial);
router.patch('/department-tasks/:id/final-submit', authMiddleware, deptTaskCtrl.submitFinal);
router.post('/department-tasks/:id/reopen', authMiddleware, deptTaskCtrl.reopenWO);
router.get('/department-tasks/:id/monitor', authMiddleware, deptTaskCtrl.monitorWO);

// Push Notification Routes
router.post('/push/subscribe', authMiddleware, pushController.subscribe);
router.post('/push/unsubscribe', authMiddleware, pushController.unsubscribe);
router.post('/push/test', authMiddleware, pushController.testPush);

module.exports = router;
