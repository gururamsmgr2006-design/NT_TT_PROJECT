// models/CareerTransition.js — Career Escape Velocity results
const mongoose = require('mongoose');

const TransitionOptionSchema = new mongoose.Schema({
  targetRole:            { type: String },
  targetIndustry:        { type: String },
  difficulty:            { type: String, enum: ['Easy','Moderate','Challenging','Hard','Very Hard'] },
  estimatedTimeMonths:   { type: Number },
  expectedSalaryIncrease:{ type: String },  // e.g. "40-60%"
  successProbability:    { type: Number, min: 0, max: 100 },
  requiredUpskilling:    [{ type: String }],
  whyPossible:           { type: String },
  firstSteps:            [{ type: String }],
}, { _id: false });

const CareerTransitionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  currentRole:        { type: String, required: true },
  currentSalary:      { type: String },
  transferableSkills: [{ type: String }],
  transitions:        [TransitionOptionSchema],
  summary:            { type: String },
  status: { type: String, enum: ['pending','completed','failed'], default: 'pending' },
}, { timestamps: true });

CareerTransitionSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('CareerTransition', CareerTransitionSchema);
