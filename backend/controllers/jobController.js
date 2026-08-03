// ============================================================
// controllers/jobController.js (UPDATED)
// Added: getHomeJobs, getFeaturedJobs, getInternships
// ============================================================

const { validationResult } = require('express-validator');
const Job         = require('../models/Job');
const Application = require('../models/Application');

// ─────────────────────────────────────────────────────────────
// @route   GET /api/jobs/home
// @desc    Home page data: latest + featured jobs & internships
// @access  Public
// ─────────────────────────────────────────────────────────────
exports.getHomeJobs = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;
    const lim = Math.min(12, parseInt(limit, 10) || 6);
    const baseQuery = { isActive: true };

    const [latestJobs, latestInternships, featuredJobs, featuredInternships] = await Promise.all([
      Job.find({ ...baseQuery, jobType: { $ne: 'internship' } })
        .populate('postedBy', 'fullName companyName')
        .sort({ createdAt: -1 })
        .limit(lim),
      Job.find({ ...baseQuery, jobType: 'internship' })
        .populate('postedBy', 'fullName companyName')
        .sort({ createdAt: -1 })
        .limit(lim),
      Job.find({ ...baseQuery, jobType: { $ne: 'internship' } })
        .populate('postedBy', 'fullName companyName')
        .sort({ applicationCount: -1, createdAt: -1 })
        .limit(lim),
      Job.find({ ...baseQuery, jobType: 'internship' })
        .populate('postedBy', 'fullName companyName')
        .sort({ applicationCount: -1, createdAt: -1 })
        .limit(lim),
    ]);

    res.json({
      success: true,
      latestJobs,
      latestInternships,
      featuredJobs,
      featuredInternships,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/jobs
// @desc    List active jobs with search + filter + pagination
// @access  Public
// ─────────────────────────────────────────────────────────────
exports.getJobs = async (req, res, next) => {
  try {
    const {
      keyword,
      location,
      category,
      jobType,
      experienceLevel,
      page  = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    if (keyword) {
      if (keyword.trim().length >= 2) {
        query.$text = { $search: keyword };
      } else {
        query.$or = [
          { title:       { $regex: keyword, $options: 'i' } },
          { company:     { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ];
      }
    }

    if (location)        query.location        = { $regex: location, $options: 'i' };
    if (category)        query.category        = category;
    if (jobType)         query.jobType         = jobType;
    if (experienceLevel) query.experienceLevel = experienceLevel;

    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(50, parseInt(limit, 10) || 12);
    const skip     = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'fullName companyName email')
        .sort(keyword ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count:       jobs.length,
      total,
      totalPages:  Math.ceil(total / limitNum),
      currentPage: pageNum,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/jobs/:id  @access Public
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'fullName companyName email');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/jobs  @access Private Recruiter
exports.createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ success: true, message: 'Job posted successfully!', job });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/jobs/:id  @access Private Recruiter
exports.updateJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    let job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this job.' });
    }

    const ALLOWED_FIELDS = [
      'title','company','location','description','requirements',
      'salaryMin','salaryMax','salaryDisplay',
      'category','jobType','experienceLevel',
      'applyUrl','isActive','deadline',
    ];
    const updates = {};
    ALLOWED_FIELDS.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    job = await Job.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Job updated!', job });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/jobs/:id  @access Private Recruiter
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await Application.deleteMany({ job: req.params.id });
    await job.deleteOne();
    res.status(200).json({ success: true, message: 'Job deleted.' });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/jobs/recruiter/my-jobs  @access Private Recruiter
exports.getMyJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const skip     = (pageNum - 1) * limitNum;

    const query = { postedBy: req.user._id };
    if (search) {
      query.$or = [
        { title:    { $regex: search, $options: 'i' } },
        { company:  { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Job.countDocuments(query),
    ]);

    res.status(200).json({
      success: true, count: jobs.length, total,
      totalPages: Math.ceil(total / limitNum), currentPage: pageNum, jobs,
    });
  } catch (error) {
    next(error);
  }
};
