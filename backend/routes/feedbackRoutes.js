// ============================================================
// routes/feedbackRoutes.js — NEW FILE
// ============================================================

const express = require('express');
const router  = express.Router();
const { submitFeedback, getAllFeedback } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

// Public: Anyone can submit feedback
router.post('/', submitFeedback);

// Protected: Only recruiters/admin can view all feedback
router.get('/', protect, authorize('recruiter'), getAllFeedback);

module.exports = router;
