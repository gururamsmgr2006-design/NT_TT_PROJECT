// ============================================================
// controllers/authController.js — Authentication Logic
// signup: create account + return JWT
// login: verify credentials + return JWT
// getMe: return current user's profile
// ============================================================

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// ─── Helper: Generate JWT ────────────────────────────────────
// Signs a token containing the user's ID
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ─── Helper: Send token response ─────────────────────────────
// Strips password, sends user data + token
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Convert Mongoose doc to plain object so we can delete password
  const userData = user.toObject ? user.toObject() : { ...user };
  delete userData.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/signup
// @desc    Register a new user (jobseeker or recruiter)
// @access  Public
// ─────────────────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    // Check express-validator results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { fullName, email, password, role, companyName } = req.body;

    // Recruiters must provide a company name
    if (role === 'recruiter' && !companyName) {
      return res.status(400).json({ success: false, message: 'Company name is required for recruiters.' });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user — password hashing happens in the User pre-save hook
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
      role: role || 'jobseeker',
      companyName: role === 'recruiter' ? companyName : undefined,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login with email + password, returns JWT
// @access  Public
// ─────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user including password (select: false means we must explicitly include it)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      // Generic message — don't reveal whether email exists (security best practice)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    // Compare entered password with bcrypt hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get logged-in user's profile
// @access  Private (requires JWT via protect middleware)
// ─────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    // req.user is already attached by the protect middleware
    const user = await User.findById(req.user._id).populate('savedJobs', 'title company location salaryDisplay');

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
