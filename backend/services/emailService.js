// ============================================================
// services/emailService.js — Nodemailer Email Sender
//
// NEW FILE — used by passwordResetController and feedbackController
// Requires: npm install nodemailer
// ============================================================

const nodemailer = require('nodemailer');

// ─── Create transporter ───────────────────────────────────────
const createTransporter = () => {
  // In development, use Ethereal (fake SMTP — no real emails sent)
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.warn('⚠️  EMAIL_USER not set — emails will be logged to console only');
    return null;
  }

  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─── Send email ───────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    // Dev fallback: log to console
    console.log('\n📧 EMAIL (dev mode — not actually sent):');
    console.log('  To:',      to);
    console.log('  Subject:', subject);
    console.log('  Body:',    html.replace(/<[^>]+>/g, '').trim().slice(0, 200));
    console.log('');
    return;
  }

  const mailOptions = {
    from: `"TalentTrack" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
