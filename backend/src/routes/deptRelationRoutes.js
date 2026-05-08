const express = require('express');
const router = express.Router();
const c = require('../controllers/deptRelationController');

router.get('/check', c.checkRelation);      // GET /api/dept-relations/check
router.get('/', c.getRelations);            // GET /api/dept-relations
router.get('/:id', c.getRelation);          // GET /api/dept-relations/:id
router.post('/', c.createRelation);         // POST /api/dept-relations
router.patch('/:id/toggle', c.toggleRelation); // PATCH /api/dept-relations/:id/toggle
router.delete('/:id', c.deleteRelation);    // DELETE /api/dept-relations/:id

module.exports = router;
