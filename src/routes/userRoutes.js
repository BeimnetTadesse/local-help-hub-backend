const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const userController = require('../controller/userController');

const router = express.Router();

router.get('/dashboard', verifyToken, (req, res) => {
  res.json({ message: `Welcome user ${req.user.id}`, user: req.user });
});

router.get('/profile', verifyToken, userController.getProfile);

router.put('/profile', verifyToken, userController.updateProfile);

module.exports = router;
