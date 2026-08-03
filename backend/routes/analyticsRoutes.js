// routes/analyticsRoutes.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboard } = require('../controllers/analyticsController');

router.get('/dashboard', protect, getDashboard);

module.exports = router;
