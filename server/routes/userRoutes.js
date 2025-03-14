const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/security');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginRateLimiter, loginUser);
router.get('/me', protect, getMe);

module.exports = router; 