// ============================================================
// controllers/passwordResetController.js — Password Reset Flow
//
// NEW FILE — implements Phase 7 from the audit fixes
//
// Flow:
//   1. POST /api/auth/forgot-password  → generate token → send email
//   2. POST /api/auth/reset-password/:token → validate → update password
// ============================================================

const crypto     = require('crypto');
const User       = require('../models/User');
const sendEmail  = require('../services/emailService');

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @desc    Generate reset token + send email
// @access  Public
// ─────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // SECURITY: Always return the same message whether user exists or not
    // This prevents user enumeration attacks
    const GENERIC_MSG = 'If an account with that email exists, a password reset link has been sent.';

    if (!user || !user.isActive) {
      return res.status(200).json({ success: true, message: GENERIC_MSG });
    }

    // Generate a random 32-byte token
    const rawToken  = crypto.randomBytes(32).toString('hex');
    // Store the SHA-256 hash in the database (never store raw tokens)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Build reset URL using the RAW token (user clicks this link)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to:      user.email,
        subject: 'TalentTrack — Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Password Reset Request</h2>
            <p>Hi ${user.fullName},</p>
            <p>You requested a password reset for your TalentTrack account.</p>
            <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
            <a href="${resetUrl}"
               style="display: inline-block; background: #2E4057; color: white;
                      padding: 12px 28px; border-radius: 6px; text-decoration: none;
                      font-weight: bold; margin: 20px 0;">
              Reset My Password
            </a>
            <p style="color: #666; font-size: 0.85rem;">
              If you did not request this, please ignore this email. Your password will not change.
            </p>
            <p style="color: #666; font-size: 0.85rem;">
              Or copy this link: <br/><a href="${resetUrl}">${resetUrl}</a>
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      // If email fails, clear the token so the user can try again
      user.passwordResetToken   = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send failed:', emailErr);
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }

    res.status(200).json({ success: true, message: GENERIC_MSG });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/reset-password/:token
// @desc    Validate token + set new password
// @access  Public
// ─────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both password fields.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one number.' });
    }

    // Hash the raw token from the URL to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with this valid, non-expired token
    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.',
      });
    }

    // Set new password — pre-save hook will hash it
    user.password             = newPassword;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};
