const express = require('express');
const router = express.Router();
const ctl = require('../controller/authController');

router.post('/register', ctl.registerValidator, ctl.register);
router.post('/login', ctl.loginValidator, ctl.login);

module.exports = router;