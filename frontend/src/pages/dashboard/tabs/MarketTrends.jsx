// src/pages/dashboard/tabs/MarketTrends.jsx
import { useState, useEffect } from 'react';
import { MarketService } from '../../../services/api.js';

const HEALTH_COLOR = s => s >= 80 ? '#10b981' : s >= 60 ? '#6366f1' : s >= 40 ? '#f59e0b' : '#ef4444';

export default function MarketTrends() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('industries');

  useEffect(() => {
    MarketService.getMarketTrends()
      .then(res => setData(res))
      .catch(err => setError(err.message || 'Failed to load market trends.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading market intelligence…</div>;
  if (error)   return <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>;
  if (!data)   return null;

  return (
    <div className="mt-container">
      <div className="sg-header">
        <h2><i className="fas fa-globe-asia" /> Market Trends</h2>
        <p>India's workforce intelligence dashboard — industries, hiring trends, and emerging opportunities.</p>
        {data.cachedAt && <span className="sdr-cache-note"><i className="fas fa-clock" /> Intelligence as of {new Date(data.cachedAt).toLocaleString('en-IN')}</span>}
      </div>

      <div className="ra-tabs">
        {[
          { key:'industries', label:'Industry Health', icon:'fa-industry'   },
          { key:'hiring',     label:'Hiring Trends',  icon:'fa-users'       },
          { key:'tech',       label:'Tech Trends',    icon:'fa-microchip'   },
          { key:'emerging',   label:'Opportunities',  icon:'fa-lightbulb'   },
          { key:'salary',     label:'Salary Intel',   icon:'fa-rupee-sign'  },
        ].map(t => (
          <button key={t.key} className={`ra-tab${tab===t.key?' active':''}`} onClick={() => setTab(t.key)}>
            <i className={`fas ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'industries' && (
        <div className="mt-panel">
          <h4><i className="fas fa-industry" style={{ color:'#6366f1' }} /> Industry Health Scores</h4>
          <div className="mt-industry-grid">
            {(data.industryHealth || []).map((ind, i) => (
              <div key={i} className="mt-industry-card">
                <div className="mt-industry-name">{ind.industry}</div>
                <div className="mt-health-circle" style={{ color: HEALTH_COLOR(ind.healthScore) }}>
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle cx="30" cy="30" r="24" fill="none" stroke={HEALTH_COLOR(ind.healthScore)} strokeWidth="6"
                      strokeDasharray={`${(ind.healthScore / 100) * 150.8} 150.8`} strokeLinecap="round" transform="rotate(-90 30 30)" />
                    <text x="30" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill={HEALTH_COLOR(ind.healthScore)}>{ind.healthScore}</text>
                  </svg>
                </div>
                <div className="mt-industry-meta">
                  <span className="mt-meta-item" style={{ color:'#10b981' }}>{ind.growthOutlook}</span>
                  <span className="mt-meta-item" style={{ color:'#6b7280' }}>{ind.hiringTrend}</span>
                  <span className="mt-meta-item"><i className="fas fa-rupee-sign" /> {ind.avgSalary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'hiring' && (
        <div className="mt-panel">
          <h4><i className="fas fa-users" style={{ color:'#10b981' }} /> Hiring Trends in India</h4>
          <ul className="mt-trend-list">
            {(data.hiringTrends || []).map((t, i) => (
              <li key={i} className="mt-trend-item">
                <span className="mt-trend-icon">📌</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <h4 style={{ marginTop:'1.5rem' }}><i className="fas fa-fire" style={{ color:'#f59e0b' }} /> Fastest Growing Careers</h4>
          <div className="sdr-careers-grid">
            {(data.fastestGrowingCareers || []).map((c, i) => (
              <div key={i} className="sdr-career-card">
                <div className="sdr-career-name">{c.career}</div>
                <div className="sdr-career-meta">
                  <span className="score-badge" style={{ background:'#10b98120', color:'#10b981' }}>↑ {c.growth}</span>
                  <span className="score-badge" style={{ background:'#6366f120', color:'#6366f1' }}>₹ {c.avgSalary}</span>
                </div>
                {c.demand && <div className="sdr-career-openings">{c.demand}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tech' && (
        <div className="mt-panel">
          <h4><i className="fas fa-microchip" style={{ color:'#8b5cf6' }} /> Technology Trends Reshaping India's Workforce</h4>
          <div className="mt-tech-grid">
            {(data.technologyTrends || []).map((t, i) => (
              <div key={i} className="mt-tech-card">
                <span className="mt-tech-num">{String(i+1).padStart(2,'0')}</span>
                <span className="mt-tech-text">{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'emerging' && (
        <div className="mt-panel">
          <h4><i className="fas fa-lightbulb" style={{ color:'#f59e0b' }} /> Emerging Career Opportunities</h4>
          <div className="mt-opp-grid">
            {(data.emergingOpportunities || []).map((opp, i) => (
              <div key={i} className="mt-opp-card">
                <div className="mt-opp-icon">🌟</div>
                <p className="mt-opp-text">{opp}</p>
              </div>
            ))}
          </div>
          {data.forecasts?.oneYear?.length > 0 && (
            <>
              <h4 style={{ marginTop:'1.5rem' }}><i className="fas fa-crystal-ball" style={{ color:'#8b5cf6' }} /> 1-Year Forecast</h4>
              <ul className="mt-trend-list">{data.forecasts.oneYear.map((f,i) => <li key={i} className="mt-trend-item"><span>🔮</span><span>{f}</span></li>)}</ul>
            </>
          )}
        </div>
      )}

      {tab === 'salary' && (
        <div className="mt-panel">
          <h4><i className="fas fa-rupee-sign" style={{ color:'#f59e0b' }} /> Salary Intelligence — Indian Market</h4>
          <div className="sdr-salary-table">
            <div className="sdr-salary-header"><span>Role</span><span>Entry Level</span><span>Mid Level</span><span>Senior Level</span><span>Trend</span></div>
            {(data.salaryIntelligence || []).map((s, i) => (
              <div key={i} className={`sdr-salary-row${i%2===0?'':' alt'}`}>
                <span className="sdr-role-name">{s.role}</span>
                <span>{s.entry}</span><span>{s.mid}</span><span>{s.senior}</span>
                <span style={{ color: s.trend?.includes('↑') || s.trend?.toLowerCase().includes('grow') ? '#10b981' : '#ef4444', fontWeight:600 }}>{s.trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
