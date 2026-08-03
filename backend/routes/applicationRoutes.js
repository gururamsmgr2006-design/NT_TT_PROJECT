// ============================================================
// routes/applicationRoutes.js — Application Endpoints
//
// POST   /api/applications/:jobId        — Apply to job (jobseeker)
// GET    /api/applications/my-applications — My applications (jobseeker)
// GET    /api/applications/job/:jobId    — Applicants for a job (recruiter)
// PUT    /api/applications/:id/status    — Update status (recruiter)
// DELETE /api/applications/:id           — Withdraw application (jobseeker)
// ============================================================

const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
  withdrawApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── Jobseeker Routes ─────────────────────────────────────────
// apply: optional resume file upload alongside the application
router.post('/:jobId', protect, authorize('jobseeker'), upload.single('resume'), applyToJob);
router.get('/my-applications', protect, authorize('jobseeker'), getMyApplications);
router.delete('/:id', protect, authorize('jobseeker'), withdrawApplication);

// ─── Recruiter Routes ─────────────────────────────────────────
router.get('/job/:jobId', protect, authorize('recruiter'), getApplicantsForJob);
router.put('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);

module.exports = router;
