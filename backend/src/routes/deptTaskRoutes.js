const express = require('express');
const router = express.Router();
const deptTaskController = require('../controllers/deptTaskController');

router.get('/', deptTaskController.getDeptTasks);
router.post('/', deptTaskController.createDeptTask);
router.get('/:id', deptTaskController.getDeptTask);
router.patch('/:id/accept', deptTaskController.acceptDeptTask);
router.patch('/:id/reject', deptTaskController.rejectDeptTask);
router.post('/:id/claim-and-start', deptTaskController.claimAndStartDeptTask);
router.get('/monitor', deptTaskController.getDeptTasks);
router.delete('/:id', deptTaskController.removeDeptTask);

module.exports = router;
