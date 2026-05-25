const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/utilityController');
const { checkPermission } = require('../middleware/permissionMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// === SECURED INTERNAL ROUTES (Requires Logged-in User & Permissions) ===

// Utility Meters
router.get('/meters', authMiddleware, checkPermission(['pure_asset_maintenance', 'aset_monitoring'], 'Lihat'), ctrl.getMeters);
router.post('/meters', authMiddleware, checkPermission(['pure_asset_maintenance', 'aset_register'], 'Buat'), ctrl.createMeter);
router.put('/meters/:id', authMiddleware, checkPermission(['pure_asset_maintenance', 'aset_register'], 'Edit'), ctrl.updateMeter);
router.delete('/meters/:id', authMiddleware, checkPermission(['pure_asset_maintenance', 'aset_register'], 'Hapus'), ctrl.deleteMeter);

// Helper for mobile: Get latest reading of a meter
router.get('/meters/:meter_id/latest-reading', authMiddleware, checkPermission(['pure_asset_maintenance', 'aset_monitoring'], 'Lihat'), ctrl.getLatestApprovedReading);

// Readings logging
router.get('/readings', authMiddleware, checkPermission(['pure_asset_maintenance', 'aset_monitoring'], 'Lihat'), ctrl.getReadings);
router.post('/readings', authMiddleware, checkPermission(['pure_asset_maintenance', 'aset_register'], 'Buat'), ctrl.createReading);
router.delete('/readings/:id', authMiddleware, checkPermission(['pure_asset_maintenance', 'aset_register'], 'Hapus'), ctrl.deleteReading);


// === PUBLIC WEB ROUTES (No Login Required - Accessed via Tenant Scanning QR Code) ===

router.get('/public/readings/token/:token', ctrl.getReadingByToken);
router.post('/public/readings/token/:token/approve', ctrl.submitApprovalDecision);

// Dropdown Option Master Data
router.get('/options', authMiddleware, ctrl.getOptions);
router.post('/options', authMiddleware, ctrl.createOption);
router.put('/options/:id', authMiddleware, ctrl.updateOption);
router.delete('/options/:id', authMiddleware, ctrl.deleteOption);

module.exports = router;
