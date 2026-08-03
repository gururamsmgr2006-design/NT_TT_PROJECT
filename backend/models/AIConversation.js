// ============================================================
// models/AIConversation.js — Chat history storage
// ============================================================

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const AIConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title:    { type: String, default: 'New Conversation', maxlength: 200 },
  messages: { type: [MessageSchema], default: [] },
  context:  { type: String, enum: ['career', 'resume', 'skills', 'interview', 'general'], default: 'general' },
  language: { type: String, default: 'en' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

AIConversationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AIConversation', AIConversationSchema);
