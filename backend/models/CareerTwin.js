// models/CareerTwin.js — AI Digital Twin of the user's career
const mongoose = require('mongoose');

const CareerPathSchema = new mongoose.Schema({
  pathName:          { type: String },
  salaryGrowth:      { type: String },  // e.g. "₹8L → ₹28L in 5 years"
  currentAvgSalary:  { type: String },
  peakSalary:        { type: String },
  industryDemand:    { type: String, enum: ['Very High','High','Medium','Low','Declining'] },
  competitionLevel:  { type: String, enum: ['Very High','High','Medium','Low'] },
  automationRisk:    { type: String, enum: ['High','Medium','Low','Very Low'] },
  requiredSkills:    [{ type: String }],
  progression:       [{ type: String }],   // e.g. ["Junior Dev → Senior Dev → Tech Lead"]
  successProbability:{ type: Number, min: 0, max: 100 },
  timelineMonths:    { type: Number },
  whyGoodFit:        { type: String },
}, { _id: false });

const CareerTwinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  inputSnapshot: {
    skills:         [{ type: String }],
    experience:     { type: String },
    certifications: [{ type: String }],
    education:      { type: String },
    interests:      [{ type: String }],
    currentRole:    { type: String },
  },
  currentIdentity: {
    careerHealth:     { type: String },
    careerHealthScore:{ type: Number, min: 0, max: 100 },
    skillStrength:    { type: String },
    skillStrengthScore:{ type: Number, min: 0, max: 100 },
    marketValue:      { type: String },
    marketValueScore: { type: Number, min: 0, max: 100 },
    experienceLevel:  { type: String },
    industryPosition: { type: String },
    summary:          { type: String },
  },
  careerPaths:   [CareerPathSchema],
  topRecommendedPath: { type: String },
  status: { type: String, enum: ['pending','completed','failed'], default: 'pending' },
  errorMessage: { type: String },
}, { timestamps: true });

CareerTwinSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CareerTwin', CareerTwinSchema);
