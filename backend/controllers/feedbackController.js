// ============================================================
// controllers/feedbackController.js — User Feedback Submission
//
// NEW FILE — implements Phase 10 from the audit fixes
// POST /api/feedback   → save to DB + optional email notification
// GET  /api/feedback   → admin view all feedback (admin/recruiter only)
// ============================================================

const Feedback   = require('../models/Feedback');
const sendEmail  = require('../services/emailService');
const validator  = require('validator');

// ─────────────────────────────────────────────────────────────
// @route   POST /api/feedback
// @desc    Submit user feedback
// @access  Public
// ─────────────────────────────────────────────────────────────
exports.submitFeedback = async (req, res, next) => {
  try {
    const { fullName, email, feedbackType, message } = req.body;

    if (!fullName || !email || !feedbackType || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const VALID_TYPES = ['Suggestion', 'Bug Report', 'Improvement', 'Other'];
    if (!VALID_TYPES.includes(feedbackType)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback type.' });
    }

    const feedback = await Feedback.create({
      fullName:     validator.escape(String(fullName).trim().slice(0, 100)),
      email:        email.toLowerCase().trim(),
      feedbackType,
      message:      validator.escape(String(message).trim().slice(0, 2000)),
      userAgent:    req.headers['user-agent'] || '',
      ipAddress:    req.ip,
    });

    // Optional: notify developer by email (non-blocking)
    if (process.env.DEVELOPER_EMAIL) {
      sendEmail({
        to:      process.env.DEVELOPER_EMAIL,
        subject: `[TalentTrack Feedback] ${feedbackType} from ${fullName}`,
        html: `
          <h3>New Feedback Received</h3>
          <p><strong>From:</strong> ${fullName} (${email})</p>
          <p><strong>Type:</strong> ${feedbackType}</p>
          <p><strong>Message:</strong></p>
          <blockquote>${message}</blockquote>
          <p style="color:#888;font-size:0.8rem">Submitted: ${new Date().toISOString()}</p>
        `,
      }).catch((err) => console.error('Feedback email failed (non-critical):', err));
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been received.',
      feedbackId: feedback._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/feedback
// @desc    View all feedback — admin/recruiter only
// @access  Private — Recruiter
// ─────────────────────────────────────────────────────────────
exports.getAllFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const skip     = (pageNum - 1) * limitNum;

    const query = {};
    if (type) query.feedbackType = type;

    const [feedbackList, total] = await Promise.all([
      Feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Feedback.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: feedbackList.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      feedback: feedbackList,
    });
  } catch (error) {
    next(error);
  }
};
