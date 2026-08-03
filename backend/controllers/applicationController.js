// ============================================================
// controllers/applicationController.js — Job Applications
//
// FIXES APPLIED:
//   SEC-10: recruiterNotes sanitized before saving
//   PERF:   getMyApplications now supports pagination
// ============================================================

const Application = require('../models/Application');
const Job         = require('../models/Job');
const User        = require('../models/User');
const validator   = require('validator');

// ─────────────────────────────────────────────────────────────
// @route   POST /api/applications/:jobId
// @access  Private — Jobseeker only
// ─────────────────────────────────────────────────────────────
exports.applyToJob = async (req, res, next) => {
  try {
    const { jobId }      = req.params;
    const { coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (!job.isActive) return res.status(400).json({ success: false, message: 'This job posting is no longer active.' });

    const existing = await Application.findOne({ job: jobId, applicant: req.user._id });
    if (existing) return res.status(409).json({ success: false, message: 'You have already applied to this job.' });

    let resumeUrl          = null;
    let resumeOriginalName = null;

    if (req.file) {
      // Cloudinary (production) or local (dev) — upload.js sets req.file.path (Cloudinary URL) or req.file.filename
      resumeUrl = req.file.path || `/uploads/resumes/${req.file.filename}`;
      resumeOriginalName = req.file.originalname;
    } else {
      const user = await User.findById(req.user._id).select('resumeUrl');
      resumeUrl  = user.resumeUrl || null;
    }

    const application = await Application.create({
      job:       jobId,
      applicant: req.user._id,
      coverLetter: coverLetter ? validator.escape(coverLetter.trim().slice(0, 2000)) : '',
      resumeUrl,
      resumeOriginalName,
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! Good luck 🎉',
      application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already applied to this job.' });
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/applications/my-applications
// @access  Private — Jobseeker only
//
// FIX PERF: Added pagination (was returning ALL applications unbounded)
// The Application.applicant index (added in models/Application.js)
// makes this query fast even with thousands of records.
// ─────────────────────────────────────────────────────────────
exports.getMyApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const skip     = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      Application.find({ applicant: req.user._id })
        .populate('job', 'title company location salaryDisplay jobType isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Application.countDocuments({ applicant: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      count:       applications.length,
      total,
      totalPages:  Math.ceil(total / limitNum),
      currentPage: pageNum,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/applications/job/:jobId
// @access  Private — Recruiter only (must own the job)
// ─────────────────────────────────────────────────────────────
exports.getApplicantsForJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these applicants.' });
    }
    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'fullName email phone location resumeUrl')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: applications.length, job: job.title, applications });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   PUT /api/applications/:id/status
// @access  Private — Recruiter only
//
// FIX SEC-10: Sanitize recruiterNotes with validator.escape()
// to prevent HTML/script tag injection into stored notes.
// ─────────────────────────────────────────────────────────────
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, recruiterNotes } = req.body;

    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await Application.findById(req.params.id).populate('job', 'postedBy');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application.' });
    }

    application.status = status;

    // FIX: Sanitize recruiterNotes before storing — strip HTML tags/entities
    if (recruiterNotes !== undefined) {
      application.recruiterNotes = validator.escape(String(recruiterNotes).trim().slice(0, 1000));
    }

    await application.save();
    res.status(200).json({ success: true, message: 'Application status updated.', application });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   DELETE /api/applications/:id
// @access  Private — Jobseeker only
// ─────────────────────────────────────────────────────────────
exports.withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to withdraw this application.' });
    }
    await application.deleteOne();
    await Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });
    res.status(200).json({ success: true, message: 'Application withdrawn.' });
  } catch (error) {
    next(error);
  }
};
