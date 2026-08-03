// ============================================================
// models/CareerRoadmap.js — AI-generated career roadmaps
// ============================================================

const mongoose = require('mongoose');

const RoadmapPhaseSchema = new mongoose.Schema({
  phase:           { type: Number, required: true },
  title:           { type: String, required: true },
  duration:        { type: String },
  skills:          [{ type: String }],
  certifications:  [{ type: String }],
  projects:        [{ type: String }],
  resources:       [{ type: String }],
  milestones:      [{ type: String }],
}, { _id: false });

const CareerRoadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  targetCareer:    { type: String, required: true },
  currentSkills:   [{ type: String }],
  education:       { type: String },
  experience:      { type: String },
  language:        { type: String, default: 'en' },

  // Roadmap content
  summary:         { type: String },
  totalDuration:   { type: String },
  phases:          [RoadmapPhaseSchema],
  interviewPrep:   [{ type: String }],
  salaryRange:     { type: String },
  jobOutlook:      { type: String },

  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true });

CareerRoadmapSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CareerRoadmap', CareerRoadmapSchema);
