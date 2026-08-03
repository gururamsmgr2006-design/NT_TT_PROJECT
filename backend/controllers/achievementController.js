// controllers/achievementController.js — Badge engine
const Achievement    = require('../models/Achievement');
const Application    = require('../models/Application');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const EmployabilityScore = require('../models/EmployabilityScore');
const UserProfile    = require('../models/UserProfile');
const CareerTwin     = require('../models/CareerTwin');
const AIConversation = require('../models/AIConversation');

const ALL_BADGES = [
  { id:'first_resume',       name:'Resume Ready',         description:'Uploaded your first resume',              category:'career',       icon:'📄', color:'#6366f1', rarity:'common'    },
  { id:'first_application',  name:'First Step',           description:'Submitted your first job application',    category:'career',       icon:'🚀', color:'#10b981', rarity:'common'    },
  { id:'five_applications',  name:'Active Seeker',        description:'Applied to 5+ jobs',                      category:'career',       icon:'⚡', color:'#f59e0b', rarity:'common'    },
  { id:'twenty_applications',name:'Power Applicant',      description:'Applied to 20+ jobs',                     category:'career',       icon:'💪', color:'#ef4444', rarity:'rare'      },
  { id:'interview_stage',    name:'Interview Ready',      description:'Reached interview stage',                 category:'career',       icon:'🎯', color:'#8b5cf6', rarity:'rare'      },
  { id:'first_offer',        name:'Offer Received',       description:'Received a job offer',                    category:'career',       icon:'🏆', color:'#f59e0b', rarity:'epic'      },
  { id:'emp_400',            name:'Developing',           description:'Employability Score 400+',                category:'employability', icon:'📈', color:'#06b6d4', rarity:'common'    },
  { id:'emp_600',            name:'Competitive',          description:'Employability Score 600+',                category:'employability', icon:'⭐', color:'#6366f1', rarity:'rare'      },
  { id:'emp_800',            name:'Elite Performer',      description:'Employability Score 800+',                category:'employability', icon:'💎', color:'#f59e0b', rarity:'epic'      },
  { id:'top_performer',      name:'Top Performer',        description:'Employability Score 900+',                category:'employability', icon:'🌟', color:'#f59e0b', rarity:'legendary' },
  { id:'profile_complete',   name:'Identity Established', description:'Completed 80%+ of your profile',          category:'career',       icon:'🧬', color:'#06b6d4', rarity:'common'    },
  { id:'career_twin',        name:'Digital Self',         description:'Generated your Career Digital Twin',      category:'career',       icon:'🤖', color:'#8b5cf6', rarity:'rare'      },
  { id:'future_ready',       name:'Future Ready',         description:'Career Digital Twin with 5 paths',        category:'career',       icon:'🚀', color:'#8b5cf6', rarity:'epic'      },
  { id:'skill_master',       name:'Skill Master',         description:'Added 10+ skills to your profile',        category:'skill',        icon:'🧠', color:'#10b981', rarity:'rare'      },
  { id:'ai_pioneer',         name:'AI Pioneer',           description:'Used AI assistant 20+ times',             category:'learning',     icon:'🤖', color:'#6366f1', rarity:'rare'      },
  { id:'career_transformer', name:'Career Transformer',   description:'Completed Career Escape Velocity engine', category:'career',       icon:'🔥', color:'#ef4444', rarity:'epic'      },
  { id:'resume_ace',         name:'Resume Ace',           description:'Resume score above 85',                   category:'skill',        icon:'📝', color:'#10b981', rarity:'rare'      },
  { id:'hidden_streak_7',    name:'Dedicated',            description:'7-day login streak',                      category:'streak',       icon:'🔥', color:'#ef4444', rarity:'rare',  hidden:true },
  { id:'hidden_all_ai',      name:'AI Whisperer',         description:'Used all 5 AI modes',                     category:'learning',     icon:'🔮', color:'#8b5cf6', rarity:'legendary', hidden:true },
];

const RARITY_POINTS = { common:10, rare:25, epic:50, legendary:100 };

exports.getAchievements = async (req, res, next) => {
  try {
    let achievement = await Achievement.findOne({ user: req.user._id });
    if (!achievement) achievement = await Achievement.create({ user: req.user._id });
    const earnedIds = new Set(achievement.badges.map(b => b.id));
    const allBadges = ALL_BADGES.map(b => ({
      ...b,
      earned:   earnedIds.has(b.id),
      earnedAt: achievement.badges.find(eb => eb.id === b.id)?.earnedAt || null,
    }));
    res.json({ success:true, badges: allBadges, progress: achievement.progress, streaks: achievement.streaks, totalPoints: achievement.totalPoints, level: achievement.level });
  } catch (error) { next(error); }
};

exports.checkAchievements = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let achievement = await Achievement.findOne({ user: userId });
    if (!achievement) achievement = await Achievement.create({ user: userId });
    const earnedIds = new Set(achievement.badges.map(b => b.id));
    const newBadges = [];

    const [appCount, resumeCount, empScore, profile, twin, aiCount, escapeCount, interviewApp, hiredApp, latestResume] = await Promise.all([
      Application.countDocuments({ applicant: userId }),
      ResumeAnalysis.countDocuments({ user: userId, status:'completed' }),
      EmployabilityScore.findOne({ user: userId, status:'completed' }).sort({ createdAt:-1 }),
      UserProfile.findOne({ user: userId }),
      CareerTwin.findOne({ user: userId, status:'completed' }),
      AIConversation.countDocuments({ user: userId }),
      require('../models/CareerTransition').countDocuments({ user: userId, status:'completed' }),
      Application.findOne({ applicant: userId, status:'interview' }),
      Application.findOne({ applicant: userId, status:'hired' }),
      ResumeAnalysis.findOne({ user: userId, status:'completed' }).sort({ createdAt:-1 }),
    ]);

    const checks = [
      { id:'first_resume',        condition: resumeCount >= 1 },
      { id:'first_application',   condition: appCount >= 1 },
      { id:'five_applications',   condition: appCount >= 5 },
      { id:'twenty_applications', condition: appCount >= 20 },
      { id:'interview_stage',     condition: !!interviewApp },
      { id:'first_offer',         condition: !!hiredApp },
      { id:'emp_400',             condition: (empScore?.totalScore||0) >= 400 },
      { id:'emp_600',             condition: (empScore?.totalScore||0) >= 600 },
      { id:'emp_800',             condition: (empScore?.totalScore||0) >= 800 },
      { id:'top_performer',       condition: (empScore?.totalScore||0) >= 900 },
      { id:'profile_complete',    condition: (profile?.completenessScore||0) >= 80 },
      { id:'career_twin',         condition: !!twin },
      { id:'future_ready',        condition: (twin?.careerPaths?.length||0) >= 5 },
      { id:'skill_master',        condition: (profile?.skills?.length||0) >= 10 },
      { id:'ai_pioneer',          condition: aiCount >= 20 },
      { id:'career_transformer',  condition: escapeCount >= 1 },
      { id:'resume_ace',          condition: (latestResume?.overallScore||0) >= 85 },
    ];

    for (const check of checks) {
      if (check.condition && !earnedIds.has(check.id)) {
        const badge = ALL_BADGES.find(b => b.id === check.id);
        if (badge) {
          achievement.badges.push({ ...badge, earnedAt: new Date() });
          newBadges.push(badge);
          achievement.totalPoints += RARITY_POINTS[badge.rarity] || 10;
        }
      }
    }

    achievement.progress.resumeUploads     = resumeCount;
    achievement.progress.applicationsCount = appCount;
    achievement.progress.interviewsCount   = await Application.countDocuments({ applicant: userId, status:'interview' });
    achievement.progress.offersCount       = await Application.countDocuments({ applicant: userId, status:'hired' });
    achievement.progress.employabilityPeak = Math.max(achievement.progress.employabilityPeak, empScore?.totalScore||0);
    achievement.progress.twinGenerated     = !!twin;
    achievement.progress.profileComplete   = (profile?.completenessScore||0) >= 80;
    achievement.progress.aiChatsCount      = aiCount;
    achievement.level = Math.floor(achievement.totalPoints / 100) + 1;
    await achievement.save();

    res.json({ success:true, newBadges, totalPoints: achievement.totalPoints, level: achievement.level });
  } catch (error) { next(error); }
};
