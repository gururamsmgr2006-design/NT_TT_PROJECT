// src/pages/dashboard/AdminDashboard.jsx
// NEW FILE — Admin dashboard that receives feedback from the Help → Feedback form.
// Reuses the existing "rdb-*" classes from global.css, so the UI matches the Recruiter dashboard.
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { FeedbackService } from '../../services/services.js';
import { useToast } from '../../hooks/useToast.js';

const TYPES = ['Suggestion', 'Bug Report', 'Improvement', 'Other'];
const TYPE_COLOR = {
  'Suggestion':  { bg:'#dbeafe', fg:'#2563eb' },
  'Bug Report':  { bg:'#fee2e2', fg:'#dc2626' },
  'Improvement': { bg:'#ede9fe', fg:'#7c3aed' },
  'Other':       { bg:'#e2e8f0', fg:'#475569' },
};

// Backend stores messages HTML-escaped (validator.escape) — decode for display.
// React still escapes it again when rendering, so this is safe.
const decode = (s = '') => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/').replace(/&#x5C;/g, '\\')
  .replace(/&#96;/g, '`').replace(/&amp;/g, '&');

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [dark, setDark]       = useState(() => localStorage.getItem('rdb_dark') === 'true');
  const [list, setList]       = useState([]);
  const [stats, setStats]     = useState({ total:0, unresolved:0, resolved:0, bugs:0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [type, setType]       = useState('');
  const [status, setStatus]   = useState('');   // '' | 'open' | 'resolved'
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    localStorage.setItem('rdb_dark', dark);
    document.documentElement.setAttribute('data-rdb-dark', dark ? 'true' : 'false');
  }, [dark]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (type)   params.set('type', type);
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await FeedbackService.getAll(params.toString());
      setList(res.feedback || []);
      setTotalPages(res.totalPages || 1);
      if (res.stats) setStats(res.stats);
    } catch (e) { setError(e.message || 'Failed to load feedback.'); }
    finally { setLoading(false); }
  }, [page, type, status, search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const toggleResolved = async (f) => {
    try {
      await FeedbackService.setResolved(f._id, !f.resolved);
      showToast(f.resolved ? 'Marked as open' : '✅ Marked as resolved');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const remove = async (f) => {
    if (!window.confirm('Delete this feedback permanently?')) return;
    try { await FeedbackService.remove(f._id); showToast('🗑️ Feedback deleted'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const CARDS = [
    { label:'Total Feedback', val:stats.total,      icon:'fa-comment-dots',        cls:'blue' },
    { label:'Unresolved',     val:stats.unresolved, icon:'fa-inbox',               cls:'amber' },
    { label:'Resolved',       val:stats.resolved,   icon:'fa-check-circle',        cls:'green' },
    { label:'Bug Reports',    val:stats.bugs,       icon:'fa-bug',                 cls:'purple' },
  ];

  return (
    <div className={`rdb-body${dark ? ' dark' : ''}`}>
      <nav className="rdb-navbar">
        <div className="rdb-logo">TalentTrack Admin</div>
        <ul className="rdb-nav-links" />
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
          <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--muted)' }}>{user?.fullName?.split(' ')[0]}</span>
          <button className="rdb-btn rdb-btn-ghost rdb-btn-sm" onClick={() => setDark(d => !d)}>
            <i className={`fas ${dark ? 'fa-sun' : 'fa-moon'}`} />
          </button>
          <button className="rdb-btn rdb-btn-danger rdb-btn-sm" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </nav>

      <div className="rdb-wrapper">
        <aside className="rdb-sidebar">
          <ul className="rdb-sidebar-nav">
            <li className="rdb-sidebar-label">Menu</li>
            <li><a className="active"><i className="fas fa-comment-dots" /> Feedback</a></li>
            <li className="rdb-sidebar-label" style={{ marginTop:'1rem' }}>Quick Links</li>
            <li><Link to="/" style={{ display:'flex', alignItems:'center', gap:10, padding:'0.65rem 0.75rem', borderRadius:10, textDecoration:'none', color:'var(--muted)', fontSize:'0.875rem', fontWeight:500 }}>
              <i className="fas fa-globe" /> Home Page
            </Link></li>
          </ul>
        </aside>

        <main className="rdb-main">
          <div className="rdb-page-header">
            <div><h2>User Feedback</h2><p>Feedback submitted from the Help → Feedback form.</p></div>
            <button className="rdb-btn rdb-btn-ghost" onClick={load}><i className="fas fa-rotate" /> Refresh</button>
          </div>

          <div className="rdb-cards-grid">
            {CARDS.map(c => (
              <div className="rdb-stat-card" key={c.label}>
                <div className={`rdb-stat-icon ${c.cls}`}><i className={`fas ${c.icon}`} /></div>
                <div className="rdb-stat-info"><h3>{c.val}</h3><p>{c.label}</p></div>
              </div>
            ))}
          </div>

          <div className="rdb-panel">
            <div className="rdb-filter-row">
              <input placeholder="Search name, email or message…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} />
              <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
                <option value="">All types</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All status</option>
                <option value="open">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {loading ? (
              <div className="rdb-empty"><i className="fas fa-spinner fa-spin" /><h4>Loading feedback…</h4></div>
            ) : error ? (
              <div className="rdb-empty"><i className="fas fa-triangle-exclamation" /><h4>{error}</h4></div>
            ) : list.length === 0 ? (
              <div className="rdb-empty"><i className="fas fa-inbox" /><h4>No feedback found</h4></div>
            ) : list.map(f => {
              const c = TYPE_COLOR[f.feedbackType] || TYPE_COLOR.Other;
              return (
                <div className="rdb-applicant-card" key={f._id} style={{ opacity: f.resolved ? 0.65 : 1 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="rdb-applicant-name">
                      {decode(f.fullName)}{' '}
                      <span style={{ background:c.bg, color:c.fg, fontSize:'0.72rem', fontWeight:700, padding:'2px 10px', borderRadius:20, marginLeft:6 }}>
                        {f.feedbackType}
                      </span>
                      {f.resolved && <span style={{ background:'#d1fae5', color:'#059669', fontSize:'0.72rem', fontWeight:700, padding:'2px 10px', borderRadius:20, marginLeft:6 }}>Resolved</span>}
                    </div>
                    <div className="rdb-applicant-meta">
                      <span><i className="fas fa-envelope" /> <a href={`mailto:${f.email}`}>{f.email}</a></span>{' · '}
                      <span><i className="fas fa-clock" /> {new Date(f.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ marginTop:8, fontSize:'0.9rem', lineHeight:1.55, whiteSpace:'pre-wrap', wordBreak:'break-word', color:'var(--text)' }}>
                      {decode(f.message)}
                    </p>
                  </div>
                  <div className="rdb-applicant-actions" style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <button className="rdb-btn rdb-btn-ghost rdb-btn-sm" onClick={() => toggleResolved(f)}>
                      <i className={`fas ${f.resolved ? 'fa-rotate-left' : 'fa-check'}`} /> {f.resolved ? 'Reopen' : 'Resolve'}
                    </button>
                    <button className="rdb-btn rdb-btn-danger rdb-btn-sm" onClick={() => remove(f)}>
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, padding:'1rem' }}>
                <button className="rdb-btn rdb-btn-ghost rdb-btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ fontSize:'0.85rem', color:'var(--muted)' }}>Page {page} of {totalPages}</span>
                <button className="rdb-btn rdb-btn-ghost rdb-btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </main>
      </div>

      {toast && <div className={`rdb-toast${toast.type === 'error' ? ' error' : ''}`}>{toast.message}</div>}
    </div>
  );
}
