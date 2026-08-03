// models/Achievement.js — Gamification badges and streaks
const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  name:        { type: String, required: true },
  description: { type: String },
  category:    { type: String, enum: ['career','learning','skill','employability','streak','hidden'] },
  icon:        { type: String },
  color:       { type: String },
  earnedAt:    { type: Date },
  hidden:      { type: Boolean, default: false },
  rarity:      { type: String, enum: ['common','rare','epic','legendary'], default: 'common' },
}, { _id: false });

const AchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  badges: [BadgeSchema],
  progress: {
    resumeUploads:      { type: Number, default: 0 },
    applicationsCount:  { type: Number, default: 0 },
    interviewsCount:    { type: Number, default: 0 },
    offersCount:        { type: Number, default: 0 },
    employabilityPeak:  { type: Number, default: 0 },
    aiChatsCount:       { type: Number, default: 0 },
    skillGapsCompleted: { type: Number, default: 0 },
    roadmapsGenerated:  { type: Number, default: 0 },
    twinGenerated:      { type: Boolean, default: false },
    profileComplete:    { type: Boolean, default: false },
  },
  streaks: {
    currentDailyStreak: { type: Number, default: 0 },
    longestStreak:      { type: Number, default: 0 },
    lastActiveDate:     { type: Date },
  },
  totalPoints: { type: Number, default: 0 },
  level:       { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
