const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, assetController.getAllAssets);
router.post('/', authenticateToken, assetController.createAsset);
router.get('/priorities', authenticateToken, assetController.getPriorities);
router.post('/priorities', authenticateToken, assetController.createPriority);
router.delete('/:id', authenticateToken, assetController.deleteAsset);

module.exports = router;
