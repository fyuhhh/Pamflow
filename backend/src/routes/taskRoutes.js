const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Task CRUD
router.get('/', taskController.getTasks);
router.get('/pending-approval', taskController.getPendingApproval);
router.get('/approval-history', taskController.getApprovalHistory);
router.post('/', taskController.createNewTask);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTaskDetails);
router.delete('/:id', taskController.removeTask);

// Task Specialized Actions
router.put('/:id/approval', taskController.approveOrRejectTask);
router.patch('/:id/start', taskController.startAgentTask);
router.patch('/:id/pengerjaan-note', taskController.updatePengerjaanNoteAgentTask);
router.patch('/:id/material-note', taskController.updateMaterialNoteAgentTask);
router.patch('/:id/material-checked', taskController.materialCheckedAgentTask);
router.patch('/:id/proceed-to-material-check', taskController.proceedToMaterialCheckAgentTask);
router.patch('/:id/submit', taskController.submitAgentTask);
router.patch('/:id/finish', taskController.finishAgentTask);
router.get('/:id/history', taskController.getHistory);
router.patch('/:id/status', taskController.patchStatus);

module.exports = router;
