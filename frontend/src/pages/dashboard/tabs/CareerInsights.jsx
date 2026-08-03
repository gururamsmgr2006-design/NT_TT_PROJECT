// src/pages/dashboard/tabs/CareerInsights.jsx
import { useState, useEffect } from 'react';
import { InsightsService } from '../../../services/api.js';

const TYPE_CONFIG = {
  opportunity:    { icon:'🚀', color:'#10b981', bg:'#10b98115', label:'Opportunity'   },
  risk:           { icon:'⚠️', color:'#ef4444', bg:'#ef444415', label:'Risk Detected' },
  salary:         { icon:'💰', color:'#f59e0b', bg:'#f59e0b15', label:'Salary Intel'  },
  'hidden-skill': { icon:'🧩', color:'#8b5cf6', bg:'#8b5cf615', label:'Hidden Skill'  },
  readiness:      { icon:'🎯', color:'#6366f1', bg:'#6366f115', label:'Readiness'     },
  growth:         { icon:'📈', color:'#06b6d4', bg:'#06b6d415', label:'Growth Path'   },
};
const IMPACT_COLOR = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' };

export default function CareerInsights() {
  const [insights,   setInsights]   = useState([]);
  const [genAt,      setGenAt]      = useState(null);
  const [pctComplete,setPctComplete]= useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [filter,     setFilter]     = useState('all');

  const load = async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const res = force
        ? await InsightsService.refresh()
        : await InsightsService.get();
      setInsights(res.insights || []);
      setGenAt(res.generatedAt);
      setPctComplete(res.profileCompletenessPct || 0);
    } catch (err) { setError(err.message || 'Failed to load insights.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? insights : insights.filter(i => i.type === filter);
  const types    = [...new Set(insights.map(i => i.type))];

  if (loading) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Generating your career insights…</div>;

  return (
    <div className="ci-container">
      <div className="sg-header">
        <h2><i className="fas fa-brain" /> Career Insights</h2>
        <p>AI-driven intelligence based on your profile — opportunities, risks, and growth paths.</p>
      </div>

      {/* Profile completeness nudge */}
      {pctComplete < 80 && (
        <div className="ci-nudge">
          <div className="ci-nudge-icon">📋</div>
          <div className="ci-nudge-body">
            <strong>Your profile is {pctComplete}% complete.</strong>
            <span> Update your Profile regularly for more accurate and personalised insights.</span>
          </div>
          <div className="ci-nudge-bar-wrap">
            <div className="ci-nudge-bar"><div style={{ width:`${pctComplete}%`, background:'#6366f1', height:'100%', borderRadius:4 }} /></div>
            <span>{pctComplete}%</span>
          </div>
        </div>
      )}

      <div className="ci-toolbar">
        <div className="ci-filters">
          <button className={`ci-filter-btn${filter==='all'?' active':''}`} onClick={() => setFilter('all')}>All ({insights.length})</button>
          {types.map(t => {
            const cfg = TYPE_CONFIG[t] || {};
            return <button key={t} className={`ci-filter-btn${filter===t?' active':''}`} style={filter===t?{background:cfg.color,color:'#fff',border:`1px solid ${cfg.color}`}:{}} onClick={() => setFilter(t)}>{cfg.icon} {cfg.label}</button>;
          })}
        </div>
        <div className="ci-actions">
          {genAt && <span className="jr-updated"><i className="fas fa-clock" /> {new Date(genAt).toLocaleString('en-IN')}</span>}
          <button className="ra-new-btn" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? <><i className="fas fa-spinner fa-pulse" /> Refreshing…</> : <><i className="fas fa-sync-alt" /> Refresh</>}
          </button>
        </div>
      </div>

      {error && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-brain" />
          <p>No insights available yet.</p>
          <p style={{ fontSize:'0.85rem', color:'#9ca3af' }}>Complete your Profile, run a Resume Analysis, and calculate your Employability Score for rich insights.</p>
          <button className="ra-analyze-btn" style={{ width:'auto', marginTop:'1rem' }} onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? 'Generating…' : 'Generate Insights'}
          </button>
        </div>
      ) : (
        <div className="ci-grid">
          {filtered.map((insight, i) => {
            const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.growth;
            return (
              <div key={i} className="ci-card" style={{ borderLeft:`4px solid ${cfg.color}`, background: cfg.bg }}>
                <div className="ci-card-header">
                  <span className="ci-card-icon">{insight.icon || cfg.icon}</span>
                  <div className="ci-card-meta">
                    <span className="ci-card-type" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className="ci-card-impact" style={{ color: IMPACT_COLOR[insight.impact] }}>● {insight.impact} impact</span>
                  </div>
                  {insight.metric && <span className="ci-card-metric" style={{ color: cfg.color }}>{insight.metric}</span>}
                </div>
                <h4 className="ci-card-title">{insight.title}</h4>
                <p className="ci-card-message">{insight.message}</p>
                {insight.actionRequired && (
                  <div className="ci-card-action">
                    <i className="fas fa-arrow-right" style={{ color: cfg.color }} /> {insight.actionRequired}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
