const express = require('express');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const userController = require('../controller/userController');

const router = express.Router();

// List all users - Admin only
router.get('/users', verifyToken, requireRole('admin'), userController.getAllUsers);

// Delete user by ID - Admin only
router.delete('/users/:id', verifyToken, requireRole('admin'), userController.deleteUserAdmin);

// Change user's role - Admin only
router.patch('/users/:id/role', verifyToken, requireRole('admin'), userController.changeUserRole);

module.exports = router;
