// ============================================================
// models/SkillGapAnalysis.js — Skill gap results
// ============================================================

const mongoose = require('mongoose');

const SkillItemSchema = new mongoose.Schema({
  skill:           { type: String, required: true },
  importance:      { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  learningPriority: { type: Number, default: 1 }, // 1 = highest
  resources:       [{ type: String }],
  estimatedHours:  { type: Number },
}, { _id: false });

const SkillGapAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  targetRole:       { type: String, required: true },
  userSkills:       [{ type: String }],
  language:         { type: String, default: 'en' },

  // Analysis results
  matchPercentage:  { type: Number, min: 0, max: 100 },
  presentSkills:    [{ type: String }],
  missingSkills:    [SkillItemSchema],
  learningPath: [{
    phase:       { type: Number },
    title:       { type: String },
    duration:    { type: String },
    skills:      [{ type: String }],
    resources:   [{ type: String }],
  }],
  summary:          { type: String },

  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true });

SkillGapAnalysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SkillGapAnalysis', SkillGapAnalysisSchema);
