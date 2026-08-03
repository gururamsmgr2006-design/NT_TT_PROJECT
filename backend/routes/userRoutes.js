// ============================================================
// routes/userRoutes.js — User Profile & Saved Jobs Endpoints
//
// PUT    /api/users/profile          — Update profile
// POST   /api/users/upload-resume    — Upload resume file
// POST   /api/users/save-job/:jobId  — Toggle save job
// GET    /api/users/saved-jobs       — Get saved jobs
// PUT    /api/users/change-password  — Change password
// ============================================================

const express = require('express');
const router = express.Router();
const {
  updateProfile,
  uploadResume,
  toggleSaveJob,
  getSavedJobs,
  changePassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All user routes require authentication
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Jobseeker-specific routes
router.post('/upload-resume', protect, authorize('jobseeker'), upload.single('resume'), uploadResume);
router.post('/save-job/:jobId', protect, authorize('jobseeker'), toggleSaveJob);
router.get('/saved-jobs', protect, authorize('jobseeker'), getSavedJobs);

module.exports = router;
