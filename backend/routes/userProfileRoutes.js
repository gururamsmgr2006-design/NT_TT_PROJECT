// routes/userProfileRoutes.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getFullProfile, updateFullProfile, exportData,
  deleteAccount, updateSettings, verifyPasswordForDelete,
} = require('../controllers/userProfileController');

router.get('/full',             protect, getFullProfile);
router.put('/full',             protect, updateFullProfile);
router.put('/settings',         protect, updateSettings);
router.get('/export',           protect, exportData);
router.post('/verify-delete',   protect, verifyPasswordForDelete);
router.delete('/account',       protect, deleteAccount);

module.exports = router;
