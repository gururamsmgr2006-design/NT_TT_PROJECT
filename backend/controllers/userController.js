// ============================================================
// controllers/userController.js — User Profile Management
//
// Profile updates, saved jobs (bookmark), resume upload
// ============================================================

const User = require('../models/User');
const Job = require('../models/Job');

// ─────────────────────────────────────────────────────────────
// @route   PUT /api/users/profile
// @desc    Update user's own profile
// @access  Private
// ─────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    // Fields the user is allowed to update (not role, email, password here)
    const allowedFields = ['fullName', 'phone', 'location', 'bio', 'companyName'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/users/upload-resume
// @desc    Upload a resume file to the user's profile
// @access  Private — Jobseeker
// ─────────────────────────────────────────────────────────────
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { resumeUrl } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully!',
      resumeUrl,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/users/save-job/:jobId
// @desc    Toggle save/unsave a job (bookmark)
// @access  Private — Jobseeker
// ─────────────────────────────────────────────────────────────
exports.toggleSaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const user = await User.findById(req.user._id);
    const isSaved = user.savedJobs.map(id => id.toString()).includes(jobId);

    if (isSaved) {
      // Remove from saved list
      await User.findByIdAndUpdate(req.user._id, { $pull: { savedJobs: jobId } });
      return res.status(200).json({ success: true, saved: false, message: 'Job removed from saved list.' });
    } else {
      // Add to saved list
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedJobs: jobId } });
      return res.status(200).json({ success: true, saved: true, message: 'Job saved!' });
    }
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/users/saved-jobs
// @desc    Get all saved jobs for logged-in jobseeker
// @access  Private — Jobseeker
// ─────────────────────────────────────────────────────────────
exports.getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedJobs',
      match: { isActive: true },  // Only show still-active jobs
      select: 'title company location salaryDisplay jobType category createdAt',
    });

    res.status(200).json({ success: true, count: user.savedJobs.length, savedJobs: user.savedJobs });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   PUT /api/users/change-password
// @desc    Change user password (requires current password)
// @access  Private
// ─────────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    // Fetch user WITH password
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;  // Pre-save hook will hash it
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};
