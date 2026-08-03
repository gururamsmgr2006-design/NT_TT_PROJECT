// ============================================================
// routes/jobRoutes.js (UPDATED — added /home route)
// ============================================================

const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const {
  getHomeJobs, getJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

const jobValidation = [
  body('title').trim().notEmpty().withMessage('Job title is required.'),
  body('company').trim().notEmpty().withMessage('Company name is required.'),
  body('location').trim().notEmpty().withMessage('Location is required.'),
  body('description')
    .trim().notEmpty().withMessage('Job description is required.')
    .isLength({ min: 50 }).withMessage('Description must be at least 50 characters.'),
  body('category')
    .optional()
    .isIn(['tech','finance','marketing','design','sales','hr','operations','other'])
    .withMessage('Invalid category.'),
  body('jobType')
    .optional()
    .isIn(['fulltime','parttime','internship','contract','remote'])
    .withMessage('Invalid job type.'),
  body('experienceLevel')
    .optional()
    .isIn(['entry','mid','senior','lead','any'])
    .withMessage('Invalid experience level.'),
];

// ─── Public Routes ────────────────────────────────────────────
router.get('/home',                                         getHomeJobs);  // NEW
router.get('/',                                             getJobs);
router.get('/recruiter/my-jobs', protect, authorize('recruiter'), getMyJobs);
router.get('/:id',                                          getJobById);

// ─── Protected Recruiter Routes ───────────────────────────────
router.post('/',    protect, authorize('recruiter'), jobValidation, createJob);
router.put('/:id',  protect, authorize('recruiter'), jobValidation, updateJob);
router.delete('/:id', protect, authorize('recruiter'), deleteJob);

module.exports = router;
