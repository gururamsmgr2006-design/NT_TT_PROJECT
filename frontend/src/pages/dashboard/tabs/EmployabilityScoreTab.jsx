// src/pages/dashboard/tabs/EmployabilityScoreTab.jsx
import { useState, useEffect } from 'react';
import { EmployabilityService } from '../../../services/api.js';

const CATEGORIES = [
  { key:'resumeQuality',   label:'Resume Quality',    icon:'fa-file-alt',    color:'#6366f1', weight:'15%' },
  { key:'technicalSkills', label:'Technical Skills',  icon:'fa-code',        color:'#10b981', weight:'20%' },
  { key:'softSkills',      label:'Soft Skills',       icon:'fa-users',       color:'#f59e0b', weight:'10%' },
  { key:'certifications',  label:'Certifications',    icon:'fa-certificate', color:'#8b5cf6', weight:'10%' },
  { key:'projects',        label:'Projects',          icon:'fa-laptop-code', color:'#06b6d4', weight:'10%' },
  { key:'experience',      label:'Experience',        icon:'fa-briefcase',   color:'#ef4444', weight:'15%' },
  { key:'marketDemand',    label:'Market Demand',     icon:'fa-chart-line',  color:'#f59e0b', weight:'10%' },
  { key:'communication',   label:'Communication',     icon:'fa-comments',    color:'#10b981', weight:'5%'  },
  { key:'aiReadiness',     label:'AI Readiness',      icon:'fa-robot',       color:'#6366f1', weight:'5%'  },
];

const TIER_CONFIG = {
  'Beginner':    { color:'#6b7280', bg:'#6b728020', min:0,   max:199 },
  'Developing':  { color:'#06b6d4', bg:'#06b6d420', min:200, max:399 },
  'Competitive': { color:'#f59e0b', bg:'#f59e0b20', min:400, max:599 },
  'Strong':      { color:'#6366f1', bg:'#6366f120', min:600, max:799 },
  'Elite':       { color:'#10b981', bg:'#10b98120', min:800, max:1000 },
};

function ScoreGauge({ score, tier }) {
  const cfg   = TIER_CONFIG[tier] || TIER_CONFIG['Beginner'];
  const pct   = (score / 1000) * 100;
  const r     = 70;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <div className="emp-gauge-wrap">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle cx="90" cy="90" r={r} fill="none" stroke={cfg.color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 90 90)"
          style={{ transition:'stroke-dasharray 1.2s ease' }} />
        <text x="90" y="85" textAnchor="middle" fontSize="32" fontWeight="800" fill={cfg.color}>{score}</text>
        <text x="90" y="108" textAnchor="middle" fontSize="11" fill="#6b7280">/ 1000</text>
      </svg>
      <div className="emp-tier" style={{ background:cfg.bg, color:cfg.color }}>{tier}</div>
    </div>
  );
}

export default function EmployabilityScoreTab() {
  const [score,    setScore]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tab,      setTab]      = useState('score');

  useEffect(() => {
    (async () => {
      try {
        const [h] = await Promise.all([EmployabilityService.getHistory()]);
        setHistory(h.history || []);
        if (h.history?.length > 0) setScore(h.history[0]);
      } catch {} finally { setFetching(false); }
    })();
  }, []);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await EmployabilityService.calculate({});
      setScore(res.score);
      const h = await EmployabilityService.getHistory();
      setHistory(h.history || []);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading score…</div>;

  return (
    <div className="emp-container">
      <div className="sg-header">
        <h2><i className="fas fa-chart-bar" /> Employability Score</h2>
        <p>A comprehensive 0–1000 score measuring your career readiness across 9 dimensions.</p>
      </div>

      <div className="ra-tabs">
        <button className={`ra-tab${tab==='score'?' active':''}`} onClick={() => setTab('score')}><i className="fas fa-chart-pie" /> My Score</button>
        <button className={`ra-tab${tab==='history'?' active':''}`} onClick={() => setTab('history')}><i className="fas fa-history" /> History ({history.length})</button>
      </div>

      {tab === 'score' && (
        <div className="emp-content">
          {score ? (
            <>
              <div className="emp-top">
                <ScoreGauge score={score.totalScore} tier={score.tier} />
                <div className="emp-top-info">
                  <div className="emp-stats-row">
                    <div className="emp-stat"><span className="emp-stat-label">Weekly Growth</span><span className="emp-stat-value" style={{ color:'#10b981' }}>+{score.weeklyGrowth}</span></div>
                    <div className="emp-stat"><span className="emp-stat-label">Monthly Growth</span><span className="emp-stat-value" style={{ color:'#6366f1' }}>+{score.monthlyGrowth}</span></div>
                  </div>
                  <button className="ra-analyze-btn" onClick={calculate} disabled={loading} style={{ marginTop:'1rem' }}>
                    {loading ? <><i className="fas fa-spinner fa-pulse" /> Recalculating…</> : <><i className="fas fa-sync-alt" /> Recalculate Score</>}
                  </button>
                </div>
              </div>

              <h4 className="emp-section-title"><i className="fas fa-th" /> Category Breakdown</h4>
              <div className="emp-breakdown-grid">
                {CATEGORIES.map(cat => {
                  const val = score.breakdown?.[cat.key] ?? 0;
                  return (
                    <div key={cat.key} className="emp-cat-card">
                      <div className="emp-cat-icon" style={{ color:cat.color, background:cat.color+'15' }}>
                        <i className={`fas ${cat.icon}`} />
                      </div>
                      <div className="emp-cat-info">
                        <div className="emp-cat-label">{cat.label}</div>
                        <div className="emp-cat-bar-wrap">
                          <div className="emp-cat-bar"><div className="emp-cat-fill" style={{ width:`${val}%`, background:cat.color }} /></div>
                          <span className="emp-cat-score" style={{ color:cat.color }}>{val}</span>
                        </div>
                        <div className="emp-cat-weight">Weight: {cat.weight}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {score.improvementRecommendations?.length > 0 && (
                <div className="emp-recs">
                  <h4><i className="fas fa-lightbulb" style={{ color:'#f59e0b' }} /> Improvement Recommendations</h4>
                  <ol>{score.improvementRecommendations.map((r, i) => <li key={i}>{r}</li>)}</ol>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <i className="fas fa-chart-bar" />
              <p>Your Employability Score hasn't been calculated yet.</p>
              <p style={{ fontSize:'0.85rem', color:'#9ca3af' }}>For best results, complete your Profile, upload a Resume, and run a Skill Gap analysis first.</p>
              <button className="ra-analyze-btn" style={{ width:'auto', marginTop:'1rem' }} onClick={calculate} disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-pulse" /> Calculating…</> : <><i className="fas fa-magic" /> Calculate My Score</>}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="ra-history">
          {history.length === 0 ? (
            <div className="empty-state"><i className="fas fa-chart-bar" /><p>No score history yet.</p></div>
          ) : history.map((item, i) => (
            <div key={i} className="ra-history-card" onClick={() => { setScore(item); setTab('score'); }}>
              <div className="ra-history-info">
                <strong>{item.tier}</strong>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="ra-history-scores">
                <span className="score-badge" style={{ background: TIER_CONFIG[item.tier]?.bg, color: TIER_CONFIG[item.tier]?.color }}>
                  {item.totalScore} / 1000
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
