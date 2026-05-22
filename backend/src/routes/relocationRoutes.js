const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/relocationController');
const { checkPermission } = require('../middleware/permissionMiddleware');

router.get('/', checkPermission('pure_asset_mutation', 'Lihat'), ctrl.getRelocations);
router.get('/:id', checkPermission('pure_asset_mutation', 'Lihat'), ctrl.getRelocationById);
router.post('/', checkPermission('pure_asset_mutation', 'Buat'), ctrl.createRelocation);
router.patch('/:id/approve', checkPermission('pure_asset_mutation', 'Buat'), ctrl.approveRelocation);
router.patch('/:id/reject', checkPermission('pure_asset_mutation', 'Buat'), ctrl.rejectRelocation);
router.delete('/:id', checkPermission('pure_asset_mutation', 'Buat'), ctrl.deleteRelocation);

module.exports = router;

