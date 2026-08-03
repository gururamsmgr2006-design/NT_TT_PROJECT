// routes/achievementRoutes.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getAchievements, checkAchievements } = require('../controllers/achievementController');

router.get('/',      protect, getAchievements);
router.post('/check',protect, checkAchievements);

module.exports = router;
