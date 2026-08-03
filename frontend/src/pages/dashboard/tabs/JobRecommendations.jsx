// src/pages/dashboard/tabs/JobRecommendations.jsx — Phase 7

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../services/api.js';

function MatchBadge({ pct }) {
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="match-badge" style={{ background: color + '15', borderColor: color, color }}>
      <div className="match-arc" style={{ '--pct': pct, '--color': color }}>
        <span>{pct}%</span>
      </div>
      Match
    </div>
  );
}

export default function JobRecommendations() {
  const [recs,       setRecs]       = useState([]);
  const [genAt,      setGenAt]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [expanded,   setExpanded]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecs();
  }, []);

  const loadRecs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/ai/recommendations');
      setRecs(res.recommendations || []);
      setGenAt(res.generatedAt);
    } catch {}
    finally { setLoading(false); }
  };

  const generateNew = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await apiRequest('/api/ai/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setRecs(res.recommendations || []);
      setGenAt(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Failed to generate recommendations. Make sure you have a resume or skill analysis saved.');
    } finally {
      setGenerating(false);
    }
  };

  const TYPE_LABELS = {
    fulltime: 'Full-time', parttime: 'Part-time',
    internship: 'Internship', contract: 'Contract', remote: 'Remote',
  };

  return (
    <div className="jr-container">
      <div className="sg-header">
        <h2><i className="fas fa-star" /> AI Job Recommendations</h2>
        <p>Personalized job matches based on your profile, skills, and resume analysis.</p>
      </div>

      <div className="jr-actions">
        <button className="ra-analyze-btn" style={{ width: 'auto' }} onClick={generateNew} disabled={generating}>
          {generating
            ? <><i className="fas fa-spinner fa-pulse" /> Generating Matches…</>
            : <><i className="fas fa-magic" /> Generate New Recommendations</>}
        </button>
        {genAt && (
          <span className="jr-updated">
            <i className="fas fa-clock" /> Last updated: {new Date(genAt).toLocaleString()}
          </span>
        )}
      </div>

      {error && (
        <div className="ra-error" style={{ marginBottom: '1rem' }}>
          <i className="fas fa-exclamation-circle" /> {error}
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
            Tip: Run a <strong>Resume Analysis</strong> or <strong>Skill Gap</strong> first to improve match quality.
          </p>
        </div>
      )}

      {loading ? (
        <div className="jr-loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="jr-card skeleton">
              <div className="sk-line sk-title" />
              <div className="sk-line sk-medium" />
            </div>
          ))}
        </div>
      ) : recs.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-star" />
          <p>No recommendations yet. Click "Generate" to get AI-matched jobs.</p>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            For best results, complete a Resume Analysis and Skill Gap Detection first.
          </p>
        </div>
      ) : (
        <div className="jr-grid">
          {recs.map((rec, i) => {
            const job = rec.job || {};
            return (
              <div key={i} className={`jr-card${expanded === i ? ' expanded' : ''}`}>
                <div className="jr-card-top">
                  <div className="jr-job-info">
                    <h3 className="jr-job-title">{job.title || 'Untitled'}</h3>
                    <p className="jr-job-company">
                      <i className="fas fa-building" /> {job.company || 'Unknown Company'}
                    </p>
                    <div className="jr-job-meta">
                      <span><i className="fas fa-map-marker-alt" /> {job.location || 'N/A'}</span>
                      <span><i className="fas fa-briefcase" /> {TYPE_LABELS[job.jobType] || job.jobType}</span>
                      {job.salaryDisplay && job.salaryDisplay !== 'Not specified' && (
                        <span><i className="fas fa-rupee-sign" /> {job.salaryDisplay}</span>
                      )}
                    </div>
                  </div>
                  <MatchBadge pct={rec.matchPercentage || 0} />
                </div>

                <div className="jr-reasons">
                  {(rec.matchReasons || []).map((r, ri) => (
                    <span key={ri} className="jr-reason"><i className="fas fa-check" /> {r}</span>
                  ))}
                </div>

                {expanded === i && (
                  <div className="jr-expanded-body">
                    {rec.missingSkills?.length > 0 && (
                      <div className="jr-missing">
                        <p><i className="fas fa-tools" style={{ color: '#f59e0b' }} /> <strong>Skills to improve chances:</strong></p>
                        <div className="tag-list">
                          {rec.missingSkills.map((s, si) => (
                            <span key={si} className="analysis-tag" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {rec.applicationTip && (
                      <div className="jr-tip">
                        <i className="fas fa-lightbulb" style={{ color: '#6366f1' }} />
                        <p>{rec.applicationTip}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="jr-card-actions">
                  <button className="jr-expand-btn" onClick={() => setExpanded(expanded === i ? null : i)}>
                    {expanded === i ? 'Show less' : 'See details'}
                    <i className={`fas fa-chevron-${expanded === i ? 'up' : 'down'}`} />
                  </button>
                  <button
                    className="apply-btn"
                    style={{ width: 'auto', padding: '0.5rem 1.2rem' }}
                    onClick={() => navigate('/jobs')}
                  >
                    View Job →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
