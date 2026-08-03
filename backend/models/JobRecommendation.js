// ============================================================
// models/JobRecommendation.js — AI job recommendations
// ============================================================

const mongoose = require('mongoose');

const RecommendedJobSchema = new mongoose.Schema({
  job:             { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  matchPercentage: { type: Number, min: 0, max: 100 },
  matchReasons:    [{ type: String }],
  missingSkills:   [{ type: String }],
  applicationTip:  { type: String },
}, { _id: false });

const JobRecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recommendations: [RecommendedJobSchema],
  generatedAt:     { type: Date, default: Date.now },
  expiresAt:       { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

JobRecommendationSchema.index({ user: 1, generatedAt: -1 });
JobRecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('JobRecommendation', JobRecommendationSchema);
