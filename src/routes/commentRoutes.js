// commentRoutes.js

const express = require('express');
const router = express.Router();
const commentController = require('../controller/commentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Becomes:
router.post('/post/:postId', verifyToken, commentController.addComment);  // /api/comments/post/:postId
router.get('/post/:postId', commentController.getComments);               // /api/comments/post/:postId
router.delete('/:commentId', verifyToken, commentController.deleteComment); // /api/comments/:commentId

module.exports = router;
