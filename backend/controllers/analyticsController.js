// controllers/analyticsController.js — Personal Career Analytics
const Application      = require('../models/Application');
const ResumeAnalysis   = require('../models/ResumeAnalysis');
const SkillGapAnalysis = require('../models/SkillGapAnalysis');
const AIConversation   = require('../models/AIConversation');
const EmployabilityScore = require('../models/EmployabilityScore');
const CareerRoadmap    = require('../models/CareerRoadmap');
const UserProfile      = require('../models/UserProfile');

exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 86400000);
    const sevenDaysAgo  = new Date(now - 7  * 86400000);

    const [
      allApps, recentApps, statusCounts, resumeHistory,
      skillGapHistory, employabilityHistory, aiUsage, roadmaps, profile,
    ] = await Promise.all([
      Application.countDocuments({ applicant: userId }),
      Application.countDocuments({ applicant: userId, createdAt: { $gte: thirtyDaysAgo } }),
      Application.aggregate([
        { $match: { applicant: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ResumeAnalysis.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 }).limit(10).select('overallScore atsScore careerReadinessScore createdAt'),
      SkillGapAnalysis.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 }).limit(10).select('matchPercentage targetRole createdAt'),
      EmployabilityScore.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 }).limit(12).select('totalScore tier createdAt'),
      AIConversation.countDocuments({ user: userId }),
      CareerRoadmap.countDocuments({ user: userId, status: 'completed' }),
      UserProfile.findOne({ user: userId }).select('skills completenessScore careerGoals yearsExperience'),
    ]);

    // Application funnel
    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    // Resume score trend
    const resumeTrend = resumeHistory.reverse().map(r => ({
      date: r.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      overall: r.overallScore,
      ats:     r.atsScore,
      readiness: r.careerReadinessScore,
    }));

    // Skill gap trend
    const skillTrend = skillGapHistory.reverse().map(s => ({
      date:   s.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      match:  s.matchPercentage,
      role:   s.targetRole,
    }));

    // Employability trend
    const empTrend = employabilityHistory.reverse().map(e => ({
      date:  e.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      score: e.totalScore,
      tier:  e.tier,
    }));

    // Career growth score (composite)
    const latestEmp   = employabilityHistory[employabilityHistory.length - 1];
    const latestResume = resumeHistory[resumeHistory.length - 1];
    const careerGrowthScore = Math.round(
      ((latestEmp?.totalScore || 0) / 10 * 0.5) +
      ((latestResume?.overallScore || 0) * 0.3) +
      (Math.min(allApps * 5, 20)) +
      ((profile?.completenessScore || 0) * 0.2)
    );

    res.json({
      success: true,
      summary: {
        totalApplications:  allApps,
        recentApplications: recentApps,
        aiConversations:    aiUsage,
        roadmapsGenerated:  roadmaps,
        profileCompleteness: profile?.completenessScore || 0,
        careerGrowthScore: Math.min(100, careerGrowthScore),
        currentEmployabilityScore: latestEmp?.totalScore || 0,
        currentEmployabilityTier:  latestEmp?.tier || 'Not calculated',
      },
      applicationFunnel: {
        applied:     statusMap['applied']     || 0,
        reviewed:    statusMap['reviewed']    || 0,
        shortlisted: statusMap['shortlisted'] || 0,
        interview:   statusMap['interview']   || 0,
        hired:       statusMap['hired']       || 0,
        rejected:    statusMap['rejected']    || 0,
      },
      resumeTrend,
      skillTrend,
      employabilityTrend: empTrend,
      skillsRadar: (profile?.skills || []).slice(0, 8).map(s => ({
        skill: s.name,
        level: { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }[s.level] || 50,
      })),
    });
  } catch (error) { next(error); }
};
