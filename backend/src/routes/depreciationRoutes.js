const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/depreciationController');
const { checkPermission } = require('../middleware/permissionMiddleware');

router.get('/calculate', checkPermission('pure_asset_depreciation', 'Lihat'), ctrl.calculateDepreciation);

module.exports = router;

