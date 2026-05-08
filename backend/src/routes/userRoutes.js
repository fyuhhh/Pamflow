const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User routes
router.get('/', userController.getUsers);
router.post('/', userController.createNewUser);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUserDetails);
router.delete('/:id', userController.removeUser);
router.put('/:id/password', userController.changePassword);
router.put('/:id/pin', userController.changePin);

// Backward compatibility redirects
router.get('/admins', (req, res) => res.redirect('/api/users?type=admin'));
router.get('/agens', (req, res) => res.redirect('/api/users?type=agen'));

module.exports = router;
