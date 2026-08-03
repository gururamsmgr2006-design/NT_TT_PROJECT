// src/pages/dashboard/tabs/CareerEscapeVelocity.jsx
import { useState, useEffect } from 'react';
import { EscapeVelocityService } from '../../../services/api.js';

const DIFF_COLOR = { 'Easy':'#10b981','Moderate':'#06b6d4','Challenging':'#f59e0b','Hard':'#ef4444','Very Hard':'#8b5cf6' };

export default function CareerEscapeVelocity() {
  const [form,     setForm]     = useState({ currentRole:'', currentSalary:'' });
  const [result,   setResult]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState('analyze');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    EscapeVelocityService.getHistory()
      .then(r => { setHistory(r.history||[]); if (r.history?.length) setResult(r.history[0]); })
      .catch(()=>{}).finally(()=>setFetching(false));
  }, []);

  const analyze = async () => {
    if (!form.currentRole.trim()) { setError('Please enter your current role.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await EscapeVelocityService.analyze(form);
      setResult(res.transition);
      const h = await EscapeVelocityService.getHistory();
      setHistory(h.history||[]);
    } catch (err) { setError(err.message||'Analysis failed.'); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading…</div>;

  return (
    <div className="cev-container">
      <div className="sg-header">
        <h2><i className="fas fa-rocket" /> Career Escape Velocity Engine</h2>
        <p>Break free from stagnant careers. Discover high-growth transitions based on your transferable skills.</p>
      </div>

      <div className="ra-tabs">
        <button className={`ra-tab${tab==='analyze'?' active':''}`} onClick={()=>setTab('analyze')}><i className="fas fa-search" /> Analyze</button>
        <button className={`ra-tab${tab==='history'?' active':''}`} onClick={()=>setTab('history')}><i className="fas fa-history" /> History ({history.length})</button>
      </div>

      {tab === 'analyze' && (
        <div className="sg-content">
          {!result ? (
            <div className="sg-form">
              <div className="rm-form-grid">
                <div className="sg-field">
                  <label>Current Role *</label>
                  <input type="text" placeholder="e.g. Software Developer, Data Analyst, Marketing Executive" value={form.currentRole} onChange={e=>setForm(p=>({...p,currentRole:e.target.value}))} />
                </div>
                <div className="sg-field">
                  <label>Current Salary (optional)</label>
                  <input type="text" placeholder="e.g. ₹8 LPA" value={form.currentSalary} onChange={e=>setForm(p=>({...p,currentSalary:e.target.value}))} />
                </div>
              </div>
              <div className="cdt-notice"><i className="fas fa-info-circle" /> Skills from your Profile will be used automatically. <a href="#" onClick={e=>{e.preventDefault();setTab('analyze');}}>Update Profile</a> for better results.</div>
              {error && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>}
              <button className="ra-analyze-btn" onClick={analyze} disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-pulse" /> Analyzing Escape Routes…</> : <><i className="fas fa-rocket" /> Launch Escape Velocity Analysis</>}
              </button>
            </div>
          ) : (
            <div className="cev-results">
              <div className="sg-results-top">
                <div>
                  <h3>🚀 Escape Analysis: {result.currentRole}</h3>
                  <p style={{ color:'#6b7280' }}>{result.summary}</p>
                </div>
                <button className="ra-new-btn" onClick={()=>setResult(null)}><i className="fas fa-plus" /> New Analysis</button>
              </div>

              {result.transferableSkills?.length > 0 && (
                <div className="cev-skills-section">
                  <h4><i className="fas fa-exchange-alt" style={{ color:'#6366f1' }} /> Your Transferable Skills</h4>
                  <div className="tag-list">{result.transferableSkills.map((s,i)=><span key={i} className="analysis-tag" style={{ borderColor:'#6366f1',color:'#6366f1' }}>{s}</span>)}</div>
                </div>
              )}

              <h4 style={{ margin:'1.5rem 0 1rem' }}><i className="fas fa-map" style={{ color:'#10b981' }} /> Career Transition Options</h4>
              <div className="cev-transitions">
                {(result.transitions||[]).map((tr,i) => (
                  <div key={i} className={`cev-card${expanded===i?' expanded':''}`}>
                    <div className="cev-card-header" onClick={()=>setExpanded(expanded===i?null:i)}>
                      <div className="cev-card-main">
                        <div className="cev-role-name">{tr.targetRole}</div>
                        <div className="cev-industry">{tr.targetIndustry}</div>
                      </div>
                      <div className="cev-card-meta">
                        <span className="cdt-badge" style={{ background:DIFF_COLOR[tr.difficulty]+'20', color:DIFF_COLOR[tr.difficulty] }}>{tr.difficulty}</span>
                        <span className="cev-salary-inc"><i className="fas fa-arrow-up" /> {tr.expectedSalaryIncrease}</span>
                        <div className="cev-success">{tr.successProbability}% success</div>
                      </div>
                      <div className="cev-time"><i className="fas fa-clock" /> {tr.estimatedTimeMonths}mo</div>
                      <i className={`fas fa-chevron-${expanded===i?'up':'down'}`} style={{ color:'#6b7280' }} />
                    </div>
                    {expanded === i && (
                      <div className="cev-card-body">
                        <p className="cev-why"><i className="fas fa-check-circle" style={{ color:'#10b981' }} /> {tr.whyPossible}</p>
                        {tr.requiredUpskilling?.length > 0 && (
                          <div><p className="cdt-section-label">Skills to Learn</p>
                            <div className="tag-list">{tr.requiredUpskilling.map((s,si)=><span key={si} className="analysis-tag" style={{ borderColor:'#f59e0b',color:'#f59e0b' }}>{s}</span>)}</div>
                          </div>
                        )}
                        {tr.firstSteps?.length > 0 && (
                          <div style={{ marginTop:'0.75rem' }}><p className="cdt-section-label">First 3 Steps</p>
                            <ol>{tr.firstSteps.map((s,si)=><li key={si}>{s}</li>)}</ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="ra-history">
          {history.length === 0 ? <div className="empty-state"><i className="fas fa-rocket" /><p>No analyses yet.</p></div>
          : history.map((item,i) => (
            <div key={i} className="ra-history-card" onClick={()=>{ setResult(item); setTab('analyze'); }}>
              <div className="ra-history-info"><strong>{item.currentRole}</strong><span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
              <div className="ra-history-scores">
                <span className="score-badge" style={{ background:'#6366f120',color:'#6366f1' }}>{item.transitions?.length||0} paths</span>
              </div>
              <button className="ra-view-btn"><i className="fas fa-eye" /> View</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
