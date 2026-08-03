// controllers/userProfileController.js — Extended Career Profile CRUD
const UserProfile = require('../models/UserProfile');
const User        = require('../models/User');

exports.getFullProfile = async (req, res, next) => {
  try {
    let profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await UserProfile.create({ user: req.user._id });
    }
    const user = await User.findById(req.user._id).select('fullName email phone location bio role companyName resumeUrl');
    res.json({ success: true, profile, user });
  } catch (error) { next(error); }
};

exports.updateFullProfile = async (req, res, next) => {
  try {
    const ALLOWED = ['headline','summary','currentRole','currentCompany','yearsExperience',
      'education','experience','certifications','projects','skills','interests',
      'socialLinks','careerGoals'];
    const updates = {};
    ALLOWED.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const profile = await UserProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Also update basic fields on User if provided
    const userUpdates = {};
    if (req.body.fullName) userUpdates.fullName = req.body.fullName;
    if (req.body.phone)    userUpdates.phone    = req.body.phone;
    if (req.body.location) userUpdates.location = req.body.location;
    if (req.body.bio)      userUpdates.bio      = req.body.bio;
    if (Object.keys(userUpdates).length) {
      await User.findByIdAndUpdate(req.user._id, { $set: userUpdates });
    }

    res.json({ success: true, message: 'Profile updated successfully!', profile });
  } catch (error) { next(error); }
};

exports.exportData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [user, profile] = await Promise.all([
      require('../models/User').findById(userId).select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret'),
      UserProfile.findOne({ user: userId }),
    ]);
    const exportData = { exportedAt: new Date(), user, profile };
    res.setHeader('Content-Disposition', 'attachment; filename="talenttrack-data-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) { next(error); }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
    const user = await require('../models/User').findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // Cascade delete all user data
    await Promise.all([
      require('../models/Application').deleteMany({ applicant: user._id }),
      require('../models/AIConversation').deleteMany({ user: user._id }),
      require('../models/ResumeAnalysis').deleteMany({ user: user._id }),
      require('../models/SkillGapAnalysis').deleteMany({ user: user._id }),
      require('../models/CareerRoadmap').deleteMany({ user: user._id }),
      require('../models/JobRecommendation').deleteMany({ user: user._id }),
      require('../models/CareerTwin').deleteMany({ user: user._id }),
      require('../models/EmployabilityScore').deleteMany({ user: user._id }),
      require('../models/CareerTransition').deleteMany({ user: user._id }),
      require('../models/CareerInsight').deleteMany({ user: user._id }),
      require('../models/Achievement').deleteMany({ user: user._id }),
      UserProfile.deleteMany({ user: user._id }),
      require('../models/User').findByIdAndDelete(user._id),
    ]);

    res.json({ success: true, message: 'Your account and all associated data have been permanently deleted.' });
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const allowed = ['settings.theme','settings.language','settings.recommendationFrequency',
      'settings.forecastFrequency','settings.notifications','settings.privacy','settings.ai'];
    const updates = {};
    if (req.body.settings) {
      Object.entries(req.body.settings).forEach(([k, v]) => {
        updates[`settings.${k}`] = v;
      });
    }
    const user = await require('../models/User').findByIdAndUpdate(
      req.user._id, { $set: updates }, { new: true, runValidators: true }
    ).select('settings');
    res.json({ success: true, settings: user.settings });
  } catch (error) { next(error); }
};

exports.verifyPasswordForDelete = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const user = await require('../models/User').findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    res.json({ success: true, verified: true, message: 'Identity verified. You may now delete your account.' });
  } catch (error) { next(error); }
};
