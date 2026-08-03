// src/pages/dashboard/tabs/CareerRoadmap.jsx — Phase 6

import { useState, useEffect } from 'react';
import { apiRequest } from '../../../services/api.js';

const CAREER_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'MERN Stack Developer', 'React Developer', 'Node.js Developer',
  'Java Developer', 'Python Developer', 'Data Scientist',
  'Machine Learning Engineer', 'AI/ML Engineer', 'Data Analyst',
  'DevOps Engineer', 'Cloud Architect', 'Cybersecurity Engineer',
  'Android Developer', 'iOS Developer', 'Flutter Developer',
  'UI/UX Designer', 'Product Manager', 'Business Analyst',
  'QA Engineer', 'Blockchain Developer', 'Game Developer',
];

const EXP_LEVELS = ['Fresher (0 years)', '1-2 years', '2-4 years', '4-7 years', '7+ years'];

const LANG_OPTIONS = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },   { code: 'kn', label: 'Kannada' },
  { code: 'te', label: 'Telugu' },
];

const PHASE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CareerRoadmap() {
  const [form, setForm]       = useState({
    targetCareer: '', customCareer: '', currentSkills: '',
    education: '', experience: 'Fresher (0 years)', language: 'en',
  });
  const [loading,  setLoading]  = useState(false);
  const [roadmap,  setRoadmap]  = useState(null);
  const [history,  setHistory]  = useState([]);
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState('generate');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    apiRequest('/api/ai/roadmap/history')
      .then((r) => setHistory(r.history || []))
      .catch(() => {});
  }, []);

  const updateForm = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    const career = form.customCareer || form.targetCareer;
    if (!career) { setError('Please select or enter a target career.'); return; }
    setError('');
    setLoading(true);
    try {
      const skills = form.currentSkills
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await apiRequest('/api/ai/roadmap', {
        method: 'POST',
        body: JSON.stringify({
          targetCareer: career,
          currentSkills: skills,
          education: form.education || 'Not specified',
          experience: form.experience,
          language: form.language,
        }),
      });
      setRoadmap(res.roadmap);
      const updated = await apiRequest('/api/ai/roadmap/history');
      setHistory(updated.history || []);
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap.');
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (i) => setExpanded((p) => ({ ...p, [i]: !p[i] }));

  return (
    <div className="rm-container">
      <div className="sg-header">
        <h2><i className="fas fa-road" /> Career Roadmap Generator</h2>
        <p>Get a personalized AI-powered career plan with skills, certifications, projects, and timelines.</p>
      </div>

      <div className="ra-tabs">
        <button className={`ra-tab${tab === 'generate' ? ' active' : ''}`} onClick={() => setTab('generate')}>
          <i className="fas fa-magic" /> Generate
        </button>
        <button className={`ra-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
          <i className="fas fa-history" /> My Roadmaps ({history.length})
        </button>
      </div>

      {tab === 'generate' && (
        <div className="sg-content">
          {!roadmap ? (
            <div className="sg-form">
              <div className="rm-form-grid">
                <div className="sg-field">
                  <label>Target Career</label>
                  <select value={form.targetCareer} onChange={(e) => { updateForm('targetCareer', e.target.value); updateForm('customCareer', ''); }}>
                    <option value="">— Select a career path —</option>
                    {CAREER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="custom">Other (type below)</option>
                  </select>
                  {(form.targetCareer === 'custom' || !CAREER_OPTIONS.includes(form.targetCareer)) && (
                    <input type="text" placeholder="Type your career goal…" value={form.customCareer}
                      onChange={(e) => updateForm('customCareer', e.target.value)} style={{ marginTop: '0.5rem' }} />
                  )}
                </div>

                <div className="sg-field">
                  <label>Experience Level</label>
                  <select value={form.experience} onChange={(e) => updateForm('experience', e.target.value)}>
                    {EXP_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div className="sg-field">
                  <label>Education</label>
                  <input type="text" placeholder="e.g. B.Tech CSE, BCA, 12th Science…"
                    value={form.education} onChange={(e) => updateForm('education', e.target.value)} />
                </div>

                <div className="sg-field">
                  <label>Response Language</label>
                  <select value={form.language} onChange={(e) => updateForm('language', e.target.value)}>
                    {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="sg-field">
                <label>Current Skills <span style={{ color: '#6b7280', fontWeight: 400 }}>(comma or newline separated)</span></label>
                <textarea rows={3} placeholder="e.g. HTML, CSS, JavaScript, Python…"
                  value={form.currentSkills} onChange={(e) => updateForm('currentSkills', e.target.value)} />
              </div>

              {error && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              <button className="ra-analyze-btn" onClick={generate} disabled={loading}>
                {loading
                  ? <><i className="fas fa-spinner fa-pulse" /> Generating Roadmap…</>
                  : <><i className="fas fa-road" /> Generate My Roadmap</>}
              </button>
            </div>
          ) : (
            <div className="rm-results">
              <div className="sg-results-top">
                <div>
                  <h3>🎯 Roadmap: {roadmap.targetCareer}</h3>
                  <p style={{ color: '#6b7280' }}>{roadmap.summary}</p>
                </div>
                <button className="ra-new-btn" onClick={() => setRoadmap(null)}>
                  <i className="fas fa-plus" /> New Roadmap
                </button>
              </div>

              {/* Meta info */}
              <div className="rm-meta">
                {roadmap.totalDuration && (
                  <div className="rm-meta-item">
                    <i className="fas fa-clock" /> <strong>Duration:</strong> {roadmap.totalDuration}
                  </div>
                )}
                {roadmap.salaryRange && (
                  <div className="rm-meta-item">
                    <i className="fas fa-rupee-sign" /> <strong>Salary Range:</strong> {roadmap.salaryRange}
                  </div>
                )}
                {roadmap.jobOutlook && (
                  <div className="rm-meta-item">
                    <i className="fas fa-chart-line" /> <strong>Job Outlook:</strong> {roadmap.jobOutlook}
                  </div>
                )}
              </div>

              {/* Phases */}
              <div className="rm-phases">
                {(roadmap.phases || []).map((phase, i) => (
                  <div key={i} className="rm-phase" style={{ borderLeft: `4px solid ${PHASE_COLORS[i % PHASE_COLORS.length]}` }}>
                    <div className="rm-phase-header" onClick={() => togglePhase(i)}>
                      <div className="rm-phase-title">
                        <span className="rm-phase-num" style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }}>
                          {phase.phase}
                        </span>
                        <div>
                          <strong>{phase.title}</strong>
                          <span className="rm-phase-dur">{phase.duration}</span>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${expanded[i] ? 'up' : 'down'}`} style={{ color: '#6b7280' }} />
                    </div>

                    {expanded[i] && (
                      <div className="rm-phase-body">
                        {phase.skills?.length > 0 && (
                          <div className="rm-phase-section">
                            <p className="rm-phase-section-title"><i className="fas fa-code" /> Skills to Learn</p>
                            <div className="tag-list">
                              {phase.skills.map((s, si) => <span key={si} className="sg-phase-skill">{s}</span>)}
                            </div>
                          </div>
                        )}
                        {phase.certifications?.length > 0 && (
                          <div className="rm-phase-section">
                            <p className="rm-phase-section-title"><i className="fas fa-certificate" /> Certifications</p>
                            <ul>{phase.certifications.map((c, ci) => <li key={ci}>{c}</li>)}</ul>
                          </div>
                        )}
                        {phase.projects?.length > 0 && (
                          <div className="rm-phase-section">
                            <p className="rm-phase-section-title"><i className="fas fa-laptop-code" /> Projects to Build</p>
                            <ul>{phase.projects.map((p, pi) => <li key={pi}>{p}</li>)}</ul>
                          </div>
                        )}
                        {phase.resources?.length > 0 && (
                          <div className="rm-phase-section">
                            <p className="rm-phase-section-title"><i className="fas fa-book" /> Resources</p>
                            <ul>{phase.resources.map((r, ri) => <li key={ri}>{r}</li>)}</ul>
                          </div>
                        )}
                        {phase.milestones?.length > 0 && (
                          <div className="rm-phase-section">
                            <p className="rm-phase-section-title"><i className="fas fa-flag-checkered" /> Milestones</p>
                            <ul>{phase.milestones.map((m, mi) => <li key={mi}>{m}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Interview Prep */}
              {roadmap.interviewPrep?.length > 0 && (
                <div className="ra-section">
                  <h4><i className="fas fa-comments" style={{ color: '#6366f1' }} /> Interview Preparation</h4>
                  <ul>{roadmap.interviewPrep.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="ra-history">
          {history.length === 0 ? (
            <div className="empty-state"><i className="fas fa-road" /><p>No roadmaps generated yet.</p></div>
          ) : history.map((item) => (
            <div key={item._id} className="ra-history-card" onClick={() => { setRoadmap(item); setTab('generate'); }}>
              <div className="ra-history-info">
                <strong>{item.targetCareer}</strong>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="ra-history-scores">
                <span className="score-badge" style={{ background: '#6366f120', color: '#6366f1' }}>
                  {item.phases?.length || 0} phases
                </span>
                <span className="score-badge" style={{ background: '#10b98120', color: '#10b981' }}>
                  {item.totalDuration}
                </span>
              </div>
              <button className="ra-view-btn"><i className="fas fa-eye" /> View</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
