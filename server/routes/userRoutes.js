const express = require('express');
const { register, login, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/security');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.get('/me', protect, getMe);

module.exports = router; 