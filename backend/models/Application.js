// ============================================================
// models/Application.js — Job Application Schema
//
// FIX DB: Added index on applicant field for query performance.
//         Every getMyApplications was doing a full collection scan.
// ============================================================

const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant reference is required'],
    },
    coverLetter: {
      type: String,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
      default: '',
    },
    resumeUrl: {
      type: String,
      default: null,
    },
    resumeOriginalName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'],
      default: 'applied',
    },
    recruiterNotes: {
      type: String,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

// ─── Prevent duplicate applications ──────────────────────────
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// ─── FIX: Index on applicant alone ───────────────────────────
// Required for efficient getMyApplications queries.
// Without this, MongoDB scans the entire collection.
ApplicationSchema.index({ applicant: 1 });

// ─── Index for recruiter queries by job ───────────────────────
ApplicationSchema.index({ job: 1, status: 1 });

module.exports = mongoose.model('Application', ApplicationSchema);
