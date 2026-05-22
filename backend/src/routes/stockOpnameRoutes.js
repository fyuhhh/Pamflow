const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stockOpnameController');
const { checkPermission } = require('../middleware/permissionMiddleware');

router.get('/', checkPermission('pure_asset_opname', 'Lihat'), ctrl.getStockOpnames);
router.get('/:id', checkPermission('pure_asset_opname', 'Lihat'), ctrl.getStockOpnameById);
router.post('/', checkPermission('pure_asset_opname', 'Buat'), ctrl.createStockOpname);
router.put('/items/:id', checkPermission('pure_asset_opname', 'Edit'), ctrl.updateStockOpnameItem);
router.post('/:id/foreign', checkPermission('pure_asset_opname', 'Edit'), ctrl.addForeignItem);
router.delete('/:id', checkPermission('pure_asset_opname', 'Edit'), ctrl.deleteStockOpname);

module.exports = router;

