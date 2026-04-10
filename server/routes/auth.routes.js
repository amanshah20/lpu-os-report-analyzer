const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
  sendOTP,
  verifyOTP,
  register,
  login,
  refresh,
  logout,
} = require('../controllers/authController');

// Validation middleware
const validateEmail = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Routes
router.post('/send-otp', validateEmail, sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/login', validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

module.exports = router;
