const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, assetController.getAllAssets);
router.post('/', authMiddleware, assetController.createAsset);
router.get('/priorities', authMiddleware, assetController.getPriorities);
router.post('/priorities', authMiddleware, assetController.createPriority);
router.get('/statuses', authMiddleware, assetController.getStatuses);
router.post('/statuses', authMiddleware, assetController.createStatus);
router.get('/locations', authMiddleware, assetController.getLocations);
router.post('/locations', authMiddleware, assetController.createLocation);
router.put('/:id', authMiddleware, assetController.updateAsset);
router.delete('/:id', authMiddleware, assetController.deleteAsset);
router.get('/:id/logs', authMiddleware, assetController.getAssetAuditLogs);
router.post('/:id/toggle', authMiddleware, assetController.toggleAssetStatus);
router.post('/:id/note', authMiddleware, assetController.addAssetNote);
router.post('/:id/maintenance', authMiddleware, assetController.submitMaintenance);
router.get('/:id/maintenance-logs', authMiddleware, assetController.getMaintenanceLogs);

module.exports = router;
