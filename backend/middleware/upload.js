// ============================================================
// middleware/upload.js — Resume File Upload (Multer)
//
// FIX SEC-9: Use Cloudinary in production for persistent storage.
//            Local disk storage only in development.
//
// Requires: npm install cloudinary multer-storage-cloudinary
// ============================================================

const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

// ─── File Filter — PDF, DOC, DOCX only ───────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes.'), false);
  }
};

const fileSizeLimit = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
};

let upload;

if (process.env.NODE_ENV === 'production' && process.env.CLOUDINARY_CLOUD_NAME) {
  // ── PRODUCTION: Cloudinary storage ─────────────────────────
  const cloudinary                = require('cloudinary').v2;
  const { CloudinaryStorage }     = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:        'talenttrack/resumes',
      resource_type: 'raw',  // Required for PDFs and documents
      public_id:     `${req.user._id}_${Date.now()}`,
      allowed_formats: ['pdf', 'doc', 'docx'],
    }),
  });

  upload = multer({ storage, fileFilter, limits: fileSizeLimit });
  console.log('📦 File uploads: Cloudinary (production)');

} else {
  // ── DEVELOPMENT: Local disk storage ────────────────────────
  const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => {
      const userId    = req.user ? req.user._id : 'unknown';
      const timestamp = Date.now();
      const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${userId}_${timestamp}_${sanitized}`);
    },
  });

  upload = multer({ storage, fileFilter, limits: fileSizeLimit });
  if (process.env.NODE_ENV !== 'test') {
    console.log('💾 File uploads: Local disk (development)');
  }
}

module.exports = upload;
