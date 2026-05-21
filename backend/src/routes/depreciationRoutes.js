const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/depreciationController');

router.get('/calculate', ctrl.calculateDepreciation);

module.exports = router;
