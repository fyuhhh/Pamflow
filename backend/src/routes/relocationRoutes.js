const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/relocationController');

router.get('/', ctrl.getRelocations);
router.get('/:id', ctrl.getRelocationById);
router.post('/', ctrl.createRelocation);
router.patch('/:id/approve', ctrl.approveRelocation);
router.patch('/:id/reject', ctrl.rejectRelocation);
router.delete('/:id', ctrl.deleteRelocation);

module.exports = router;
