// models/ResumeAnalysis.js — UPDATED: Added career readiness fields for Resume Intelligence
const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fileName:      { type: String, required: true },
  fileType:      { type: String, enum: ['pdf','docx'], required: true },
  extractedText: { type: String },
  language:      { type: String, default: 'en' },

  // ── Core AI Analysis ────────────────────────────────────────
  overallScore:          { type: Number, min: 0, max: 100 },
  atsScore:              { type: Number, min: 0, max: 100 },
  strengths:             [{ type: String }],
  weaknesses:            [{ type: String }],
  missingSkills:         [{ type: String }],
  formattingFeedback:    { type: String },
  keywordAnalysis: {
    found:   [{ type: String }],
    missing: [{ type: String }],
  },
  improvementSuggestions: [{ type: String }],

  // ── NEW: Resume Intelligence fields ─────────────────────────
  careerReadinessScore:      { type: Number, min: 0, max: 100 },
  extractedSkills:           [{ type: String }],
  certificationSuggestions:  [{ type: String }],
  projectSuggestions:        [{ type: String }],
  interviewPrepTopics:       [{ type: String }],
  careerReadinessBreakdown: {
    technicalDepth:    { type: Number, min: 0, max: 100 },
    presentationQuality: { type: Number, min: 0, max: 100 },
    marketAlignment:   { type: Number, min: 0, max: 100 },
    experienceRelevance: { type: Number, min: 0, max: 100 },
  },

  rawAnalysis:  { type: String },
  status: {
    type: String,
    enum: ['pending','completed','failed'],
    default: 'pending',
  },
  errorMessage: { type: String },
}, { timestamps: true });

ResumeAnalysisSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
