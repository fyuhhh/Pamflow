const express = require('express');
const router = express.Router();
const c = require('../controllers/checklistSessionController');

router.get('/', c.getSessions);                             // GET  /api/checklist-sessions
router.post('/', c.submitSession);                          // POST /api/checklist-sessions
router.post('/check-duplicate-items', c.checkDuplicateItems); // POST /api/checklist-sessions/check-duplicate-items
router.get('/:id', c.getSession);                           // GET  /api/checklist-sessions/:id
router.post('/:id/generate-wo', c.generateWO);              // POST /api/checklist-sessions/:id/generate-wo

module.exports = router;
