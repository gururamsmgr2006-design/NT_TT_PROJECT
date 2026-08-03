// models/EmployabilityScore.js — 0-1000 career readiness score
const mongoose = require('mongoose');

const EmployabilityScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  totalScore: { type: Number, min: 0, max: 1000, required: true },
  breakdown: {
    resumeQuality:    { type: Number, min: 0, max: 100, default: 0 },
    technicalSkills:  { type: Number, min: 0, max: 100, default: 0 },
    softSkills:       { type: Number, min: 0, max: 100, default: 0 },
    certifications:   { type: Number, min: 0, max: 100, default: 0 },
    projects:         { type: Number, min: 0, max: 100, default: 0 },
    experience:       { type: Number, min: 0, max: 100, default: 0 },
    marketDemand:     { type: Number, min: 0, max: 100, default: 0 },
    communication:    { type: Number, min: 0, max: 100, default: 0 },
    aiReadiness:      { type: Number, min: 0, max: 100, default: 0 },
  },
  improvementRecommendations: [{ type: String }],
  weeklyGrowth:  { type: Number, default: 0 },
  monthlyGrowth: { type: Number, default: 0 },
  tier: {
    type: String,
    enum: ['Beginner','Developing','Competitive','Strong','Elite'],
    default: 'Beginner',
  },
  status: { type: String, enum: ['pending','completed','failed'], default: 'pending' },
}, { timestamps: true });

EmployabilityScoreSchema.index({ user: 1, createdAt: -1 });

// Compute tier from score
EmployabilityScoreSchema.pre('save', function(next) {
  if (this.totalScore < 200) this.tier = 'Beginner';
  else if (this.totalScore < 400) this.tier = 'Developing';
  else if (this.totalScore < 600) this.tier = 'Competitive';
  else if (this.totalScore < 800) this.tier = 'Strong';
  else this.tier = 'Elite';
  next();
});

module.exports = mongoose.model('EmployabilityScore', EmployabilityScoreSchema);
