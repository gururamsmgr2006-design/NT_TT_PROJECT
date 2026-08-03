// ============================================================
// controllers/resumeController.js
// Handles file upload + text extraction for resume analysis
// Requires: pdf-parse, mammoth (install via npm)
// ============================================================

const fs             = require('fs');
const path           = require('path');
const ResumeAnalysis = require('../models/ResumeAnalysis');

// ─── Text extraction helpers ──────────────────────────────────

async function extractPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer   = fs.readFileSync(filePath);
    const data     = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    throw new Error('Failed to extract PDF text: ' + err.message);
  }
}

async function extractDOCX(filePath) {
  try {
    const mammoth = require('mammoth');
    const result  = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (err) {
    throw new Error('Failed to extract DOCX text: ' + err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/resume/upload
// Multipart: file field = "resume"
// ─────────────────────────────────────────────────────────────
exports.uploadResume = async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname || 'resume';
    const ext = path.extname(originalName).toLowerCase().replace('.', '');

    let extractedText = '';
    let fileType      = '';

    if (ext === 'pdf') {
      fileType      = 'pdf';
      extractedText = await extractPDF(filePath);
    } else if (ext === 'docx' || ext === 'doc') {
      fileType      = 'docx';
      extractedText = await extractDOCX(filePath);
    } else {
      return res.status(400).json({ success: false, message: 'Only PDF and DOCX files are supported.' });
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract meaningful text from the file. Make sure it is not a scanned image.',
      });
    }

    // Create pending analysis record
    const analysis = await ResumeAnalysis.create({
      user:          req.user._id,
      fileName:      originalName,
      fileType,
      extractedText: extractedText.trim(),
      status:        'pending',
    });

    res.status(201).json({
      success:   true,
      analysisId: analysis._id,
      fileName:  originalName,
      textLength: extractedText.trim().length,
      message:   'Resume uploaded and text extracted. Call /api/ai/resume/analyze to run analysis.',
    });
  } catch (error) {
    next(error);
  } finally {
    // Always clean up uploaded temp file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// GET /api/resume/:id
exports.getAnalysis = async (req, res, next) => {
  try {
    const analysis = await ResumeAnalysis.findOne({
      _id:  req.params.id,
      user: req.user._id,
    }).select('-extractedText');

    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found.' });
    }
    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};
