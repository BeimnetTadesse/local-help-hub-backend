const express = require('express');
const router = express.Router();
const multer = require('multer');
const postController = require('../controller/postController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `post-${Date.now()}.${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// Post routes
router.post('/', verifyToken, upload.single('image'), postController.createPost);
router.get('/', postController.getPosts);
router.get('/myPosts', verifyToken, postController.getMyPosts);  // <-- Move this here
router.get('/:postId', postController.getPostById);
router.put('/:postId/status', verifyToken, postController.updatePostStatus);
router.put('/:postId', verifyToken, postController.updatePost);
router.delete('/:postId', verifyToken, postController.deletePost);

module.exports = router;