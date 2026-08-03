// src/pages/dashboard/tabs/SkillDemandRadar.jsx
import { useState, useEffect } from 'react';
import { MarketService } from '../../../services/api.js';

const FORECAST_TABS = [
  { key:'sixMonths', label:'6 Months' }, { key:'oneYear', label:'1 Year' },
  { key:'threeYears', label:'3 Years' }, { key:'fiveYears', label:'5 Years' },
];

export default function SkillDemandRadar() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [forecastTab, setForecastTab] = useState('sixMonths');
  const [activeCity,  setActiveCity]  = useState(0);

  useEffect(() => {
    MarketService.getSkillRadar()
      .then(res => setData(res))
      .catch(err => setError(err.message || 'Failed to load market data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading Market Intelligence…</div>;
  if (error)   return <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}<button className="ra-new-btn" style={{ marginLeft:'1rem' }} onClick={() => window.location.reload()}>Retry</button></div>;
  if (!data)   return null;

  return (
    <div className="sdr-container">
      <div className="sg-header">
        <h2><i className="fas fa-satellite-dish" /> Skill Demand Radar</h2>
        <p>India's national labor market intelligence — skills, careers, cities, and forecasts.</p>
        {data.cachedAt && <span className="sdr-cache-note"><i className="fas fa-clock" /> Updated {new Date(data.cachedAt).toLocaleString('en-IN')}</span>}
      </div>

      <div className="sdr-grid-2">
        {/* Emerging Skills */}
        <div className="sdr-panel">
          <h4><i className="fas fa-arrow-trend-up" style={{ color:'#10b981' }} /> Emerging Skills</h4>
          {(data.emergingSkills||[]).slice(0,8).map((s,i) => (
            <div key={i} className="sdr-skill-row">
              <div className="sdr-skill-info">
                <span className="sdr-skill-name">{s.skill}</span>
                <span className="sdr-skill-reason">{s.reason}</span>
              </div>
              <div className="sdr-skill-right">
                <div className="sdr-demand-bar"><div className="sdr-demand-fill" style={{ width:`${s.demandScore||70}%`, background:'#10b981' }} /></div>
                <span className="sdr-growth" style={{ color:'#10b981' }}>↑ {s.growthRate}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Declining Skills */}
        <div className="sdr-panel">
          <h4><i className="fas fa-arrow-trend-down" style={{ color:'#ef4444' }} /> Declining Skills</h4>
          {(data.decliningSkills||[]).slice(0,8).map((s,i) => (
            <div key={i} className="sdr-skill-row">
              <div className="sdr-skill-info">
                <span className="sdr-skill-name">{s.skill}</span>
                <span className="sdr-skill-reason">{s.reason}</span>
              </div>
              <span className="sdr-growth" style={{ color:'#ef4444' }}>↓ {s.declineRate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fastest Growing Careers */}
      <div className="sdr-panel" style={{ marginTop:'1.5rem' }}>
        <h4><i className="fas fa-fire" style={{ color:'#f59e0b' }} /> Fastest Growing Careers in India</h4>
        <div className="sdr-careers-grid">
          {(data.fastestGrowingCareers||[]).map((c,i) => (
            <div key={i} className="sdr-career-card">
              <div className="sdr-career-name">{c.career}</div>
              <div className="sdr-career-meta">
                <span className="score-badge" style={{ background:'#10b98120',color:'#10b981' }}>↑ {c.growth}</span>
                <span className="score-badge" style={{ background:'#6366f120',color:'#6366f1' }}>₹ {c.avgSalary}</span>
              </div>
              <div className="sdr-career-openings"><i className="fas fa-briefcase" /> {c.openings}</div>
            </div>
          ))}
        </div>
      </div>

      {/* City Demand */}
      {(data.cityDemand||[]).length > 0 && (
        <div className="sdr-panel" style={{ marginTop:'1.5rem' }}>
          <h4><i className="fas fa-map-marker-alt" style={{ color:'#6366f1' }} /> City-wise Demand Heatmap</h4>
          <div className="sdr-city-tabs">
            {data.cityDemand.map((c,i) => (
              <button key={i} className={`ra-tab${activeCity===i?' active':''}`} style={{ fontSize:'0.8rem', padding:'0.4rem 0.8rem' }} onClick={()=>setActiveCity(i)}>{c.city}</button>
            ))}
          </div>
          {data.cityDemand[activeCity] && (
            <div className="sdr-city-content">
              <div className="sdr-city-row">
                <div><span className="sdr-label">Avg Salary</span><span className="sdr-val" style={{ color:'#10b981' }}>{data.cityDemand[activeCity].avgSalary}</span></div>
                <div><span className="sdr-label">Growth Outlook</span><span className="sdr-val" style={{ color:'#6366f1' }}>{data.cityDemand[activeCity].growthOutlook}</span></div>
              </div>
              <div><p className="cdt-section-label">Top Skills in {data.cityDemand[activeCity].city}</p>
                <div className="tag-list">{(data.cityDemand[activeCity].topSkills||[]).map((s,i)=><span key={i} className="sg-phase-skill">{s}</span>)}</div>
              </div>
              {data.cityDemand[activeCity].topCompanies?.length > 0 && (
                <div style={{ marginTop:'0.75rem' }}><p className="cdt-section-label">Top Hiring Companies</p>
                  <div className="tag-list">{data.cityDemand[activeCity].topCompanies.map((c,i)=><span key={i} className="analysis-tag" style={{ borderColor:'#06b6d4',color:'#06b6d4' }}>{c}</span>)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Salary Intelligence */}
      {(data.salaryIntelligence||[]).length > 0 && (
        <div className="sdr-panel" style={{ marginTop:'1.5rem' }}>
          <h4><i className="fas fa-rupee-sign" style={{ color:'#f59e0b' }} /> Salary Intelligence</h4>
          <div className="sdr-salary-table">
            <div className="sdr-salary-header"><span>Role</span><span>Entry</span><span>Mid</span><span>Senior</span><span>Trend</span></div>
            {data.salaryIntelligence.map((s,i)=>(
              <div key={i} className={`sdr-salary-row${i%2===0?'':' alt'}`}>
                <span className="sdr-role-name">{s.role}</span><span>{s.entry}</span><span>{s.mid}</span><span>{s.senior}</span>
                <span style={{ color: s.trend?.includes('↑')||s.trend?.toLowerCase().includes('up')||s.trend?.toLowerCase().includes('grow') ? '#10b981' : '#ef4444' }}>{s.trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecasts */}
      {data.forecasts && (
        <div className="sdr-panel" style={{ marginTop:'1.5rem' }}>
          <h4><i className="fas fa-crystal-ball" style={{ color:'#8b5cf6' }} /> AI Market Forecasts</h4>
          <div className="sdr-forecast-tabs">
            {FORECAST_TABS.map(ft => (
              <button key={ft.key} className={`ra-tab${forecastTab===ft.key?' active':''}`} style={{ fontSize:'0.8rem' }} onClick={()=>setForecastTab(ft.key)}>{ft.label}</button>
            ))}
          </div>
          <ul className="sdr-forecast-list">
            {(data.forecasts[forecastTab]||[]).map((f,i)=><li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
