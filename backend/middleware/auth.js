// ============================================================
// middleware/auth.js — JWT Authentication & Role Guard
//
// Usage in routes:
//   router.get('/protected', protect, handler)
//   router.post('/recruiter-only', protect, authorize('recruiter'), handler)
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── protect ─────────────────────────────────────────────────
// Verifies the JWT token in the Authorization header.
// Attaches the decoded user to req.user for downstream handlers.
const protect = async (req, res, next) => {
  let token;

  // JWT is expected as: Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
  }

  try {
    // Verify token using our secret; throws if expired or invalid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (ensures user still exists and is active)
    // Note: password is excluded by default (select: false in schema)
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is deactivated.' });
    }

    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ─── authorize ───────────────────────────────────────────────
// Role-based access control. Call after protect.
// Usage: authorize('recruiter') or authorize('recruiter', 'admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
