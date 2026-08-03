// routes/marketRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSkillRadar, getMarketTrends, forceRefresh } = require('../controllers/marketController');

router.get('/skill-radar',  protect, getSkillRadar);
router.get('/trends',       protect, getMarketTrends);
router.post('/refresh',     protect, authorize('recruiter'), forceRefresh);

module.exports = router;
