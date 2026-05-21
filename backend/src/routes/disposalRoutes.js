const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/disposalController');

router.get('/', ctrl.getDisposals);
router.get('/:id', ctrl.getDisposalById);
router.post('/', ctrl.createDisposal);
router.delete('/:id', ctrl.deleteDisposal);

module.exports = router;
