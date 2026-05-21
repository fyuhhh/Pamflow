const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stockOpnameController');

router.get('/', ctrl.getStockOpnames);
router.get('/:id', ctrl.getStockOpnameById);
router.post('/', ctrl.createStockOpname);
router.put('/items/:id', ctrl.updateStockOpnameItem);
router.post('/:id/foreign', ctrl.addForeignItem);
router.delete('/:id', ctrl.deleteStockOpname);

module.exports = router;
