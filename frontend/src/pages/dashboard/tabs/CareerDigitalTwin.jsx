// src/pages/dashboard/tabs/CareerDigitalTwin.jsx
import { useState, useEffect } from 'react';
import { CareerTwinService, ProfileService } from '../../../services/api.js';

const DEMAND_COLOR = { 'Very High':'#10b981','High':'#6366f1','Medium':'#f59e0b','Low':'#ef4444','Declining':'#6b7280' };
const RISK_COLOR   = { 'High':'#ef4444','Medium':'#f59e0b','Low':'#10b981','Very Low':'#06b6d4' };

export default function CareerDigitalTwin() {
  const [twin,     setTwin]     = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [form,     setForm]     = useState({ skills:'', experience:'', certifications:'', education:'', interests:'', currentRole:'' });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState('');
  const [activeTab,setActiveTab]= useState('identity');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [twinRes, profRes] = await Promise.all([CareerTwinService.get(), ProfileService.getFull()]);
        if (twinRes.twin) setTwin(twinRes.twin);
        if (profRes.profile) setProfile(profRes.profile);
      } catch {} finally { setFetching(false); }
    })();
  }, []);

  const extractFromProfile = () => {
    if (!profile) return;
    setForm({
      skills:         profile.skills?.map(s => s.name).join(', ') || '',
      experience:     `${profile.yearsExperience || 0} years — ${profile.currentRole || ''}`,
      certifications: profile.certifications?.map(c => c.name).join(', ') || '',
      education:      profile.education?.map(e => `${e.degree} from ${e.institution}`).join(', ') || '',
      interests:      profile.interests?.join(', ') || '',
      currentRole:    profile.currentRole || '',
    });
  };

  const generate = async () => {
    if (!form.skills.trim() && !form.currentRole.trim()) { setError('Please provide at least your skills or current role.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await CareerTwinService.generate({
        skills:         form.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience:     form.experience,
        certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean),
        education:      form.education,
        interests:      form.interests.split(',').map(s => s.trim()).filter(Boolean),
        currentRole:    form.currentRole,
      });
      setTwin(res.twin);
    } catch (err) { setError(err.message || 'Failed to generate. Please try again.'); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading your Digital Twin…</div>;

  return (
    <div className="cdt-container">
      <div className="cdt-header">
        <h2><i className="fas fa-dna" /> Career Digital Twin</h2>
        <p>AI-generated digital representation of your career — who you are today and who you can become.</p>
      </div>

      {!twin ? (
        <div className="cdt-form-card">
          <div className="cdt-form-header">
            <h3>Generate Your Career Digital Twin</h3>
            {profile && (
              <button className="cdt-extract-btn" onClick={extractFromProfile}>
                <i className="fas fa-magic" /> Extract from My Profile
              </button>
            )}
          </div>
          {!profile && <div className="cdt-notice"><i className="fas fa-info-circle" /> Complete your Profile to enable one-click extraction.</div>}

          <div className="cdt-form-grid">
            {[
              { key:'currentRole',    label:'Current Role',     placeholder:'e.g. Software Engineer, Student, Data Analyst' },
              { key:'experience',     label:'Experience',       placeholder:'e.g. 2 years as Backend Developer at TCS' },
              { key:'education',      label:'Education',        placeholder:'e.g. B.Tech CSE from VIT Chennai, 2024' },
            ].map(f => (
              <div key={f.key} className="cdt-field">
                <label>{f.label}</label>
                <input type="text" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div className="cdt-field">
            <label>Skills <span style={{ color:'#6b7280' }}>(comma-separated)</span></label>
            <textarea rows={2} placeholder="e.g. Python, React, SQL, Machine Learning, Communication" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
          </div>
          <div className="cdt-form-grid">
            <div className="cdt-field">
              <label>Certifications</label>
              <input type="text" placeholder="e.g. AWS Cloud Practitioner, Google Analytics" value={form.certifications} onChange={e => setForm(p => ({ ...p, certifications: e.target.value }))} />
            </div>
            <div className="cdt-field">
              <label>Interests</label>
              <input type="text" placeholder="e.g. AI, Startups, Open Source, FinTech" value={form.interests} onChange={e => setForm(p => ({ ...p, interests: e.target.value }))} />
            </div>
          </div>

          {error && <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>}
          <button className="ra-analyze-btn" onClick={generate} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-pulse" /> Generating Your Digital Twin…</> : <><i className="fas fa-dna" /> Generate Career Digital Twin</>}
          </button>
        </div>
      ) : (
        <div className="cdt-results">
          <div className="cdt-results-top">
            <h3><i className="fas fa-dna" /> Your Career Digital Twin</h3>
            <button className="ra-new-btn" onClick={() => setTwin(null)}><i className="fas fa-sync-alt" /> Regenerate</button>
          </div>

          <div className="cdt-tabs">
            {['identity','paths'].map(t => (
              <button key={t} className={`ra-tab${activeTab===t?' active':''}`} onClick={() => setActiveTab(t)}>
                {t === 'identity' ? <><i className="fas fa-user-circle" /> Current Identity</> : <><i className="fas fa-road" /> Career Paths ({twin.careerPaths?.length||0})</>}
              </button>
            ))}
          </div>

          {activeTab === 'identity' && (
            <div className="cdt-identity">
              <div className="cdt-summary-card">
                <p className="cdt-identity-summary">{twin.currentIdentity?.summary}</p>
              </div>
              <div className="cdt-identity-grid">
                {[
                  { label:'Career Health', value:twin.currentIdentity?.careerHealth, score:twin.currentIdentity?.careerHealthScore, color:'#10b981' },
                  { label:'Skill Strength', value:twin.currentIdentity?.skillStrength, score:twin.currentIdentity?.skillStrengthScore, color:'#6366f1' },
                  { label:'Market Value', value:twin.currentIdentity?.marketValue, score:twin.currentIdentity?.marketValueScore, color:'#f59e0b' },
                  { label:'Experience Level', value:twin.currentIdentity?.experienceLevel, score:null, color:'#8b5cf6' },
                  { label:'Industry Position', value:twin.currentIdentity?.industryPosition, score:null, color:'#06b6d4' },
                ].map((item, i) => (
                  <div key={i} className="cdt-identity-card" style={{ borderLeft:`4px solid ${item.color}` }}>
                    <div className="cdt-identity-label">{item.label}</div>
                    <div className="cdt-identity-value" style={{ color:item.color }}>{item.value}</div>
                    {item.score != null && (
                      <div className="cdt-identity-bar">
                        <div className="cdt-identity-fill" style={{ width:`${item.score}%`, background:item.color }} />
                        <span>{item.score}/100</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'paths' && (
            <div className="cdt-paths">
              {twin.topRecommendedPath && (
                <div className="cdt-recommended-banner">
                  <i className="fas fa-star" /> AI Recommends: <strong>{twin.topRecommendedPath}</strong>
                </div>
              )}
              <div className="cdt-paths-grid">
                {(twin.careerPaths || []).map((path, i) => (
                  <div key={i} className={`cdt-path-card${expanded===i?' expanded':''}`}>
                    <div className="cdt-path-header" onClick={() => setExpanded(expanded===i ? null : i)}>
                      <div>
                        <div className="cdt-path-name">{path.pathName}</div>
                        <div className="cdt-path-salary">{path.salaryGrowth}</div>
                      </div>
                      <div className="cdt-path-meta">
                        <span className="cdt-badge" style={{ background:DEMAND_COLOR[path.industryDemand]+'20', color:DEMAND_COLOR[path.industryDemand] }}>{path.industryDemand} Demand</span>
                        <div className="cdt-success-pct" style={{ color: path.successProbability >= 70 ? '#10b981' : '#f59e0b' }}>
                          {path.successProbability}% success
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${expanded===i?'up':'down'}`} style={{ color:'#6b7280' }} />
                    </div>
                    {expanded === i && (
                      <div className="cdt-path-body">
                        <div className="cdt-path-row">
                          <span>⚠️ Automation Risk:</span>
                          <span style={{ color:RISK_COLOR[path.automationRisk], fontWeight:600 }}>{path.automationRisk}</span>
                        </div>
                        <div className="cdt-path-row"><span>🏆 Competition:</span><span>{path.competitionLevel}</span></div>
                        <div className="cdt-path-row"><span>⏱ Timeline:</span><span>{path.timelineMonths} months</span></div>
                        <p className="cdt-path-why"><i className="fas fa-lightbulb" style={{ color:'#f59e0b' }} /> {path.whyGoodFit}</p>
                        {path.requiredSkills?.length > 0 && (
                          <div><p className="cdt-section-label">Skills to Acquire</p>
                            <div className="tag-list">{path.requiredSkills.map((s,si) => <span key={si} className="sg-phase-skill">{s}</span>)}</div>
                          </div>
                        )}
                        {path.progression?.length > 0 && (
                          <div><p className="cdt-section-label">Career Progression</p>
                            <div className="cdt-progression">{path.progression.map((p,pi) => <span key={pi} className="cdt-prog-step">{p}{pi<path.progression.length-1&&<i className="fas fa-arrow-right" style={{margin:'0 8px',color:'#6b7280'}} />}</span>)}</div>
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
    </div>
  );
}
