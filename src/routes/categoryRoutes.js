const express = require('express');
const router = express.Router();
const categoryController = require('../controller/categoryController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Public
router.get('/', categoryController.getAllCategories);

// Admin Only
router.post('/', verifyToken, requireRole('admin'), categoryController.createCategory);
router.put('/:id', verifyToken, requireRole('admin'), categoryController.updateCategory);
router.delete('/:id', verifyToken, requireRole('admin'), categoryController.deleteCategory);

module.exports = router;
