const express = require('express');
const router  = express.Router();
const { submitFeedback, getAllFeedback, setResolved, deleteFeedback } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', submitFeedback);                                          // public form
router.get('/', protect, authorize('admin'), getAllFeedback);              // was 'recruiter'
router.patch('/:id/resolve', protect, authorize('admin'), setResolved);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;