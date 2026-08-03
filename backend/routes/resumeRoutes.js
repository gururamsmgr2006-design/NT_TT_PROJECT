// ============================================================
// routes/resumeRoutes.js
// ============================================================

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const os       = require('os');
const { protect } = require('../middleware/auth');
const { uploadResume, getAnalysis } = require('../controllers/resumeController');

// Use OS temp dir so no persistent storage needed
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename:    (req, file, cb) => {
    const safe = Date.now() + '_' + Math.random().toString(36).slice(2);
    cb(null, safe + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are accepted.'));
    }
  },
});

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/:id',    protect, getAnalysis);

module.exports = router;
