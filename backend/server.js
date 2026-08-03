// ============================================================
// server.js — TalentTrack Backend Entry Point (UPDATED v2.0)
// Added: /api/ai, /api/resume, /api/profile, /api/analytics,
//        /api/achievements, /api/market routes
// ============================================================

require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const connectDB         = require('./config/db');
const errorHandler      = require('./middleware/errorHandler');
const authRoutes        = require('./routes/authRoutes');
const jobRoutes         = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const userRoutes        = require('./routes/userRoutes');
const aiRoutes          = require('./routes/aiRoutes');
const resumeRoutes      = require('./routes/resumeRoutes');
// ── CIOS NEW ROUTES ───────────────────────────────────────────
const userProfileRoutes  = require('./routes/userProfileRoutes');
const analyticsRoutes    = require('./routes/analyticsRoutes');
const achievementRoutes  = require('./routes/achievementRoutes');
const marketRoutes       = require('./routes/marketRoutes');

connectDB();

const app = express();

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(`✅ ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });

  next();
});

// ─── Security Headers ─────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────
const buildAllowedOrigins = () => {
  const origins = [
    process.env.FRONTEND_URL,
    /\.netlify\.app$/,
  ];
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:3001');
    origins.push('http://localhost:5173');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:5500');
  }
  return origins.filter(Boolean);
};

const allowedOrigins = buildAllowedOrigins();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods:  ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Global Rate Limiter ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', globalLimiter);

// ─── AI Rate Limiter (more lenient for AI endpoints) ──────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max:      parseInt(process.env.AI_RATE_LIMIT_MAX) || 20,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many AI requests. Please wait a moment.' },
});
app.use('/api/ai/', aiLimiter);

// ─── Heavy AI Rate Limiter (expensive CIOS endpoints) ─────────
const heavyAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max:      10,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'This feature is limited to 10 requests per hour.' },
});
app.use('/api/ai/career-twin',   heavyAiLimiter);
app.use('/api/ai/employability', heavyAiLimiter);
app.use('/api/ai/career-escape', heavyAiLimiter);

// ─── Login Rate Limiter ───────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many login attempts. Please try again in 1 hour.' },
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login',  loginLimiter);
app.use('/api/auth/signup', loginLimiter);



// ─── Body Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Logger (dev only) ───────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/jobs',         jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/resume',       resumeRoutes);
// ── CIOS NEW ROUTES ───────────────────────────────────────────
app.use('/api/profile',      userProfileRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/market',       marketRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:    true,
    message:    'TalentTrack AI CIOS is running 🚀',
    env:        process.env.NODE_ENV,
    aiProvider: process.env.AI_PROVIDER || 'gemini',
    version:    '2.0.0',
    timestamp:  new Date(),
  });
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 TalentTrack AI CIOS running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
  console.log(`🧠 CIOS: Digital Twin | Employability | Escape Velocity | Market Intelligence`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health\n`);
});
