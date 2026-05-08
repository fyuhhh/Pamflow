const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

router.get('/', auditController.getAllAuditLogs);
router.get('/:entity_type/:entity_id', auditController.getAuditLogs);

module.exports = router;
