// src/pages/Feedback.jsx — v3.0 (dark mode support, same functionality)
import { useState }        from 'react';
import Navbar              from '../components/Navbar.jsx';
import { FooterSimple }    from '../components/Footer.jsx';
import { apiRequest }      from '../services/api.js';

export default function Feedback() {
  const [form,    setForm]    = useState({ fullName:'', email:'', feedbackType:'', message:'' });
  const [status,  setStatus]  = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    const { fullName, email, feedbackType, message } = form;
    if (!fullName || !email || !feedbackType || !message) { setIsError(true); setStatus('❌ Please fill in all fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setIsError(true); setStatus('❌ Please enter a valid email address.'); return; }
    setLoading(true); setIsError(false); setStatus('');
    try {
      await apiRequest('/api/feedback', { method:'POST', body: JSON.stringify({ fullName, email, feedbackType, message }) });
      setIsError(false);
      setStatus('✅ Thank you! Your feedback has been received.');
      setForm({ fullName:'', email:'', feedbackType:'', message:'' });
      setTimeout(() => setStatus(''), 6000);
    } catch (err) {
      setIsError(true);
      setStatus(`❌ ${err.message || 'Failed to submit. Please try again.'}`);
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <section className="fb-hero">
        <div className="pub-container fb-hero-inner">
          <div className="pub-badge"><i className="fas fa-comment-dots" /> Feedback</div>
          <h1>We value your <span className="gradient-text">feedback</span></h1>
          <p>Help us improve TalentTrack with your suggestions, bug reports, and ideas.</p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container fb-grid">
          {/* Left — info */}
          <div className="fb-info">
            <h2>Your voice shapes <span className="gradient-text">TalentTrack</span></h2>
            <p>Every piece of feedback directly influences our roadmap. Whether it's a bug you found, a feature you wish existed, or a career intelligence improvement — we want to hear it.</p>
            {[
              { icon:'fa-bullseye',  color:'#6366f1', title:'Improves AI accuracy',      desc:'Help us fine-tune career intelligence and job matching quality.' },
              { icon:'fa-bug',       color:'#ef4444', title:'Helps fix bugs faster',      desc:'Report issues and we\'ll resolve them for everyone.' },
              { icon:'fa-lightbulb', color:'#f59e0b', title:'Shapes future features',     desc:'Your ideas directly influence what we build next.' },
            ].map(c => (
              <div key={c.title} className="fb-info-card">
                <div className="fb-info-icon" style={{ background: c.color + '15', color: c.color }}><i className={`fas ${c.icon}`} /></div>
                <div><h3>{c.title}</h3><p>{c.desc}</p></div>
              </div>
            ))}
          </div>

          {/* Right — form */}
          <div className="fb-form-card">
            <h3>Share your thoughts</h3>
            <form onSubmit={handleSubmit} noValidate>
              <div className="fb-field">
                <label>Full Name</label>
                <input type="text" name="fullName" placeholder="Your full name" value={form.fullName} onChange={handleChange} disabled={loading} />
              </div>
              <div className="fb-field">
                <label>Email Address</label>
                <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} disabled={loading} />
              </div>
              <div className="fb-field">
                <label>Feedback Type</label>
                <select name="feedbackType" value={form.feedbackType} onChange={handleChange} disabled={loading}>
                  <option value="" disabled>Select type…</option>
                  <option>Suggestion</option>
                  <option>Bug Report</option>
                  <option>Improvement</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="fb-field">
                <label>Message</label>
                <textarea name="message" rows={5} placeholder="Tell us what's on your mind…" value={form.message} onChange={handleChange} disabled={loading} maxLength={2000} />
              </div>
              <button type="submit" className="pub-btn-primary fb-submit-btn" disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-pulse" /> Sending…</> : <><i className="fas fa-paper-plane" /> Send Feedback</>}
              </button>
              {status && <p className="fb-status" style={{ color: isError ? '#ef4444' : '#10b981' }}>{status}</p>}
            </form>
          </div>
        </div>
      </section>

      <FooterSimple text="© 2026 TalentTrack — Built with your feedback in mind." />
    </>
  );
}
