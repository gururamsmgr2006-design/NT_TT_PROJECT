// controllers/aiController.js — FULL REBUILD (original + CIOS endpoints)
const AIConversation   = require('../models/AIConversation');
const ResumeAnalysis   = require('../models/ResumeAnalysis');
const SkillGapAnalysis = require('../models/SkillGapAnalysis');
const CareerRoadmap    = require('../models/CareerRoadmap');
const JobRecommendation= require('../models/JobRecommendation');
const CareerTwin       = require('../models/CareerTwin');
const EmployabilityScore = require('../models/EmployabilityScore');
const CareerTransition = require('../models/CareerTransition');
const CareerInsight    = require('../models/CareerInsight');
const UserProfile      = require('../models/UserProfile');
const Job              = require('../models/Job');
const { callAI, callAIForJSON, SYSTEM_PROMPTS } = require('../services/aiService');

const trimMessages = (msgs, max = 20) => msgs.slice(-max);

// ── CHAT ──────────────────────────────────────────────────────
exports.chat = async (req, res, next) => {
  try {
    const { message, conversationId, context = 'career', language = 'en' } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required.' });
    let conversation;
    if (conversationId) conversation = await AIConversation.findOne({ _id: conversationId, user: req.user._id });
    if (!conversation) {
      conversation = new AIConversation({ user: req.user._id, context, language, messages: [], title: message.slice(0, 60) });
    }
    conversation.messages.push({ role: 'user', content: message });
    const historyForAI = trimMessages(conversation.messages.map(m => ({ role: m.role, content: m.content })));
    const systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.career;
    const reply = await callAI(historyForAI, systemPrompt, language);
    conversation.messages.push({ role: 'assistant', content: reply });
    conversation.context = context; conversation.language = language;
    await conversation.save();
    res.json({ success: true, reply, conversationId: conversation._id });
  } catch (error) { next(error); }
};

exports.getConversations = async (req, res, next) => {
  try {
    const convs = await AIConversation.find({ user: req.user._id, isActive: true })
      .sort({ updatedAt: -1 }).limit(50).select('title context language updatedAt');
    res.json({ success: true, conversations: convs });
  } catch (error) { next(error); }
};

exports.getConversation = async (req, res, next) => {
  try {
    const conv = await AIConversation.findOne({ _id: req.params.id, user: req.user._id });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    res.json({ success: true, conversation: conv });
  } catch (error) { next(error); }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    await AIConversation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (error) { next(error); }
};

// ── RESUME INTELLIGENCE ────────────────────────────────────────
exports.analyzeResume = async (req, res, next) => {
  try {
    const { analysisId, language = 'en' } = req.body;
    if (!analysisId) return res.status(400).json({ success: false, message: 'analysisId is required.' });
    const record = await ResumeAnalysis.findOne({ _id: analysisId, user: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Analysis record not found.' });
    if (record.status === 'completed') return res.json({ success: true, analysis: record });
    const text = (record.extractedText || '').trim().slice(0, 8000);
    if (!text) return res.status(400).json({ success: false, message: 'No extracted text found.' });

    const prompt = `Analyze this resume for the Indian job market. Return ONLY JSON:
{
  "overallScore": <0-100>,
  "atsScore": <0-100>,
  "careerReadinessScore": <0-100>,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingSkills": ["string"],
  "extractedSkills": ["string"],
  "formattingFeedback": "string",
  "keywordAnalysis": { "found": ["string"], "missing": ["string"] },
  "improvementSuggestions": ["string"],
  "certificationSuggestions": ["string"],
  "projectSuggestions": ["string"],
  "interviewPrepTopics": ["string"],
  "careerReadinessBreakdown": { "technicalDepth": <0-100>, "presentationQuality": <0-100>, "marketAlignment": <0-100>, "experienceRelevance": <0-100> }
}
RESUME:
${text}`;

    const result = await callAIForJSON(prompt, SYSTEM_PROMPTS.resume, language);
    record.set({
      overallScore: result.overallScore ?? 0, atsScore: result.atsScore ?? 0,
      careerReadinessScore: result.careerReadinessScore ?? 0,
      strengths: result.strengths || [], weaknesses: result.weaknesses || [],
      missingSkills: result.missingSkills || [], extractedSkills: result.extractedSkills || [],
      formattingFeedback: result.formattingFeedback || '',
      keywordAnalysis: result.keywordAnalysis || { found: [], missing: [] },
      improvementSuggestions: result.improvementSuggestions || [],
      certificationSuggestions: result.certificationSuggestions || [],
      projectSuggestions: result.projectSuggestions || [],
      interviewPrepTopics: result.interviewPrepTopics || [],
      careerReadinessBreakdown: result.careerReadinessBreakdown || {},
      language, status: 'completed',
    });
    await record.save();
    res.json({ success: true, analysis: record });
  } catch (error) {
    await ResumeAnalysis.findByIdAndUpdate(req.body?.analysisId, { status: 'failed', errorMessage: error.message }).catch(() => {});
    next(error);
  }
};

exports.getResumeHistory = async (req, res, next) => {
  try {
    const analyses = await ResumeAnalysis.find({ user: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 }).limit(20).select('-extractedText -rawAnalysis');
    res.json({ success: true, analyses });
  } catch (error) { next(error); }
};

// ── SKILL GAP ─────────────────────────────────────────────────
exports.analyzeSkillGap = async (req, res, next) => {
  try {
    const { targetRole, userSkills = [], language = 'en' } = req.body;
    if (!targetRole) return res.status(400).json({ success: false, message: 'targetRole is required.' });
    if (!userSkills.length) return res.status(400).json({ success: false, message: 'userSkills array is required.' });
    const record = await SkillGapAnalysis.create({ user: req.user._id, targetRole, userSkills, language, status: 'pending' });
    const prompt = `Skill gap analysis for "${targetRole}". User skills: ${userSkills.join(', ')}
Return JSON:
{"matchPercentage":<0-100>,"presentSkills":["string"],"missingSkills":[{"skill":"string","importance":"critical|high|medium|low","estimatedHours":<number>,"resources":["string"],"learningPriority":<1-10>}],"learningPath":[{"phase":<number>,"title":"string","duration":"string","skills":["string"],"resources":["string"]}],"summary":"string"}`;
    const result = await callAIForJSON(prompt, SYSTEM_PROMPTS.skillGap, language);
    record.set({ ...result, status: 'completed' });
    await record.save();
    res.json({ success: true, skillGap: record });
  } catch (error) { next(error); }
};

exports.getSkillGapHistory = async (req, res, next) => {
  try {
    const history = await SkillGapAnalysis.find({ user: req.user._id, status: 'completed' }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, history });
  } catch (error) { next(error); }
};

// ── CAREER ROADMAP ────────────────────────────────────────────
exports.generateRoadmap = async (req, res, next) => {
  try {
    const { targetCareer, currentSkills = [], education = '', experience = '', language = 'en' } = req.body;
    if (!targetCareer) return res.status(400).json({ success: false, message: 'targetCareer is required.' });
    const record = await CareerRoadmap.create({ user: req.user._id, targetCareer, currentSkills, education, experience, language, status: 'pending' });
    const prompt = `Career roadmap for "${targetCareer}". Skills: ${currentSkills.join(', ')||'None'}. Education: ${education}. Experience: ${experience}.
Return JSON:
{"summary":"string","totalDuration":"string","salaryRange":"string","jobOutlook":"string","phases":[{"phase":<number>,"title":"string","duration":"string","skills":["string"],"certifications":["string"],"projects":["string"],"resources":["string"],"milestones":["string"]}],"interviewPrep":["string"]}`;
    const result = await callAIForJSON(prompt, SYSTEM_PROMPTS.roadmap, language);
    record.set({ ...result, status: 'completed' });
    await record.save();
    res.json({ success: true, roadmap: record });
  } catch (error) { next(error); }
};

exports.getRoadmapHistory = async (req, res, next) => {
  try {
    const history = await CareerRoadmap.find({ user: req.user._id, status: 'completed' }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, history });
  } catch (error) { next(error); }
};

// ── JOB RECOMMENDATIONS ───────────────────────────────────────
exports.generateRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [latestResume, latestSkillGap, profile] = await Promise.all([
      ResumeAnalysis.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 }),
      SkillGapAnalysis.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 }),
      UserProfile.findOne({ user: userId }),
    ]);
    const skills = [...new Set([
      ...(latestResume?.keywordAnalysis?.found || []),
      ...(latestResume?.extractedSkills || []),
      ...(latestSkillGap?.presentSkills || []),
      ...(profile?.skills?.map(s => s.name) || []),
    ])].slice(0, 30);
    if (!skills.length) return res.status(400).json({ success: false, message: 'Complete a Resume Analysis or Skill Gap first.' });

    const jobs = await Job.find({ isActive: true }).limit(30).select('title company location jobType category salaryDisplay description requirements');
    if (!jobs.length) return res.json({ success: true, recommendations: [] });

    const prompt = `Match candidate to jobs. Return JSON array (top 8):
Candidate skills: ${skills.join(', ')}
Target role: ${latestSkillGap?.targetRole || profile?.careerGoals?.targetRole || 'Any'}
Experience: ${profile?.yearsExperience || 0} years

Jobs:
${jobs.map((j, i) => `${i}. ${j.title} @ ${j.company} (${j.location}) ${j.salaryDisplay} — ${(j.requirements||j.description||'').slice(0,200)}`).join('\n')}

[{"jobIndex":<number>,"matchPercentage":<0-100>,"matchReasons":["string"],"missingSkills":["string"],"applicationTip":"string","demandLevel":"High|Medium|Low","salaryPotential":"string","careerGrowthPotential":"string"}]`;

    const results = await callAIForJSON(prompt, SYSTEM_PROMPTS.jobMatch);
    const recommendations = (Array.isArray(results) ? results : [])
      .filter(r => r.jobIndex >= 0 && r.jobIndex < jobs.length)
      .map(r => ({ job: jobs[r.jobIndex]._id, ...r }));

    await JobRecommendation.findOneAndUpdate(
      { user: userId },
      { user: userId, recommendations, generatedAt: new Date(), expiresAt: new Date(Date.now() + 86400000) },
      { upsert: true, new: true }
    );
    const populated = await JobRecommendation.findOne({ user: userId }).populate('recommendations.job');
    res.json({ success: true, recommendations: populated.recommendations, generatedAt: populated.generatedAt });
  } catch (error) { next(error); }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const rec = await JobRecommendation.findOne({ user: req.user._id }).populate('recommendations.job').sort({ generatedAt: -1 });
    res.json({ success: true, recommendations: rec?.recommendations || [], generatedAt: rec?.generatedAt || null });
  } catch (error) { next(error); }
};

// ── CAREER DIGITAL TWIN ────────────────────────────────────────
exports.generateCareerTwin = async (req, res, next) => {
  try {
    const { skills = [], experience = '', certifications = [], education = '', interests = [], currentRole = '', language = 'en' } = req.body;
    if (!skills.length && !currentRole) return res.status(400).json({ success: false, message: 'Provide skills or current role.' });

    const record = await CareerTwin.create({ user: req.user._id, inputSnapshot: { skills, experience, certifications, education, interests, currentRole }, status: 'pending' });

    const prompt = `Career Digital Twin for Indian professional:
Role: ${currentRole||'N/A'} | Skills: ${skills.join(', ')} | Exp: ${experience} | Edu: ${education} | Certs: ${certifications.join(', ')||'None'} | Interests: ${interests.join(', ')||'N/A'}

Return JSON:
{
  "currentIdentity":{"careerHealth":"string","careerHealthScore":<0-100>,"skillStrength":"string","skillStrengthScore":<0-100>,"marketValue":"string","marketValueScore":<0-100>,"experienceLevel":"string","industryPosition":"string","summary":"string"},
  "careerPaths":[{"pathName":"string","salaryGrowth":"string","currentAvgSalary":"string","peakSalary":"string","industryDemand":"Very High|High|Medium|Low|Declining","competitionLevel":"Very High|High|Medium|Low","automationRisk":"High|Medium|Low|Very Low","requiredSkills":["string"],"progression":["string"],"successProbability":<0-100>,"timelineMonths":<number>,"whyGoodFit":"string"}],
  "topRecommendedPath":"string"
}
Generate 5 career paths using Indian market data (₹LPA salaries).`;

    const result = await callAIForJSON(prompt, SYSTEM_PROMPTS.digitalTwin, language);
    record.set({ currentIdentity: result.currentIdentity||{}, careerPaths: result.careerPaths||[], topRecommendedPath: result.topRecommendedPath||'', status: 'completed' });
    await record.save();
    res.json({ success: true, twin: record });
  } catch (error) { next(error); }
};

exports.getCareerTwin = async (req, res, next) => {
  try {
    const twin = await CareerTwin.findOne({ user: req.user._id, status: 'completed' }).sort({ createdAt: -1 });
    res.json({ success: true, twin: twin || null });
  } catch (error) { next(error); }
};

// ── EMPLOYABILITY SCORE ────────────────────────────────────────
exports.calculateEmployability = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { language = 'en' } = req.body || {};
    const [latestResume, latestSkillGap, profile, prevScore] = await Promise.all([
      ResumeAnalysis.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 }),
      SkillGapAnalysis.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 }),
      UserProfile.findOne({ user: userId }),
      EmployabilityScore.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 }),
    ]);
    const record = await EmployabilityScore.create({ user: userId, totalScore: 0, status: 'pending' });

    const prompt = `Calculate Employability Score (0-1000) for Indian professional.
Resume Score: ${latestResume?.overallScore||'N/A'} | ATS: ${latestResume?.atsScore||'N/A'} | Career Readiness: ${latestResume?.careerReadinessScore||'N/A'}
Skills: ${profile?.skills?.map(s=>`${s.name}(${s.level})`).join(', ')||latestSkillGap?.presentSkills?.join(', ')||'N/A'}
Exp: ${profile?.yearsExperience||0}yr | Certs: ${profile?.certifications?.length||0} | Projects: ${profile?.projects?.length||0}
Skill Match: ${latestSkillGap?.matchPercentage||'N/A'}% | LinkedIn: ${profile?.socialLinks?.linkedin?'Yes':'No'} | GitHub: ${profile?.socialLinks?.github?'Yes':'No'}

Return JSON:
{"totalScore":<0-1000>,"breakdown":{"resumeQuality":<0-100>,"technicalSkills":<0-100>,"softSkills":<0-100>,"certifications":<0-100>,"projects":<0-100>,"experience":<0-100>,"marketDemand":<0-100>,"communication":<0-100>,"aiReadiness":<0-100>},"improvementRecommendations":["string"],"topStrength":"string","criticalGap":"string"}`;

    const result = await callAIForJSON(prompt, SYSTEM_PROMPTS.employability, language);
    const prevTotal = prevScore?.totalScore || 0;
    record.set({ totalScore: result.totalScore||0, breakdown: result.breakdown||{}, improvementRecommendations: result.improvementRecommendations||[], weeklyGrowth: Math.max(0,(result.totalScore||0)-prevTotal), monthlyGrowth: Math.max(0,(result.totalScore||0)-prevTotal), status: 'completed' });
    await record.save();
    res.json({ success: true, score: record });
  } catch (error) { next(error); }
};

exports.getEmployabilityHistory = async (req, res, next) => {
  try {
    const history = await EmployabilityScore.find({ user: req.user._id, status: 'completed' }).sort({ createdAt: -1 }).limit(20).select('-improvementRecommendations');
    res.json({ success: true, history });
  } catch (error) { next(error); }
};

// ── CAREER ESCAPE VELOCITY ─────────────────────────────────────
exports.analyzeCareerEscape = async (req, res, next) => {
  try {
    const { currentRole, currentSalary = '', language = 'en' } = req.body;
    if (!currentRole) return res.status(400).json({ success: false, message: 'currentRole is required.' });
    const profile = await UserProfile.findOne({ user: req.user._id });
    const skills = profile?.skills?.map(s => s.name) || [];
    const record = await CareerTransition.create({ user: req.user._id, currentRole, currentSalary, status: 'pending' });

    const prompt = `Career Escape Velocity for Indian professional.
Current Role: ${currentRole} | Salary: ${currentSalary||'N/A'} | Skills: ${skills.join(', ')||'N/A'} | Exp: ${profile?.yearsExperience||0}yr

Return JSON:
{"transferableSkills":["string"],"summary":"string","transitions":[{"targetRole":"string","targetIndustry":"string","difficulty":"Easy|Moderate|Challenging|Hard|Very Hard","estimatedTimeMonths":<number>,"expectedSalaryIncrease":"string","successProbability":<0-100>,"requiredUpskilling":["string"],"whyPossible":"string","firstSteps":["string"]}]}

Provide 4-6 transition options using Indian job market context.`;

    const result = await callAIForJSON(prompt, SYSTEM_PROMPTS.escapeVelocity, language);
    record.set({ transferableSkills: result.transferableSkills||[], transitions: result.transitions||[], summary: result.summary||'', status: 'completed' });
    await record.save();
    res.json({ success: true, transition: record });
  } catch (error) { next(error); }
};

exports.getCareerEscapeHistory = async (req, res, next) => {
  try {
    const history = await CareerTransition.find({ user: req.user._id, status: 'completed' }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, history });
  } catch (error) { next(error); }
};

// ── CAREER INSIGHTS ────────────────────────────────────────────
exports.getInsights = async (req, res, next) => {
  try {
    const existing = await CareerInsight.findOne({ user: req.user._id, status: 'completed' }).sort({ createdAt: -1 });
    if (existing && (Date.now() - existing.createdAt < 86400000)) {
      return res.json({ success: true, insights: existing.insights, generatedAt: existing.generatedAt, profileCompletenessPct: existing.profileCompletenessPct, cached: true });
    }
    return exports.refreshInsights(req, res, next);
  } catch (error) { next(error); }
};

exports.refreshInsights = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { language = 'en' } = req.body || {};
    const Application = require('../models/Application');
    const [profile, resume, score, skillGap, appCount] = await Promise.all([
      UserProfile.findOne({ user: userId }),
      ResumeAnalysis.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 }),
      EmployabilityScore.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 }),
      SkillGapAnalysis.findOne({ user: userId, status: 'completed' }).sort({ createdAt: -1 }),
      Application.countDocuments({ applicant: userId }),
    ]);
    const record = await CareerInsight.create({ user: userId, status: 'pending' });
    const prompt = `Generate personalized career insights for Indian professional.
Role: ${profile?.currentRole||'N/A'} | Skills: ${profile?.skills?.map(s=>s.name).join(', ')||'N/A'} | Exp: ${profile?.yearsExperience||0}yr
Certs: ${profile?.certifications?.map(c=>c.name).join(', ')||'None'} | Goal: ${profile?.careerGoals?.targetRole||'N/A'}
Resume Score: ${resume?.overallScore||'N/A'}/100 | ATS: ${resume?.atsScore||'N/A'}/100 | Employability: ${score?.totalScore||'N/A'}/1000
Skill Match: ${skillGap?.matchPercentage||'N/A'}% | Applications: ${appCount}

Return JSON:
{"insights":[{"type":"opportunity|risk|salary|hidden-skill|readiness|growth","icon":"emoji","title":"short title","message":"specific message with numbers","impact":"high|medium|low","actionRequired":"string","metric":"string"}],"profileCompletenessPct":<0-100>}

Generate 6-8 specific, data-driven insights.`;
    const result = await callAIForJSON(prompt, SYSTEM_PROMPTS.insights, language);
    record.set({ insights: result.insights||[], profileCompletenessPct: result.profileCompletenessPct||profile?.completenessScore||0, generatedAt: new Date(), status: 'completed' });
    await record.save();
    res.json({ success: true, insights: record.insights, generatedAt: record.generatedAt, profileCompletenessPct: record.profileCompletenessPct });
  } catch (error) { next(error); }
};
