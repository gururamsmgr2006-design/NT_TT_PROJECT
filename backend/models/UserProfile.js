// models/UserProfile.js — Extended Career Identity (one-to-one with User)
const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  level:     { type: String, enum: ['beginner','intermediate','advanced','expert'], default: 'intermediate' },
  yearsUsed: { type: Number, default: 0 },
}, { _id: false });

const EducationSchema = new mongoose.Schema({
  degree:      { type: String, trim: true },
  institution: { type: String, trim: true },
  field:       { type: String, trim: true },
  year:        { type: Number },
  grade:       { type: String, trim: true },
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  title:       { type: String, trim: true },
  company:     { type: String, trim: true },
  location:    { type: String, trim: true },
  from:        { type: String },
  to:          { type: String },
  current:     { type: Boolean, default: false },
  description: { type: String, maxlength: 1000 },
}, { _id: false });

const CertificationSchema = new mongoose.Schema({
  name:   { type: String, trim: true },
  issuer: { type: String, trim: true },
  year:   { type: Number },
  url:    { type: String },
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name:        { type: String, trim: true },
  description: { type: String, maxlength: 500 },
  techStack:   [{ type: String }],
  url:         { type: String },
  github:      { type: String },
}, { _id: false });

const UserProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },

  // ── Headline & Summary ──────────────────────────────────────
  headline:        { type: String, maxlength: 200, trim: true },
  summary:         { type: String, maxlength: 1000 },
  currentRole:     { type: String, trim: true },
  currentCompany:  { type: String, trim: true },
  yearsExperience: { type: Number, default: 0, min: 0, max: 60 },

  // ── Career Arrays ──────────────────────────────────────────
  education:      [EducationSchema],
  experience:     [ExperienceSchema],
  certifications: [CertificationSchema],
  projects:       [ProjectSchema],
  skills:         [SkillSchema],
  interests:      [{ type: String, trim: true }],

  // ── Social / Portfolio ─────────────────────────────────────
  socialLinks: {
    github:    { type: String },
    linkedin:  { type: String },
    portfolio: { type: String },
    website:   { type: String },
  },

  // ── Career Goals ───────────────────────────────────────────
  careerGoals: {
    targetRole:        { type: String },
    preferredIndustry: { type: String },
    expectedSalary:    { type: String },
    workPreference:    { type: String, enum: ['remote','hybrid','onsite','flexible',''] },
    timeline:          { type: String },
  },

  // ── Career DNA (AI-computed) ───────────────────────────────
  careerDNA: {
    innovationScore:    { type: Number, min: 0, max: 100, default: 0 },
    leadershipScore:    { type: Number, min: 0, max: 100, default: 0 },
    analyticalScore:    { type: Number, min: 0, max: 100, default: 0 },
    communicationScore: { type: Number, min: 0, max: 100, default: 0 },
    computedAt:         { type: Date },
  },

  // ── Digital Twin Summary (AI-generated) ───────────────────
  digitalTwinSummary: { type: String },

  // ── Profile completeness tracking ─────────────────────────
  completenessScore: { type: Number, default: 0, min: 0, max: 100 },
  lastUpdated:       { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-compute completeness on save
UserProfileSchema.pre('save', function(next) {
  let score = 0;
  if (this.headline) score += 10;
  if (this.summary) score += 10;
  if (this.currentRole) score += 10;
  if (this.skills?.length > 0) score += 15;
  if (this.education?.length > 0) score += 15;
  if (this.experience?.length > 0) score += 15;
  if (this.certifications?.length > 0) score += 10;
  if (this.projects?.length > 0) score += 10;
  if (this.socialLinks?.linkedin || this.socialLinks?.github) score += 5;
  this.completenessScore = Math.min(100, score);
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
