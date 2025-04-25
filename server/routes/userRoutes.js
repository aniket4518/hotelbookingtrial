const express = require('express');
const router = express.Router();
const userctrl = require('../controller/usercontroller');

// Register
router.post('/register', userctrl.register);

// Login
router.post('/login', userctrl.login);

// Refresh Token
router.get('/refresh_token', userctrl.refreshtoken);

// Logout
router.get('/logout', userctrl.logout);

module.exports = router;
