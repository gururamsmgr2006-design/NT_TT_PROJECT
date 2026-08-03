// src/pages/dashboard/tabs/AIAssistant.jsx — Phase 3

import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../../../services/api.js';

const CONTEXTS = [
  { id: 'career',    label: 'Career',    icon: 'fa-briefcase' },
  { id: 'resume',    label: 'Resume',    icon: 'fa-file-alt' },
  { id: 'interview', label: 'Interview', icon: 'fa-comments' },
  { id: 'skills',    label: 'Skills',    icon: 'fa-code' },
  { id: 'general',   label: 'General',   icon: 'fa-robot' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'kn', label: 'Kannada' },
  { code: 'te', label: 'Telugu' },
];

const STARTERS = {
  career:    ['How do I switch careers to tech?', 'What are the highest-paying careers in India?', 'How to get a job at a top company?'],
  resume:    ['Review my resume format', 'How to write a strong summary section?', 'What keywords should I add?'],
  interview: ['Top 10 interview questions', 'How to answer "Tell me about yourself"?', 'STAR method examples'],
  skills:    ['What skills should I learn for data science?', 'Best free resources to learn React?', 'How long to become job-ready in Python?'],
  general:   ['How to network effectively?', 'LinkedIn profile tips', 'Should I apply to startups or big companies?'],
};

export default function AIAssistant() {
  const [context,        setContext]        = useState('career');
  const [language,       setLanguage]       = useState('en');
  const [conversations,  setConversations]  = useState([]);
  const [activeConvId,   setActiveConvId]   = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load conversation history
  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('/api/ai/conversations');
        setConversations(res.conversations || []);
      } catch { /* ignore */ }
      finally { setLoadingHistory(false); }
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([{
      role: 'assistant',
      content: `👋 Hi! I'm your AI Career Assistant. I'm in **${context}** mode. Ask me anything!`,
    }]);
  };

  const loadConversation = async (convId) => {
    try {
      const res = await apiRequest(`/api/ai/conversations/${convId}`);
      setMessages(res.conversation.messages);
      setActiveConvId(convId);
      setContext(res.conversation.context);
      setLanguage(res.conversation.language);
    } catch {}
  };

  const deleteConversation = async (convId, e) => {
    e.stopPropagation();
    await apiRequest(`/api/ai/conversations/${convId}`, { method: 'DELETE' }).catch(() => {});
    setConversations((c) => c.filter((cv) => cv._id !== convId));
    if (activeConvId === convId) startNewChat();
  };

  useEffect(() => {
    if (messages.length === 0) startNewChat();
  }, [context]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: msg,
          conversationId: activeConvId,
          context,
          language,
        }),
      });
      setActiveConvId(res.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      // Refresh conversation list
      const updated = await apiRequest('/api/ai/conversations');
      setConversations(updated.conversations || []);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant-layout">
      {/* Sidebar — history */}
      <aside className="ai-sidebar">
        <button className="ai-new-chat-btn" onClick={startNewChat}>
          <i className="fas fa-plus" /> New Conversation
        </button>

        <div className="ai-context-selector">
          <div className="ai-sidebar-label">Mode</div>
          {CONTEXTS.map((c) => (
            <button
              key={c.id}
              className={`ai-context-btn${context === c.id ? ' active' : ''}`}
              onClick={() => setContext(c.id)}
            >
              <i className={`fas ${c.icon}`} /> {c.label}
            </button>
          ))}
        </div>

        <div className="ai-lang-selector">
          <div className="ai-sidebar-label">Language</div>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ai-lang-select">
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        <div className="ai-history">
          <div className="ai-sidebar-label">History</div>
          {loadingHistory ? (
            <div className="ai-history-loading"><i className="fas fa-spinner fa-pulse" /></div>
          ) : conversations.length === 0 ? (
            <p className="ai-history-empty">No conversations yet</p>
          ) : conversations.map((c) => (
            <div
              key={c._id}
              className={`ai-history-item${activeConvId === c._id ? ' active' : ''}`}
              onClick={() => loadConversation(c._id)}
            >
              <span className="ai-history-title">{c.title}</span>
              <button className="ai-history-delete" onClick={(e) => deleteConversation(c._id, e)}>
                <i className="fas fa-trash" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat panel */}
      <div className="ai-chat-panel">
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <i className={`fas ${CONTEXTS.find((c) => c.id === context)?.icon || 'fa-robot'}`} />
            AI {CONTEXTS.find((c) => c.id === context)?.label} Assistant
          </div>
          <div className="ai-chat-lang">{LANGUAGES.find((l) => l.code === language)?.label}</div>
        </div>

        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role === 'user' ? 'ai-user' : 'ai-bot'}`}>
              {m.role === 'assistant' && (
                <div className="ai-msg-avatar"><i className="fas fa-robot" /></div>
              )}
              <div className="ai-msg-bubble">
                {m.content.split('\n').map((line, li) => {
                  // Basic markdown: **bold**, bullet lines
                  const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return <p key={li} dangerouslySetInnerHTML={{ __html: bold }} style={{ margin: li === 0 ? 0 : '0.25rem 0 0' }} />;
                })}
              </div>
              {m.role === 'user' && (
                <div className="ai-msg-avatar user-avatar"><i className="fas fa-user" /></div>
              )}
            </div>
          ))}

          {loading && (
            <div className="ai-msg ai-bot">
              <div className="ai-msg-avatar"><i className="fas fa-robot" /></div>
              <div className="ai-msg-bubble typing-indicator"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick starters */}
        {messages.length <= 1 && (
          <div className="ai-starters">
            {(STARTERS[context] || STARTERS.general).map((q) => (
              <button key={q} className="ai-starter-btn" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}

        <div className="ai-input-row">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={`Ask your ${context} question… (Enter to send, Shift+Enter for new line)`}
            rows={2}
            disabled={loading}
          />
          <button
            className={`ai-send-btn${loading || !input.trim() ? ' disabled' : ''}`}
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
