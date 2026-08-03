// src/pages/dashboard/tabs/SmartJobMatches.jsx — Explainable AI Job Matching
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIService } from '../../../services/api.js';

function MatchGauge({ pct }) {
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#6366f1' : pct >= 30 ? '#f59e0b' : '#ef4444';
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div className="sjm-gauge">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{pct}%</text>
      </svg>
      <span className="sjm-gauge-label" style={{ color }}>Match</span>
    </div>
  );
}

const DEMAND_COLOR = { High:'#10b981', Medium:'#f59e0b', Low:'#ef4444' };

export default function SmartJobMatches() {
  const [recs,       setRecs]       = useState([]);
  const [genAt,      setGenAt]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [expanded,   setExpanded]   = useState(null);
  const [showWhy,    setShowWhy]    = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadRecs(); }, []);

  const loadRecs = async () => {
    setLoading(true);
    try {
      const res = await AIService.getRecommendations();
      setRecs(res.recommendations || []);
      setGenAt(res.generatedAt);
    } catch {} finally { setLoading(false); }
  };

  const generateNew = async () => {
    setGenerating(true); setError('');
    try {
      const res = await AIService.generateRecommendations({});
      setRecs(res.recommendations || []);
      setGenAt(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Failed to generate matches. Complete a Resume Analysis or Skill Gap first.');
    } finally { setGenerating(false); }
  };

  const TYPE_LABELS = { fulltime:'Full-time', parttime:'Part-time', internship:'Internship', contract:'Contract', remote:'Remote' };

  return (
    <div className="sjm-container">
      <div className="sg-header">
        <h2><i className="fas fa-magic" /> Smart Job Matches</h2>
        <p>Explainable AI matching — every recommendation shows exactly why it fits you, based on jobs available in TalentTrack.</p>
      </div>

      <div className="sjm-toolbar">
        <button className="ra-analyze-btn" style={{ width:'auto' }} onClick={generateNew} disabled={generating}>
          {generating ? <><i className="fas fa-spinner fa-pulse" /> Finding Matches…</> : <><i className="fas fa-magic" /> Generate Smart Matches</>}
        </button>
        <div className="sjm-toolbar-right">
          {genAt && <span className="jr-updated"><i className="fas fa-clock" /> Last updated: {new Date(genAt).toLocaleString('en-IN')}</span>}
          <button className="ra-new-btn" onClick={loadRecs} disabled={loading}><i className="fas fa-sync-alt" /></button>
        </div>
      </div>

      {error && (
        <div className="ra-error" style={{ marginBottom:'1rem' }}>
          <i className="fas fa-exclamation-circle" /> {error}
          <p style={{ margin:'0.5rem 0 0', fontSize:'0.85rem' }}>Tip: Run a <strong>Resume Analysis</strong> or <strong>Skill Gap</strong> inside Resume Intelligence first.</p>
        </div>
      )}

      {/* Explainability banner */}
      <div className="sjm-xai-banner">
        <i className="fas fa-shield-alt" style={{ color:'#6366f1' }} />
        <span><strong>Transparent AI:</strong> Every match score is explained with specific reasons. No black boxes.</span>
      </div>

      {loading ? (
        <div className="jr-loading">
          {[...Array(3)].map((_,i) => <div key={i} className="jr-card skeleton"><div className="sk-line sk-title" /><div className="sk-line sk-medium" /></div>)}
        </div>
      ) : recs.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-magic" />
          <p>No job matches yet. Click <strong>Generate Smart Matches</strong> to see AI-ranked jobs from TalentTrack.</p>
          <p style={{ fontSize:'0.85rem', color:'#9ca3af' }}>Complete Resume Intelligence first for best results.</p>
        </div>
      ) : (
        <div className="sjm-list">
          {recs.map((rec, i) => {
            const job = rec.job || {};
            const isExp = expanded === i;
            const showWhyNot = showWhy === i;
            return (
              <div key={i} className={`sjm-card${isExp ? ' expanded' : ''}`}>
                {rec.matchPercentage >= 75 && <div className="sjm-top-badge">⭐ Top Match</div>}

                <div className="sjm-card-top">
                  <div className="sjm-job-info">
                    <h3 className="sjm-job-title">{job.title || 'Untitled'}</h3>
                    <p className="sjm-job-company"><i className="fas fa-building" /> {job.company || 'Unknown'}</p>
                    <div className="sjm-job-meta">
                      <span><i className="fas fa-map-marker-alt" /> {job.location || 'N/A'}</span>
                      <span><i className="fas fa-briefcase" /> {TYPE_LABELS[job.jobType] || job.jobType}</span>
                      {job.salaryDisplay && job.salaryDisplay !== 'Not specified' && <span><i className="fas fa-rupee-sign" /> {job.salaryDisplay}</span>}
                      {rec.demandLevel && <span className="sjm-demand" style={{ color: DEMAND_COLOR[rec.demandLevel] || '#6b7280' }}>● {rec.demandLevel} Demand</span>}
                    </div>
                  </div>
                  <MatchGauge pct={rec.matchPercentage || 0} />
                </div>

                {/* Match reasons */}
                <div className="sjm-reasons">
                  {(rec.matchReasons || []).map((r, ri) => (
                    <span key={ri} className="sjm-reason"><i className="fas fa-check" style={{ color:'#10b981' }} /> {r}</span>
                  ))}
                </div>

                {isExp && (
                  <div className="sjm-expanded">
                    {rec.missingSkills?.length > 0 && (
                      <div className="sjm-missing">
                        <p className="sjm-exp-label"><i className="fas fa-tools" style={{ color:'#f59e0b' }} /> Skills to improve your chances:</p>
                        <div className="tag-list">{rec.missingSkills.map((s,si) => <span key={si} className="analysis-tag" style={{ borderColor:'#f59e0b', color:'#f59e0b' }}>{s}</span>)}</div>
                      </div>
                    )}
                    {rec.salaryPotential && (
                      <div className="sjm-exp-row"><i className="fas fa-rupee-sign" style={{ color:'#10b981' }} /> <strong>Salary Potential:</strong> {rec.salaryPotential}</div>
                    )}
                    {rec.careerGrowthPotential && (
                      <div className="sjm-exp-row"><i className="fas fa-chart-line" style={{ color:'#6366f1' }} /> <strong>Career Growth:</strong> {rec.careerGrowthPotential}</div>
                    )}
                    {rec.applicationTip && (
                      <div className="sjm-tip"><i className="fas fa-lightbulb" style={{ color:'#f59e0b' }} /> <strong>Application Tip:</strong> {rec.applicationTip}</div>
                    )}
                    {rec.whyNotTopMatch && rec.matchPercentage < 75 && (
                      <div className="sjm-why-not">
                        <button className="sjm-why-btn" onClick={() => setShowWhy(showWhyNot ? null : i)}>
                          <i className="fas fa-question-circle" /> {showWhyNot ? 'Hide' : 'Why not a top match?'}
                        </button>
                        {showWhyNot && <p className="sjm-why-text">{rec.whyNotTopMatch}</p>}
                      </div>
                    )}
                  </div>
                )}

                <div className="sjm-card-actions">
                  <button className="sjm-expand-btn" onClick={() => setExpanded(isExp ? null : i)}>
                    {isExp ? 'Show less' : 'See full analysis'} <i className={`fas fa-chevron-${isExp?'up':'down'}`} />
                  </button>
                  <button className="apply-btn" style={{ width:'auto', padding:'0.5rem 1.2rem' }} onClick={() => navigate('/jobs')}>
                    View Job →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recs.length > 0 && (
        <div className="sjm-footer-note">
          <i className="fas fa-info-circle" style={{ color:'#6b7280' }} /> Matches are based on current jobs in TalentTrack. New jobs posted by recruiters will appear in future matches.
        </div>
      )}
    </div>
  );
}
