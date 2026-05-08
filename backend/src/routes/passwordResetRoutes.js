const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// All routes here should be protected by authMiddleware (mounted in index.js)
router.get('/pending', passwordResetController.getPendingRequests);
router.put('/:id/resolve', passwordResetController.resolveRequest);

module.exports = router;
