// src/components/AIChatbot.jsx — Real AI Chatbot (Phase 2)
// Replaces the old keyword-based Chatbot.jsx

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

const QUICK_QUESTIONS = [
  'How do I improve my resume?',
  'Tips for job interviews',
  'What skills are in demand?',
  'How to negotiate salary?',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
];

export default function AIChatbot() {
  const { isLoggedIn } = useAuth();
  const [open, setOpen]               = useState(false);
  const [input, setInput]             = useState('');
  const [messages, setMessages]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [conversationId, setConvId]   = useState(null);
  const [language, setLanguage]       = useState('en');
  const [showLang, setShowLang]       = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "👋 Hi! I'm TalentTrack's AI Career Assistant. I can help you with job search, resume tips, interview prep, and career advice. What would you like to know?",
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    if (!isLoggedIn) {
      setTimeout(() => {
        setMessages((m) => [...m, {
          role: 'assistant',
          content: '🔒 Please [sign up](/signup) or [log in](/login) to use the full AI assistant. You\'ll get unlimited career guidance, resume analysis, and more!',
        }]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const res = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg, conversationId, context: 'career', language }),
      });
      setConvId(res.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: '⚠️ Sorry, I ran into an issue. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConvId(null);
    setTimeout(() => {
      setMessages([{
        role: 'assistant',
        content: "👋 Starting a new conversation! What can I help you with?",
      }]);
    }, 100);
  };

  return (
    <div className="chatbot-container">
      {/* Floating button */}
      <button className="chatbot-icon" onClick={() => setOpen((p) => !p)} aria-label="Open AI Chat">
        {open ? <i className="fas fa-times" /> : <i className="fas fa-robot" />}
        {!open && <span className="chat-pulse" />}
      </button>

      {/* Chat window */}
      <div className={`chat-window${open ? ' open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar"><i className="fas fa-robot" /></div>
            <div>
              <div className="chat-title">CareerGuide AI</div>
              <div className="chat-subtitle">{loading ? 'Thinking…' : 'Online · Powered by AI'}</div>
            </div>
          </div>
          <div className="chat-header-actions">
            {/* Language selector */}
            <div style={{ position: 'relative' }}>
              <button className="chat-action-btn" onClick={() => setShowLang((p) => !p)} title="Language">
                🌐
              </button>
              {showLang && (
                <div className="lang-dropdown">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      className={`lang-option${language === l.code ? ' active' : ''}`}
                      onClick={() => { setLanguage(l.code); setShowLang(false); }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="chat-action-btn" onClick={clearChat} title="New chat">
              <i className="fas fa-plus" />
            </button>
            <button className="chat-action-btn" onClick={() => setOpen(false)} title="Close">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role === 'user' ? 'user-msg' : 'bot-msg'}`}>
              {m.role === 'assistant' && (
                <div className="msg-avatar"><i className="fas fa-robot" /></div>
              )}
              <div className="msg-bubble">
                {m.content.split('\n').map((line, li) => (
                  <p key={li} style={{ margin: li === 0 ? 0 : '0.25rem 0 0' }}>{line}</p>
                ))}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="chat-msg bot-msg">
              <div className="msg-avatar"><i className="fas fa-robot" /></div>
              <div className="msg-bubble typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick questions (shown when no conversation) */}
        {messages.length <= 1 && !loading && (
          <div className="quick-questions">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} className="quick-btn" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask me anything about your career..."
            disabled={loading}
          />
          <button
            className={`send-btn${loading || !input.trim() ? ' disabled' : ''}`}
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            <i className={loading ? 'fas fa-spinner fa-pulse' : 'fas fa-paper-plane'} />
          </button>
        </div>
      </div>
    </div>
  );
}
