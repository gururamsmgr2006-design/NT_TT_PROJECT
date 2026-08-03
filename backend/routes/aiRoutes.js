// routes/aiRoutes.js — UPDATED with all CIOS endpoints
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  chat, getConversations, getConversation, deleteConversation,
  analyzeResume, getResumeHistory,
  analyzeSkillGap, getSkillGapHistory,
  generateRoadmap, getRoadmapHistory,
  generateRecommendations, getRecommendations,
  generateCareerTwin, getCareerTwin,
  calculateEmployability, getEmployabilityHistory,
  analyzeCareerEscape, getCareerEscapeHistory,
  getInsights, refreshInsights,
} = require('../controllers/aiController');

router.use(protect);

// ── Chat ──────────────────────────────────────────────────────
router.post('/chat',                chat);
router.get('/conversations',        getConversations);
router.get('/conversations/:id',    getConversation);
router.delete('/conversations/:id', deleteConversation);

// ── Resume Intelligence ───────────────────────────────────────
router.post('/resume/analyze',  analyzeResume);
router.get('/resume/history',   getResumeHistory);

// ── Skill Gap ─────────────────────────────────────────────────
router.post('/skill-gap',         analyzeSkillGap);
router.get('/skill-gap/history',  getSkillGapHistory);

// ── Career Roadmap ────────────────────────────────────────────
router.post('/roadmap',         generateRoadmap);
router.get('/roadmap/history',  getRoadmapHistory);

// ── Smart Job Matches ─────────────────────────────────────────
router.post('/recommendations/generate', generateRecommendations);
router.get('/recommendations',           getRecommendations);

// ── Career Digital Twin ───────────────────────────────────────
router.post('/career-twin', generateCareerTwin);
router.get('/career-twin',  getCareerTwin);

// ── Employability Score ───────────────────────────────────────
router.post('/employability',         calculateEmployability);
router.get('/employability/history',  getEmployabilityHistory);

// ── Career Escape Velocity ────────────────────────────────────
router.post('/career-escape',         analyzeCareerEscape);
router.get('/career-escape/history',  getCareerEscapeHistory);

// ── Career Insights ───────────────────────────────────────────
router.get('/insights',          getInsights);
router.post('/insights/refresh', refreshInsights);

module.exports = router;
