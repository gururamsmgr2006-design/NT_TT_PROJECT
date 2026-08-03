// src/pages/dashboard/tabs/SkillGap.jsx — Phase 5

import { useState, useEffect } from 'react';
import { apiRequest } from '../../../services/api.js';

const TARGET_ROLES = [
  'Frontend Developer', 'Backend Developer', 'MERN Stack Developer',
  'Full Stack Developer', 'React Developer', 'Node.js Developer',
  'Java Developer', 'Python Developer', 'Data Analyst',
  'Data Scientist', 'Machine Learning Engineer', 'AI Engineer',
  'DevOps Engineer', 'Cloud Engineer', 'Android Developer',
  'iOS Developer', 'UI/UX Designer', 'Product Manager',
  'Business Analyst', 'Cybersecurity Analyst',
];

const LANG_OPTIONS = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },   { code: 'kn', label: 'Kannada' },
  { code: 'te', label: 'Telugu' },
];

const IMPORTANCE_COLORS = {
  critical: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#10b981',
};

export default function SkillGap() {
  const [targetRole,  setTargetRole]  = useState('');
  const [customRole,  setCustomRole]  = useState('');
  const [skillInput,  setSkillInput]  = useState('');
  const [userSkills,  setUserSkills]  = useState([]);
  const [language,    setLanguage]    = useState('en');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [history,     setHistory]     = useState([]);
  const [error,       setError]       = useState('');
  const [tab,         setTab]         = useState('analyze');

  useEffect(() => {
    apiRequest('/api/ai/skill-gap/history')
      .then((r) => setHistory(r.history || []))
      .catch(() => {});
  }, []);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || userSkills.includes(s)) { setSkillInput(''); return; }
    setUserSkills((p) => [...p, s]);
    setSkillInput('');
  };

  const removeSkill = (s) => setUserSkills((p) => p.filter((x) => x !== s));

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
  };

  const analyze = async () => {
    const role = customRole || targetRole;
    if (!role) { setError('Please select or type a target role.'); return; }
    if (userSkills.length === 0) { setError('Please add at least one skill.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/ai/skill-gap', {
        method: 'POST',
        body: JSON.stringify({ targetRole: role, userSkills, language }),
      });
      setResult(res.skillGap);
      setTab('analyze');
      const updated = await apiRequest('/api/ai/skill-gap/history');
      setHistory(updated.history || []);
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = (item) => { setResult(item); setTab('analyze'); };

  return (
    <div className="sg-container">
      <div className="sg-header">
        <h2><i className="fas fa-chart-bar" /> Skill Gap Detector</h2>
        <p>Compare your current skills against what's required for your target role.</p>
      </div>

      <div className="ra-tabs">
        <button className={`ra-tab${tab === 'analyze' ? ' active' : ''}`} onClick={() => setTab('analyze')}>
          <i className="fas fa-search" /> Analyze
        </button>
        <button className={`ra-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
          <i className="fas fa-history" /> History ({history.length})
        </button>
      </div>

      {tab === 'analyze' && (
        <div className="sg-content">
          {/* Input form */}
          {!result && (
            <div className="sg-form">
              {/* Target Role */}
              <div className="sg-field">
                <label>Target Role</label>
                <select value={targetRole} onChange={(e) => { setTargetRole(e.target.value); setCustomRole(''); }}>
                  <option value="">— Select a role —</option>
                  {TARGET_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  <option value="custom">Other (type below)</option>
                </select>
                {(targetRole === 'custom' || !TARGET_ROLES.includes(targetRole)) && (
                  <input
                    type="text"
                    placeholder="Type your target role..."
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>

              {/* Skills input */}
              <div className="sg-field">
                <label>Your Current Skills <span style={{ color: '#6b7280', fontWeight: 400 }}>(press Enter or comma to add)</span></label>
                <div className="sg-skill-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. JavaScript, React, Node.js..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                  />
                  <button className="sg-add-btn" onClick={addSkill}>Add</button>
                </div>
                {userSkills.length > 0 && (
                  <div className="sg-skills-tags">
                    {userSkills.map((s) => (
                      <span key={s} className="sg-skill-tag">
                        {s} <button onClick={() => removeSkill(s)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Language */}
              <div className="sg-field">
                <label>Response Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>

              {error && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              <button className="ra-analyze-btn" onClick={analyze} disabled={loading}>
                {loading
                  ? <><i className="fas fa-spinner fa-pulse" /> Analyzing Skills…</>
                  : <><i className="fas fa-search" /> Detect Skill Gap</>}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="sg-results">
              <div className="sg-results-top">
                <div>
                  <h3>Skill Gap: {result.targetRole}</h3>
                  <p style={{ color: '#6b7280' }}>{result.summary}</p>
                </div>
                <button className="ra-new-btn" onClick={() => setResult(null)}>
                  <i className="fas fa-plus" /> New Analysis
                </button>
              </div>

              {/* Match percentage */}
              <div className="sg-match-bar-wrap">
                <div className="sg-match-label">
                  Match: <strong>{result.matchPercentage}%</strong>
                </div>
                <div className="sg-match-track">
                  <div
                    className="sg-match-fill"
                    style={{
                      width: `${result.matchPercentage}%`,
                      background: result.matchPercentage >= 70 ? '#10b981' : result.matchPercentage >= 40 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>

              {/* Present vs Missing */}
              <div className="ra-grid-2">
                <div className="ra-section">
                  <h4><i className="fas fa-check-circle" style={{ color: '#10b981' }} /> Skills You Have</h4>
                  <div className="tag-list">
                    {(result.presentSkills || []).map((s, i) => (
                      <span key={i} className="analysis-tag" style={{ borderColor: '#10b981', color: '#10b981' }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="ra-section">
                  <h4><i className="fas fa-times-circle" style={{ color: '#ef4444' }} /> Missing Skills</h4>
                  {(result.missingSkills || []).map((s, i) => (
                    <div key={i} className="sg-missing-skill">
                      <div className="sg-missing-name">
                        <span
                          className="sg-importance-badge"
                          style={{ background: IMPORTANCE_COLORS[s.importance] + '20', color: IMPORTANCE_COLORS[s.importance] }}
                        >
                          {s.importance}
                        </span>
                        {s.skill}
                      </div>
                      {s.estimatedHours && (
                        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>~{s.estimatedHours}h to learn</div>
                      )}
                      {s.resources?.length > 0 && (
                        <div className="sg-resources">
                          {s.resources.slice(0, 2).map((r, ri) => (
                            <span key={ri} className="sg-resource">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Path */}
              {result.learningPath?.length > 0 && (
                <div className="ra-section">
                  <h4><i className="fas fa-road" style={{ color: '#6366f1' }} /> Recommended Learning Path</h4>
                  <div className="sg-learning-path">
                    {result.learningPath.map((phase, i) => (
                      <div key={i} className="sg-phase">
                        <div className="sg-phase-header">
                          <span className="sg-phase-num">Phase {phase.phase}</span>
                          <strong>{phase.title}</strong>
                          <span className="sg-phase-duration">{phase.duration}</span>
                        </div>
                        <div className="sg-phase-skills">
                          {(phase.skills || []).map((s, si) => (
                            <span key={si} className="sg-phase-skill">{s}</span>
                          ))}
                        </div>
                        {phase.resources?.length > 0 && (
                          <div className="sg-phase-resources">
                            {phase.resources.map((r, ri) => <span key={ri} className="sg-resource">{r}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="ra-history">
          {history.length === 0 ? (
            <div className="empty-state"><i className="fas fa-chart-bar" /><p>No analyses yet.</p></div>
          ) : history.map((item) => (
            <div key={item._id} className="ra-history-card" onClick={() => loadHistory(item)}>
              <div className="ra-history-info">
                <strong>{item.targetRole}</strong>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="ra-history-scores">
                <span className="score-badge" style={{ background: '#6366f120', color: '#6366f1' }}>
                  Match: {item.matchPercentage}%
                </span>
                <span className="score-badge" style={{ background: '#ef444420', color: '#ef4444' }}>
                  Missing: {item.missingSkills?.length || 0} skills
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
