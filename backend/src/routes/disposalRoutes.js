const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/disposalController');
const { checkPermission } = require('../middleware/permissionMiddleware');

router.get('/', checkPermission('pure_asset_disposal', 'Lihat'), ctrl.getDisposals);
router.get('/:id', checkPermission('pure_asset_disposal', 'Lihat'), ctrl.getDisposalById);
router.post('/', checkPermission('pure_asset_disposal', 'Buat'), ctrl.createDisposal);
router.delete('/:id', checkPermission('pure_asset_disposal', 'Buat'), ctrl.deleteDisposal);

module.exports = router;

