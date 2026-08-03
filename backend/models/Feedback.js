// ============================================================
// models/Feedback.js — User Feedback Schema
// NEW FILE
// ============================================================

const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    feedbackType: {
      type: String,
      required: [true, 'Feedback type is required'],
      enum: ['Suggestion', 'Bug Report', 'Improvement', 'Other'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    userAgent:  { type: String, default: '' },
    ipAddress:  { type: String, default: '' },
    resolved:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

FeedbackSchema.index({ feedbackType: 1 });
FeedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
