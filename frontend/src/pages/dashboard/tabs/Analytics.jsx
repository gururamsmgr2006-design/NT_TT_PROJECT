// src/pages/dashboard/tabs/Analytics.jsx
import { useState, useEffect } from 'react';
import { AnalyticsService } from '../../../services/api.js';

function BarChart({ data, color = '#6366f1', height = 120 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="anl-bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="anl-bar-col">
          <div className="anl-bar-fill" style={{ height: `${(d.value / max) * 100}%`, background: color }} title={`${d.label}: ${d.value}`} />
          <span className="anl-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, color = '#6366f1' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 300, h = 80, pad = 10;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - 2 * pad);
    const y = h - pad - ((d.value / max) * (h - 2 * pad));
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="anl-line-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 80 }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1 || 1)) * (w - 2 * pad);
          const y = h - pad - ((d.value / max) * (h - 2 * pad));
          return <circle key={i} cx={x} cy={y} r="3" fill={color}><title>{d.label}: {d.value}</title></circle>;
        })}
      </svg>
      <div className="anl-line-labels">
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
}

function RadarChart({ skills }) {
  if (!skills?.length) return null;
  const n = skills.length, r = 70, cx = 90, cy = 90;
  const pts = skills.map((s, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const val = s.level / 100;
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle), lx: cx + (r + 18) * Math.cos(angle), ly: cy + (r + 18) * Math.sin(angle), label: s.skill };
  });
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(' ');
  const gridLevels = [0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox="0 0 180 180" style={{ width: '100%', maxWidth: 220, margin: '0 auto', display: 'block' }}>
      {gridLevels.map(lvl => {
        const gridPts = skills.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          return `${cx + r * lvl * Math.cos(angle)},${cy + r * lvl * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={lvl} points={gridPts} fill="none" stroke="#e5e7eb" strokeWidth="1" />;
      })}
      {skills.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#e5e7eb" strokeWidth="1" />;
      })}
      <polygon points={polyPts} fill="#6366f120" stroke="#6366f1" strokeWidth="2" />
      {pts.map((p, i) => (
        <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#374151">{p.label}</text>
      ))}
    </svg>
  );
}

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    AnalyticsService.getDashboard()
      .then(res => setData(res))
      .catch(err => setError(err.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading analytics…</div>;
  if (error)   return <div className="ra-error"><i className="fas fa-exclamation-circle" /> {error}</div>;
  if (!data)   return null;

  const { summary, applicationFunnel, resumeTrend, skillTrend, employabilityTrend, skillsRadar } = data;

  return (
    <div className="anl-container">
      <div className="sg-header">
        <h2><i className="fas fa-chart-line" /> Career Analytics</h2>
        <p>Deep personal career analytics — track your growth, applications, and skill progress.</p>
      </div>

      {/* KPI Cards */}
      <div className="anl-kpi-grid">
        {[
          { label:'Career Growth Score',       value:`${summary.careerGrowthScore}/100`,    icon:'fa-chart-line',  color:'#6366f1' },
          { label:'Employability Score',        value:`${summary.currentEmployabilityScore}/1000`, icon:'fa-star', color:'#f59e0b' },
          { label:'Total Applications',         value:summary.totalApplications,             icon:'fa-paper-plane', color:'#10b981' },
          { label:'AI Conversations',           value:summary.aiConversations,               icon:'fa-robot',       color:'#8b5cf6' },
          { label:'Profile Completeness',       value:`${summary.profileCompleteness}%`,     icon:'fa-user-circle', color:'#06b6d4' },
          { label:'Roadmaps Generated',         value:summary.roadmapsGenerated,             icon:'fa-road',        color:'#ef4444' },
        ].map((kpi, i) => (
          <div key={i} className="anl-kpi-card">
            <div className="anl-kpi-icon" style={{ color: kpi.color, background: kpi.color + '15' }}>
              <i className={`fas ${kpi.icon}`} />
            </div>
            <div className="anl-kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="anl-kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="anl-grid-2">
        {/* Application Funnel */}
        <div className="anl-panel">
          <h4><i className="fas fa-filter" style={{ color:'#6366f1' }} /> Application Funnel</h4>
          {[
            { label:'Applied',     val: applicationFunnel.applied,     color:'#6366f1' },
            { label:'Reviewed',    val: applicationFunnel.reviewed,     color:'#06b6d4' },
            { label:'Shortlisted', val: applicationFunnel.shortlisted,  color:'#f59e0b' },
            { label:'Interview',   val: applicationFunnel.interview,    color:'#8b5cf6' },
            { label:'Hired',       val: applicationFunnel.hired,        color:'#10b981' },
            { label:'Rejected',    val: applicationFunnel.rejected,     color:'#ef4444' },
          ].map((s, i) => {
            const total = Math.max(applicationFunnel.applied, 1);
            return (
              <div key={i} className="anl-funnel-row">
                <span className="anl-funnel-label">{s.label}</span>
                <div className="anl-funnel-bar-wrap">
                  <div className="anl-funnel-bar"><div style={{ width: `${(s.val / total) * 100}%`, background: s.color, height: '100%', borderRadius: 4, transition: 'width 0.8s ease' }} /></div>
                </div>
                <span className="anl-funnel-count" style={{ color: s.color }}>{s.val}</span>
              </div>
            );
          })}
        </div>

        {/* Skills Radar */}
        <div className="anl-panel">
          <h4><i className="fas fa-spider" style={{ color:'#8b5cf6' }} /> Skills Radar</h4>
          {skillsRadar?.length > 0
            ? <RadarChart skills={skillsRadar} />
            : <div className="empty-state" style={{ minHeight: 120 }}><p style={{ fontSize:'0.85rem' }}>Add skills to your Profile to see the radar chart.</p></div>}
        </div>
      </div>

      {/* Employability Trend */}
      {employabilityTrend?.length > 1 && (
        <div className="anl-panel" style={{ marginTop:'1.5rem' }}>
          <h4><i className="fas fa-chart-area" style={{ color:'#f59e0b' }} /> Employability Score Trend</h4>
          <LineChart data={employabilityTrend.map(e => ({ label: e.date, value: e.score }))} color="#f59e0b" />
        </div>
      )}

      <div className="anl-grid-2" style={{ marginTop:'1.5rem' }}>
        {/* Resume Score Trend */}
        {resumeTrend?.length > 0 && (
          <div className="anl-panel">
            <h4><i className="fas fa-file-alt" style={{ color:'#6366f1' }} /> Resume Performance</h4>
            <BarChart data={resumeTrend.map(r => ({ label: r.date, value: r.overall }))} color="#6366f1" height={100} />
            <p style={{ fontSize:'0.75rem', color:'#9ca3af', textAlign:'center', marginTop:'0.5rem' }}>Overall Score per analysis</p>
          </div>
        )}

        {/* Skill Gap Trend */}
        {skillTrend?.length > 0 && (
          <div className="anl-panel">
            <h4><i className="fas fa-code" style={{ color:'#10b981' }} /> Skill Match Progress</h4>
            <LineChart data={skillTrend.map(s => ({ label: s.date, value: s.match }))} color="#10b981" />
            <p style={{ fontSize:'0.75rem', color:'#9ca3af', textAlign:'center', marginTop:'0.5rem' }}>Skill match % across analyses</p>
          </div>
        )}
      </div>
    </div>
  );
}
