// src/pages/dashboard/JobseekerDashboard.jsx — FULL REBUILD v2.0 (CIOS)
import { useState, useEffect, useCallback } from 'react';
import { useNavigate }     from 'react-router-dom';
import { useAuth }         from '../../context/AuthContext.jsx';
import Navbar              from '../../components/Navbar.jsx';
import AIChatbot           from '../../components/AIChatbot.jsx';
import { Toast }           from '../../components/SharedComponents.jsx';
import { useToast }        from '../../hooks/useToast.js';

// Existing AI tabs (unchanged)
import AIAssistant         from './tabs/AIAssistant.jsx';

// New CIOS tabs
import ResumeIntelligence  from './tabs/ResumeIntelligence.jsx';
import CareerDigitalTwin   from './tabs/CareerDigitalTwin.jsx';
import EmployabilityScoreTab from './tabs/EmployabilityScoreTab.jsx';
import CareerEscapeVelocity from './tabs/CareerEscapeVelocity.jsx';
import SkillDemandRadar    from './tabs/SkillDemandRadar.jsx';
import SmartJobMatches     from './tabs/SmartJobMatches.jsx';
import Analytics           from './tabs/Analytics.jsx';
import CareerInsights      from './tabs/CareerInsights.jsx';
import MarketTrends        from './tabs/MarketTrends.jsx';
import Achievements        from './tabs/Achievements.jsx';
import ProfilePage         from './tabs/ProfilePage.jsx';
import Settings            from './tabs/Settings.jsx';

import { JobService, ApplicationService, UserService } from '../../services/services.js';
import { apiRequest }      from '../../services/api.js';
import '../../styles/dashboard-v2.css';

// ── Nav structure ─────────────────────────────────────────────
const NAV = [
  {
    group: 'MAIN',
    items: [
      { view:'overview',    icon:'fa-th-large',      label:'Overview'        },
      { view:'twin',        icon:'fa-dna',           label:'Career Digital Twin', badge:'AI' },
      { view:'jobs',        icon:'fa-search',        label:'Opportunities'     },
      { view:'applied',     icon:'fa-paper-plane',   label:'Applications'    },
      { view:'saved',       icon:'fa-bookmark',      label:'Saved Jobs'      },
      { view:'matches',     icon:'fa-magic',         label:'Smart Matches',  badge:'AI' },
    ],
  },
  {
    group: 'AI INTELLIGENCE',
    items: [
      { view:'ai',          icon:'fa-robot',         label:'AI Assistant',   badge:'AI' },
      { view:'resume',      icon:'fa-brain',         label:'Resume Intelligence', badge:'AI' },
      { view:'employability',icon:'fa-chart-bar',   label:'Employability Score', badge:'AI' },
      { view:'escape',      icon:'fa-rocket',        label:'Escape Velocity',badge:'AI' },
      { view:'radar',       icon:'fa-satellite-dish',label:'Skill Radar',    badge:'AI' },
    ],
  },
  {
    group: 'INTELLIGENCE LAYER',
    items: [
      { view:'analytics',   icon:'fa-chart-line',    label:'Analytics'       },
      { view:'insights',    icon:'fa-lightbulb',     label:'Career Insights', badge:'AI' },
      { view:'market',      icon:'fa-globe-asia',    label:'Market Trends',  badge:'AI' },
    ],
  },
  {
    group: 'USER LAYER',
    items: [
      { view:'achievements',icon:'fa-trophy',        label:'Achievements'    },
      { view:'settings',    icon:'fa-cog',           label:'Settings'        },
      { view:'profile',     icon:'fa-id-card',       label:'Profile'         },
    ],
  },
];

// ── Inline: Overview Tab ──────────────────────────────────────
function OverviewTab({ user, onNavigate }) {
  const [stats,   setStats]   = useState({ applications:0, savedJobs:0, empScore:0, profilePct:0 });
  const [recentApps, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [apps, saved, emp, profile] = await Promise.all([
          apiRequest('/api/applications/my-applications?limit=5'),
          apiRequest('/api/users/saved-jobs'),
          apiRequest('/api/ai/employability/history').catch(()=>({ history:[] })),
          apiRequest('/api/profile/full').catch(()=>({ profile:{ completenessScore:0 } })),
        ]);
        setStats({
          applications: apps.total || 0,
          savedJobs:    saved.count || 0,
          empScore:     emp.history?.[0]?.totalScore || 0,
          profilePct:   profile.profile?.completenessScore || 0,
        });
        setRecent(apps.applications?.slice(0,5) || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const STATUS_COLOR = { applied:'#6366f1', reviewed:'#06b6d4', shortlisted:'#f59e0b', interview:'#8b5cf6', hired:'#10b981', rejected:'#ef4444' };

  const KPI_CARDS = [
    { icon:'fa-chart-bar',     label:'Employability Score', value: stats.empScore ? `${stats.empScore}/1000` : 'Not calculated', color:'#f59e0b', view:'employability', action:'Calculate' },
    { icon:'fa-paper-plane',   label:'Total Applications',  value: stats.applications, color:'#6366f1', view:'applied' },
    { icon:'fa-bookmark',      label:'Saved Jobs',          value: stats.savedJobs,    color:'#10b981', view:'saved'   },
    { icon:'fa-id-card',       label:'Profile Complete',    value: `${stats.profilePct}%`, color:'#8b5cf6', view:'profile', action: stats.profilePct < 80 ? 'Complete Profile' : null },
  ];

  const AI_SHORTCUTS = [
    { icon:'fa-dna',           label:'Career Digital Twin', view:'twin',         color:'#8b5cf6', desc:'See your future career paths' },
    { icon:'fa-brain',         label:'Resume Intelligence', view:'resume',       color:'#6366f1', desc:'Analyze, skill gap, roadmap'   },
    { icon:'fa-rocket',        label:'Escape Velocity',     view:'escape',       color:'#ef4444', desc:'Break into high-growth careers' },
    { icon:'fa-satellite-dish',label:'Skill Demand Radar',  view:'radar',        color:'#10b981', desc:'See what skills India needs'   },
    { icon:'fa-lightbulb',     label:'Career Insights',     view:'insights',     color:'#f59e0b', desc:'AI-driven career intelligence' },
    { icon:'fa-globe-asia',    label:'Market Trends',       view:'market',       color:'#06b6d4', desc:'Workforce intelligence'        },
  ];

  return (
    <div className="ov2-container">
      <div className="ov2-welcome">
        <div>
          <h2>Welcome back, {user?.fullName?.split(' ')[0]} </h2>
          <p>Your AI Career Intelligence Operating System is ready.</p>
        </div>
        <div className="ov2-welcome-actions">
          <button className="ov2-action-btn primary" onClick={() => onNavigate('insights')}>
            <i className="fas fa-lightbulb" /> Get AI Insights
          </button>
          <button className="ov2-action-btn secondary" onClick={() => onNavigate('matches')}>
            <i className="fas fa-magic" /> Smart Matches
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ov2-kpi-grid">
        {KPI_CARDS.map((card, i) => (
          <div key={i} className="ov2-kpi-card" onClick={() => onNavigate(card.view)} style={{ cursor:'pointer' }}>
            <div className="ov2-kpi-icon" style={{ color:card.color, background:card.color+'15' }}>
              <i className={`fas ${card.icon}`} />
            </div>
            <div className="ov2-kpi-body">
              <div className="ov2-kpi-value" style={{ color:card.color }}>{loading ? '…' : card.value}</div>
              <div className="ov2-kpi-label">{card.label}</div>
            </div>
            {card.action && <div className="ov2-kpi-action" style={{ color:card.color }}>{card.action} →</div>}
          </div>
        ))}
      </div>

      {/* AI Intelligence Grid */}
      <div className="ov2-section-title"><i className="fas fa-robot" style={{ color:'#6366f1' }} /> AI Intelligence Suite</div>
      <div className="ov2-ai-grid">
        {AI_SHORTCUTS.map((item, i) => (
          <div key={i} className="ov2-ai-card" onClick={() => onNavigate(item.view)}>
            <div className="ov2-ai-icon" style={{ color:item.color, background:item.color+'15' }}><i className={`fas ${item.icon}`} /></div>
            <div className="ov2-ai-info">
              <div className="ov2-ai-label">{item.label}</div>
              <div className="ov2-ai-desc">{item.desc}</div>
            </div>
            <i className="fas fa-arrow-right" style={{ color:'#9ca3af' }} />
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="ov2-section-title" style={{ marginTop:'2rem' }}><i className="fas fa-paper-plane" style={{ color:'#6366f1' }} /> Recent Applications</div>
      {loading ? <div className="cdt-loading" style={{ minHeight:80 }}><i className="fas fa-spinner fa-pulse" /></div>
      : recentApps.length === 0 ? (
        <div className="ov2-empty"><i className="fas fa-paper-plane" /><span>No applications yet. </span><button className="ov2-link-btn" onClick={() => onNavigate('jobs')}>Browse Jobs →</button></div>
      ) : (
        <div className="ov2-app-list">
          {recentApps.map((app, i) => (
            <div key={i} className="ov2-app-item">
              <div className="ov2-app-info">
                <span className="ov2-app-title">{app.job?.title || 'Job'}</span>
                <span className="ov2-app-company">{app.job?.company}</span>
              </div>
              <span className="ov2-app-status" style={{ background: STATUS_COLOR[app.status]+'20', color: STATUS_COLOR[app.status] }}>{app.status}</span>
              <span className="ov2-app-date">{new Date(app.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          ))}
          <button className="ov2-link-btn" onClick={() => onNavigate('applied')} style={{ marginTop:'0.75rem' }}>View all applications →</button>
        </div>
      )}
    </div>
  );
}

// ── Inline: Jobs Tab ──────────────────────────────────────────
function JobsTab({ onApply }) {
  const { user } = useAuth();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ keyword:'', location:'', jobType:'', page:1 });
  const [total,   setTotal]   = useState(0);
  const [saved,   setSaved]   = useState(new Set());
  const { toast, showToast }  = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v));
      const res = await JobService.getJobs(params);
      setJobs(res.jobs || []); setTotal(res.total || 0);
      const s = await UserService.getSavedJobs();
      setSaved(new Set((s.savedJobs||[]).map(j => j._id)));
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const toggleSave = async (jobId) => {
    try {
      const res = await UserService.toggleSaveJob(jobId);
      setSaved(p => { const n = new Set(p); res.saved ? n.add(jobId) : n.delete(jobId); return n; });
      showToast(res.saved ? 'Job saved!' : 'Job removed from saved');
    } catch {}
  };

  return (
    <div className="jobs-tab">
      <Toast toast={toast} />
      <div className="jobs-filters">
        <input type="text" placeholder="Search jobs, companies…" value={filters.keyword} onChange={e => setFilters(p => ({...p, keyword:e.target.value, page:1}))} className="jobs-search" />
        <input type="text" placeholder="Location" value={filters.location} onChange={e => setFilters(p => ({...p, location:e.target.value, page:1}))} className="jobs-location" />
        <select value={filters.jobType} onChange={e => setFilters(p => ({...p, jobType:e.target.value, page:1}))}>
          <option value="">All Types</option>
          {['fulltime','parttime','internship','contract','remote'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
      </div>
      <p className="jobs-count">{total} jobs found</p>
      {loading ? <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading jobs…</div>
      : jobs.length === 0 ? <div className="empty-state"><i className="fas fa-briefcase" /><p>No jobs found. Try adjusting your filters.</p></div>
      : <div className="jobs-grid">
          {jobs.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-card-top">
                <div><h3 className="job-title">{job.title}</h3><p className="job-company">{job.company}</p></div>
                <button className={`save-btn${saved.has(job._id)?' saved':''}`} onClick={() => toggleSave(job._id)}><i className={`fa${saved.has(job._id)?'s':'r'} fa-bookmark`} /></button>
              </div>
              <div className="job-meta"><span><i className="fas fa-map-marker-alt" /> {job.location}</span><span><i className="fas fa-briefcase" /> {job.jobType}</span>{job.salaryDisplay&&job.salaryDisplay!=='Not specified'&&<span><i className="fas fa-rupee-sign" /> {job.salaryDisplay}</span>}</div>
              <p className="job-desc">{job.description?.slice(0,120)}…</p>
              <div className="job-actions">
                <span className="job-date">{new Date(job.createdAt).toLocaleDateString('en-IN')}</span>
                <button className="apply-btn" onClick={() => onApply(job)}>Apply Now</button>
              </div>
            </div>
          ))}
        </div>}
      {total > 12 && (
        <div className="jobs-pagination">
          <button disabled={filters.page <= 1} onClick={() => setFilters(p=>({...p,page:p.page-1}))}>← Prev</button>
          <span>Page {filters.page}</span>
          <button disabled={jobs.length < 12} onClick={() => setFilters(p=>({...p,page:p.page+1}))}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Inline: Applications Tab ──────────────────────────────────
function AppliedTab() {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const { showToast, toast }  = useToast();

  const load = async (p = 1) => {
    setLoading(true);
    try { const res = await ApplicationService.getMyApplications({ page:p, limit:10 }); setApps(res.applications||[]); setTotal(res.total||0); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(page); }, [page]);

  const withdraw = async (appId) => {
    if (!window.confirm('Withdraw this application?')) return;
    try { await ApplicationService.withdraw(appId); showToast('Application withdrawn'); load(page); }
    catch (err) { showToast(err.message || 'Failed'); }
  };

  const STATUS_COLOR = { applied:'#6366f1', reviewed:'#06b6d4', shortlisted:'#f59e0b', interview:'#8b5cf6', hired:'#10b981', rejected:'#ef4444' };

  return (
    <div className="applied-tab">
      <Toast toast={toast} />
      <div className="applied-header"><h3>My Applications ({total})</h3></div>
      {loading ? <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /> Loading…</div>
      : apps.length === 0 ? <div className="empty-state"><i className="fas fa-paper-plane" /><p>No applications yet. Start browsing jobs!</p></div>
      : <div className="applied-list">
          {apps.map(app => (
            <div key={app._id} className="applied-card">
              <div className="applied-info">
                <span className="applied-title">{app.job?.title || 'Job'}</span>
                <span className="applied-company">{app.job?.company} · {app.job?.location}</span>
                <span className="applied-date">Applied {new Date(app.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="applied-right">
                <span className="applied-status" style={{ background: STATUS_COLOR[app.status]+'20', color: STATUS_COLOR[app.status] }}>{app.status}</span>
                {app.status === 'applied' && <button className="withdraw-btn" onClick={() => withdraw(app._id)}>Withdraw</button>}
              </div>
            </div>
          ))}
        </div>}
      {total > 10 && <div className="jobs-pagination"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</button><span>Page {page}</span><button disabled={apps.length<10} onClick={()=>setPage(p=>p+1)}>Next →</button></div>}
    </div>
  );
}

// ── Inline: Saved Jobs Tab ────────────────────────────────────
function SavedTab() {
  const [saved,   setSaved]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, toast }  = useToast();

  useEffect(() => { UserService.getSavedJobs().then(r=>setSaved(r.savedJobs||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  const remove = async (jobId) => {
    try { await UserService.toggleSaveJob(jobId); setSaved(p=>p.filter(j=>j._id!==jobId)); showToast('Job removed'); }
    catch {}
  };

  return (
    <div className="saved-tab">
      <Toast toast={toast} />
      <h3>Saved Jobs ({saved.length})</h3>
      {loading ? <div className="cdt-loading"><i className="fas fa-spinner fa-pulse" /></div>
      : saved.length === 0 ? <div className="empty-state"><i className="fas fa-bookmark" /><p>No saved jobs yet. Browse jobs and bookmark the ones you like.</p></div>
      : <div className="jobs-grid">
          {saved.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-card-top"><div><h3 className="job-title">{job.title}</h3><p className="job-company">{job.company}</p></div><button className="save-btn saved" onClick={()=>remove(job._id)}><i className="fas fa-bookmark" /></button></div>
              <div className="job-meta"><span><i className="fas fa-map-marker-alt" /> {job.location}</span><span><i className="fas fa-briefcase" /> {job.jobType}</span></div>
              <span className="score-badge" style={{ background:'#6366f120',color:'#6366f1',display:'inline-block',marginTop:'0.5rem' }}>{job.category}</span>
            </div>
          ))}
        </div>}
    </div>
  );
}

// ── Apply Modal ───────────────────────────────────────────────
function ApplyModal({ job, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await ApplicationService.apply(job._id, { coverLetter });
      onSuccess(`Applied to ${job.title}!`);
      onClose();
    } catch (err) { setError(err.message || 'Application failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Apply: {job.title}</h3><button className="modal-close" onClick={onClose}>×</button></div>
        <p style={{ color:'#6b7280', marginBottom:'1rem' }}>{job.company} · {job.location}</p>
        <div className="prf-field"><label>Cover Letter (optional)</label><textarea rows={5} placeholder="Write a brief cover letter…" value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} /></div>
        {error && <div className="ra-error" style={{ marginBottom:'0.75rem' }}><i className="fas fa-exclamation-circle" /> {error}</div>}
        <div className="modal-actions">
          <button className="ra-new-btn" onClick={onClose}>Cancel</button>
          <button className="apply-btn" onClick={submit} disabled={loading}>{loading ? <><i className="fas fa-spinner fa-pulse" /> Applying…</> : 'Submit Application'}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════
export default function JobseekerDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { toast, showToast } = useToast();

  const [view,      setView]      = useState('overview');
  const [sideOpen,  setSideOpen]  = useState(false);
  const [applyJob,  setApplyJob]  = useState(null);
  const [darkMode,  setDarkMode]  = useState(() => localStorage.getItem('tt_dark') === 'true');

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('tt_dark', darkMode);
  }, [darkMode]);

  const handleLogout = () => { logout(); navigate('/'); };

  const renderContent = () => {
    switch (view) {
      case 'overview':     return <OverviewTab user={user} onNavigate={setView} />;
      case 'twin':         return <CareerDigitalTwin />;
      case 'jobs':         return <JobsTab onApply={setApplyJob} />;
      case 'applied':      return <AppliedTab />;
      case 'saved':        return <SavedTab />;
      case 'matches':      return <SmartJobMatches />;
      case 'ai':           return <AIAssistant />;
      case 'resume':       return <ResumeIntelligence />;
      case 'employability':return <EmployabilityScoreTab />;
      case 'escape':       return <CareerEscapeVelocity />;
      case 'radar':        return <SkillDemandRadar />;
      case 'analytics':    return <Analytics />;
      case 'insights':     return <CareerInsights />;
      case 'market':       return <MarketTrends />;
      case 'achievements': return <Achievements />;
      case 'settings':     return <Settings />;
      case 'profile':      return <ProfilePage />;
      default:             return <OverviewTab user={user} onNavigate={setView} />;
    }
  };

  const navigate2 = (v) => { setView(v); setSideOpen(false); };

  return (
    <div className={`dash-root${darkMode ? ' dark' : ''}`}>
      <Toast toast={toast} />

      {/* Sidebar */}
      <aside className={`dash-sidebar${sideOpen ? ' open' : ''}`}>
        <div className="dash-logo">
          <span className="dash-logo-text">TalentTrack <span className="dash-logo-ai"></span></span>
        </div>

        <nav className="dash-nav">
          {NAV.map(section => (
            <div key={section.group} className="dash-nav-group">
              <div className="dash-nav-group-label">{section.group}</div>
              {section.items.map(item => (
                <button key={item.view} className={`dash-nav-item${view === item.view ? ' active' : ''}`} onClick={() => navigate2(item.view)}>
                  <i className={`fas ${item.icon}`} />
                  <span>{item.label}</span>
                  {item.badge && <span className="dash-nav-badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-mini">
            <div className="dash-user-avatar">{user?.fullName?.[0]?.toUpperCase() || 'U'}</div>
            <div className="dash-user-info"><div className="dash-user-name">{user?.fullName?.split(' ')[0]}</div><div className="dash-user-role">Job Seeker</div></div>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt" /></button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sideOpen && <div className="dash-overlay" onClick={() => setSideOpen(false)} />}

      {/* Main */}
      <main className="dash-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <button className="dash-hamburger" onClick={() => setSideOpen(p => !p)}><i className={`fas fa-${sideOpen ? 'times' : 'bars'}`} /></button>
          <div className="dash-topbar-title">{NAV.flatMap(s => s.items).find(i => i.view === view)?.label || 'Dashboard'}</div>
          <div className="dash-topbar-actions">
            <button className="dash-avatar-btn" onClick={() => navigate2('profile')}>
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">
          {renderContent()}
        </div>
      </main>

      {/* Apply Modal */}
      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onSuccess={msg => { showToast(msg); setApplyJob(null); }} />}

      
    </div>
  );
}
