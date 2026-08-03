// ============================================================
// models/Job.js — Job Posting Schema
// Created by Recruiters, viewed/applied to by Jobseekers
// ============================================================

const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    requirements: {
      type: String,   // Stored as text; displayed as-is or split by newlines
    },

    // ── Compensation ─────────────────────────────────────────
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    salaryDisplay: {
      type: String,
      default: 'Not specified',  // e.g. "$80k - $120k" or "Competitive"
    },

    // ── Classification ────────────────────────────────────────
    category: {
      type: String,
      enum: ['tech', 'finance', 'marketing', 'design', 'sales', 'hr', 'operations', 'other'],
      default: 'other',
    },
    jobType: {
      type: String,
      enum: ['fulltime', 'parttime', 'internship', 'contract', 'remote'],
      default: 'fulltime',
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'any'],
      default: 'any',
    },

    // ── External apply link (optional) ───────────────────────
    applyUrl: { type: String, default: '' },

    // ── Recruiter who posted this job ────────────────────────
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Status ───────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,   // Recruiter can archive/deactivate a job
    },
    deadline: {
      type: Date,
      default: null,   // Optional application deadline
    },
    applicationCount: {
      type: Number,
      default: 0,      // Cache — incremented when someone applies
    },
  },
  {
    timestamps: true,
  }
);

// ─── Index for fast text search ───────────────────────────────
// Allows $text queries on title and description
JobSchema.index({ title: 'text', description: 'text', company: 'text' });

// ─── Index for filtering ──────────────────────────────────────
JobSchema.index({ category: 1, jobType: 1, isActive: 1 });
JobSchema.index({ title: 'text', company: 'text', description: 'text', location: 'text' });
module.exports = mongoose.model('Job', JobSchema);
