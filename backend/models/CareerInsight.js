// models/CareerInsight.js — AI-generated profile-based insights
const mongoose = require('mongoose');

const InsightItemSchema = new mongoose.Schema({
  type:           { type: String, enum: ['opportunity','risk','salary','hidden-skill','readiness','growth'] },
  icon:           { type: String },
  title:          { type: String },
  message:        { type: String },
  impact:         { type: String, enum: ['high','medium','low'] },
  actionRequired: { type: String },
  metric:         { type: String },  // e.g. "+40 points" or "+22% opportunities"
}, { _id: false });

const CareerInsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  insights:            [InsightItemSchema],
  profileSnapshotHash: { type: String },
  generatedAt:         { type: Date, default: Date.now },
  profileCompletenessPct: { type: Number, default: 0 },
  status: { type: String, enum: ['pending','completed','failed'], default: 'pending' },
}, { timestamps: true });

CareerInsightSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('CareerInsight', CareerInsightSchema);
