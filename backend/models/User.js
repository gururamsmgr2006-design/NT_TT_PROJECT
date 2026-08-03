// models/User.js — UPDATED: Added settings sub-doc, twoFactor, accountDeletedAt
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['jobseeker', 'recruiter'],
      default: 'jobseeker',
    },

    // ── Recruiter fields ────────────────────────────────────
    companyName: { type: String, trim: true },

    // ── Jobseeker fields ────────────────────────────────────
    resumeUrl: { type: String, default: null },
    savedJobs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
      validate: {
        validator: (arr) => arr.length <= 200,
        message: 'You cannot save more than 200 jobs.',
      },
    },

    // ── Profile ─────────────────────────────────────────────
    phone:          { type: String, trim: true },
    location:       { type: String, trim: true },
    bio:            { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'] },
    profilePicture: { type: String, default: null },

    // ── Account status ──────────────────────────────────────
    isActive:         { type: Boolean, default: true },
    accountDeletedAt: { type: Date,    default: null },

    // ── Password Reset ──────────────────────────────────────
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },

    // ── 2FA (stub — ready for implementation) ───────────────
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret:  { type: String,  select: false },

    // ── NEW: User Settings sub-document ─────────────────────
    settings: {
      theme:    { type: String, enum: ['light','dark','system'], default: 'light' },
      language: { type: String, enum: ['en','hi','ta','kn','te'], default: 'en' },
      recommendationFrequency: { type: String, enum: ['daily','weekly','manual'], default: 'weekly' },
      forecastFrequency:       { type: String, enum: ['weekly','monthly','manual'], default: 'monthly' },
      notifications: {
        email:        { type: Boolean, default: true },
        inApp:        { type: Boolean, default: true },
        achievements: { type: Boolean, default: true },
        jobAlerts:    { type: Boolean, default: true },
      },
      privacy: {
        recruiterAccess: { type: Boolean, default: true },
        anonymousMode:   { type: Boolean, default: false },
        dataSharing:     { type: Boolean, default: false },
      },
      ai: {
        personalization: { type: Boolean, default: true },
        contextMemory:   { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

// ── Hash password before save ──────────────────────────────────
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare password ───────────────────────────────────────────
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
