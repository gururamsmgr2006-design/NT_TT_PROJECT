// ============================================================
// routes/authRoutes.js
//
// NEW: Added forgot-password and reset-password routes
// ============================================================

const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { signup, login, getMe } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');
const { protect } = require('../middleware/auth');

const signupValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('role').optional()
    .isIn(['jobseeker', 'recruiter']).withMessage('Role must be jobseeker or recruiter.'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ─── Auth Routes ──────────────────────────────────────────────
router.post('/signup', signupValidation, signup);
router.post('/login',  loginValidation,  login);
router.get('/me',      protect,          getMe);

// ─── Password Reset Routes (NEW) ─────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
