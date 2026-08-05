// src/pages/dashboard/RecruiterDashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { JobService, ApplicationService, UserService } from '../../services/services.js';
import { useToast } from '../../hooks/useToast.js';


// ── Status badge ──────────────────────────────────────────────
const STATUS_CLS = {
  applied:'status-applied', reviewed:'status-reviewed', shortlisted:'status-shortlisted',
  interview:'status-interview', rejected:'status-rejected', hired:'status-hired',
};

const JOB_STATUSES = ['applied','reviewed','shortlisted','interview','rejected','hired'];

// ── Blank job form ────────────────────────────────────────────
const BLANK_JOB = {
  title:'', company:'', location:'', description:'', requirements:'',
  salaryMin:'', salaryMax:'', salaryDisplay:'', category:'other',
  jobType:'fulltime', experienceLevel:'any', applyUrl:'', isActive:true,
};

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [dark,        setDark]        = useState(() => localStorage.getItem('rdb_dark') === 'true');
  const [view,        setView]        = useState('dashboard');
  const [mobileMenu,  setMobileMenu]  = useState(false);

  const [myJobs,      setMyJobs]      = useState(null);
  const [allApps,     setAllApps]     = useState(null); // all applications across all jobs
  const [jobAppsMap,  setJobAppsMap]  = useState({});   // jobId → apps[]

  // Toggle dark mode
  useEffect(() => {
    localStorage.setItem('rdb_dark', dark);
    document.documentElement.setAttribute('data-rdb-dark', dark ? 'true' : 'false');
  }, [dark]);

  const loadMyJobs = useCallback(async () => {
    const res = await JobService.getMyJobs();
    const list = Array.isArray(res.jobs) ? res.jobs : [];
    setMyJobs(list);
    return list;
  }, []);

  const loadAppsForJob = useCallback(async (jobId) => {
    if (jobAppsMap[jobId]) return jobAppsMap[jobId];
    try {
      const res = await ApplicationService.getApplicants(jobId);
      const list = Array.isArray(res.applications) ? res.applications : [];
      setJobAppsMap(p => ({ ...p, [jobId]: list }));
      return list;
    } catch { return []; }
  }, [jobAppsMap]);

  const loadAllApps = useCallback(async (jobs) => {
    const jobList = jobs || myJobs;
    if (!jobList) return;
    const results = await Promise.all(jobList.map(j => loadAppsForJob(j._id)));
    const flat = results.flat();
    setAllApps(flat);
    return flat;
  }, [myJobs, loadAppsForJob]);

  const handleLogout = () => { logout(); navigate('/'); };
  const navTo = (v) => { setView(v); setMobileMenu(false); };

  const NAV_ITEMS = [
    { v:'dashboard',    icon:'fa-chart-pie',      label:'Dashboard' },
    { v:'post-job',     icon:'fa-plus-circle',    label:'Post a Job' },
    { v:'manage-jobs',  icon:'fa-briefcase',      label:'Manage Jobs' },
    { v:'applicants',   icon:'fa-users',          label:'All Applicants' },
    { v:'pipeline',     icon:'fa-columns',        label:'Hiring Pipeline' },
    { v:'talent',       icon:'fa-search',         label:'Talent Search' },
    { v:'company',      icon:'fa-building',       label:'Company Profile' },
  ];

  return (
    <div className={`rdb-body${dark ? ' dark' : ''}`}>
      {/* Navbar */}
      <nav className="rdb-navbar">
        <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'var(--muted)' }}
          onClick={() => setMobileMenu(p => !p)}>
          <i className="fas fa-bars" />
        </button>
        <div className="rdb-logo">TalentTrack </div>
        <ul className="rdb-nav-links" style={{ display:'flex', gap:'0.2rem' }}>
          
        </ul>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
          <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--muted)' }}>
            {user?.fullName?.split(' ')[0]}
          </span>
         
          <button className="rdb-btn rdb-btn-danger rdb-btn-sm" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </nav>

      <div className="rdb-wrapper">
        {/* Sidebar */}
        <aside className="rdb-sidebar" style={{ display: mobileMenu ? 'block' : undefined }}>
          <ul className="rdb-sidebar-nav">
            <li className="rdb-sidebar-label">Menu</li>
            {NAV_ITEMS.map(n => (
              <li key={n.v}>
                <a className={view===n.v?'active':''} onClick={() => navTo(n.v)}>
                  <i className={`fas ${n.icon}`} /> {n.label}
                </a>
              </li>
            ))}
            <li className="rdb-sidebar-label" style={{ marginTop:'1rem' }}>Quick Links</li>
            <li><Link to="/" className="rdb-sidebar-nav a" style={{ display:'flex', alignItems:'center', gap:10, padding:'0.65rem 0.75rem', borderRadius:10, textDecoration:'none', color:'var(--muted)', fontSize:'0.875rem', fontWeight:500 }}>
              <i className="fas fa-globe" /> Home Page
            </Link></li>
          </ul>
        </aside>

        {/* Main */}
        <main className="rdb-main" onClick={() => setMobileMenu(false)}>
          {view === 'dashboard'   && <DashboardView  user={user} myJobs={myJobs} allApps={allApps} loadMyJobs={loadMyJobs} loadAllApps={loadAllApps} navTo={navTo} />}
          {view === 'post-job'    && <PostJobView    user={user} onPosted={() => { setMyJobs(null); navTo('manage-jobs'); showToast('✅ Job posted!'); }} showToast={showToast} />}
          {view === 'manage-jobs' && <ManageJobsView myJobs={myJobs} loadMyJobs={loadMyJobs} showToast={showToast} />}
          {view === 'applicants'  && <ApplicantsView myJobs={myJobs} loadMyJobs={loadMyJobs} loadAppsForJob={loadAppsForJob} showToast={showToast} />}
          {view === 'pipeline'    && <PipelineView   myJobs={myJobs} loadMyJobs={loadMyJobs} loadAppsForJob={loadAppsForJob} />}
          {view === 'talent'      && <TalentView     myJobs={myJobs} loadMyJobs={loadMyJobs} loadAppsForJob={loadAppsForJob} />}
          {view === 'company'     && <CompanyView    user={user} showToast={showToast} />}
        </main>
      </div>

      {toast && <div className={`rdb-toast${toast.type === 'error' ? ' error' : ''}`}>{toast.msg}</div>}

    </div>
  );
}

// ── Dashboard overview ────────────────────────────────────────
function DashboardView({ user, myJobs, allApps, loadMyJobs, loadAllApps, navTo }) {
  const [loading, setLoading] = useState(!myJobs);
  const [jobs, setJobs]       = useState(myJobs || []);
  const [apps, setApps]       = useState(allApps || []);

  useEffect(() => {
    (async () => {
      const j = myJobs || await loadMyJobs();
      setJobs(j);
      const a = allApps || await loadAllApps(j);
      setApps(a || []); setLoading(false);
    })();
  }, []);

  const activeJobs  = jobs.filter(j => j.isActive).length;
  const totalApps   = apps.length;
  const interviews  = apps.filter(a => a.status === 'interview').length;
  const hired       = apps.filter(a => a.status === 'hired').length;

  if (loading) return <RdbSkeleton />;

  return (
    <>
      <div className="rdb-page-header">
        <div><h2>Dashboard</h2><p>Welcome back, {user?.fullName?.split(' ')[0]}! Here's your hiring overview.</p></div>
        <button className="rdb-btn rdb-btn-primary" onClick={() => navTo('post-job')}>
          <i className="fas fa-plus" /> Post New Job
        </button>
      </div>

      <div className="rdb-cards-grid">
        {[
          { label:'Active Jobs',     val:activeJobs,  icon:'fa-briefcase',      cls:'blue' },
          { label:'Total Applicants',val:totalApps,   icon:'fa-users',          cls:'green' },
          { label:'Interviews',      val:interviews,  icon:'fa-calendar-check', cls:'purple' },
          { label:'Hired',           val:hired,       icon:'fa-handshake',      cls:'amber' },
        ].map(c => (
          <div className="rdb-stat-card" key={c.label}>
            <div className={`rdb-stat-icon ${c.cls}`}><i className={`fas ${c.icon}`} /></div>
            <div className="rdb-stat-info"><h3>{c.val}</h3><p>{c.label}</p></div>
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="rdb-panel">
        <div className="rdb-panel-header">
          <h3>Your Recent Job Postings</h3>
          <button className="rdb-btn rdb-btn-ghost rdb-btn-sm" onClick={() => navTo('manage-jobs')}>
            View all
          </button>
        </div>
        <div>
          {jobs.length === 0 ? (
            <div className="rdb-empty"><i className="fas fa-briefcase" /><h4>No jobs posted yet</h4></div>
          ) : jobs.slice(0,5).map(j => (
            <div className="rdb-job-item" key={j._id}>
              <div className="rdb-job-info">
                <strong>{j.title}</strong>
                <div className="rdb-job-meta">
                  <span><i className="fas fa-map-marker-alt" /> {j.location}</span>
                  <span><i className="fas fa-users" /> {j.applicationCount || 0} applicants</span>
                  <span className={`badge-status ${j.isActive ? 'status-active' : 'status-inactive'}`}>{j.isActive ? 'Active' : 'Closed'}</span>
                </div>
              </div>
              <button className="rdb-btn rdb-btn-ghost rdb-btn-sm" onClick={() => navTo('applicants')}>
                <i className="fas fa-users" /> View Applicants
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Post Job ──────────────────────────────────────────────────
function PostJobView({ user, onPosted, showToast }) {
  const [form, setForm]       = useState({ ...BLANK_JOB, company: user?.companyName || '' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim())       errs.title = 'Required';
    if (!form.company.trim())     errs.company = 'Required';
    if (!form.location.trim())    errs.location = 'Required';
    if (form.description.trim().length < 50) errs.description = 'At least 50 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.salaryMin) payload.salaryMin = Number(payload.salaryMin);
      if (payload.salaryMax) payload.salaryMax = Number(payload.salaryMax);
      await JobService.createJob(payload);
      onPosted();
    } catch (err) { showToast(err.message || 'Failed to post job'); }
    finally { setLoading(false); }
  };

  const field = (label, key, type='text', placeholder='', required=false) => (
    <div className="rdb-form-group">
      <label>{label}{required && ' *'}</label>
      <input type={type} placeholder={placeholder} value={form[key]}
        onChange={e => set(key, e.target.value)} />
      {errors[key] && <span style={{ color:'var(--danger)', fontSize:'0.78rem' }}>{errors[key]}</span>}
    </div>
  );

  return (
    <>
      <div className="rdb-page-header"><div><h2>Post a New Job</h2><p>Fill in the details below to create a listing.</p></div></div>
      <div className="rdb-panel">
        <div className="rdb-panel-body">
          <form onSubmit={handleSubmit}>
            <div className="rdb-form-grid">
              {field('Job Title', 'title', 'text', 'e.g. Senior React Developer', true)}
              {field('Company', 'company', 'text', 'Your company name', true)}
              <div className="full">{field('Location', 'location', 'text', 'e.g. San Francisco, CA / Remote', true)}</div>
              <div className="full rdb-form-group">
                <label>Job Description * <span style={{ fontWeight:400, color:'var(--muted)' }}>(min 50 chars)</span></label>
                <textarea rows={5} placeholder="Describe the role, responsibilities, and what you're looking for…"
                  value={form.description} onChange={e => set('description', e.target.value)} />
                {errors.description && <span style={{ color:'var(--danger)', fontSize:'0.78rem' }}>{errors.description}</span>}
              </div>
              <div className="full rdb-form-group">
                <label>Requirements</label>
                <textarea rows={3} placeholder="List key skills and qualifications…"
                  value={form.requirements} onChange={e => set('requirements', e.target.value)} />
              </div>
              {field('Salary Min', 'salaryMin', 'number', '80000')}
              {field('Salary Max', 'salaryMax', 'number', '120000')}
              <div className="full">{field('Salary Display', 'salaryDisplay', 'text', 'e.g. $80k - $120k or Competitive')}</div>
              <div className="rdb-form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {['tech','finance','marketing','design','sales','hr','operations','other'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="rdb-form-group">
                <label>Job Type</label>
                <select value={form.jobType} onChange={e => set('jobType', e.target.value)}>
                  {['fulltime','parttime','internship','contract','remote'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="rdb-form-group">
                <label>Experience Level</label>
                <select value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)}>
                  {['entry','mid','senior','lead','any'].map(l => (
                    <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>
                  ))}
                </select>
              </div>
              {field('External Apply URL (optional)', 'applyUrl', 'url', 'https://…')}
            </div>
            <div style={{ marginTop:'1.25rem', display:'flex', gap:'0.75rem' }}>
              <button type="submit" className="rdb-btn rdb-btn-primary" disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-pulse" /> Posting…</> : <><i className="fas fa-plus" /> Post Job</>}
              </button>
              <button type="button" className="rdb-btn rdb-btn-ghost" onClick={() => setForm({ ...BLANK_JOB, company: user?.companyName || '' })}>
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Manage Jobs ───────────────────────────────────────────────
function ManageJobsView({ myJobs, loadMyJobs, showToast }) {
  const [loading,   setLoading]   = useState(!myJobs);
  const [jobs,      setJobs]      = useState(myJobs || []);
  const [search,    setSearch]    = useState('');
  const [editJob,   setEditJob]   = useState(null);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!myJobs) loadMyJobs().then(j => { setJobs(j); setLoading(false); });
    else setLoading(false);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this job and all its applications?')) return;
    try {
      await JobService.deleteJob(id);
      const updated = await loadMyJobs();
      setJobs(updated);
      showToast('Job deleted.');
    } catch (err) { showToast(err.message); }
  };

  const handleToggle = async (job) => {
    try {
      await JobService.updateJob(job._id, { isActive: !job.isActive });
      const updated = await loadMyJobs();
      setJobs(updated);
      showToast(`Job ${!job.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) { showToast(err.message); }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await JobService.updateJob(editJob._id, editJob);
      const updated = await loadMyJobs();
      setJobs(updated); setEditJob(null);
      showToast('✅ Job updated!');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  };

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.location.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <RdbSkeleton />;

  return (
    <>
      <div className="rdb-page-header"><div><h2>Manage Jobs</h2><p>{jobs.length} job{jobs.length!==1?'s':''} posted</p></div></div>

      <div className="rdb-panel">
        <div className="rdb-filter-row">
          <input type="text" placeholder="Search by title or location…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <div className="rdb-empty"><i className="fas fa-briefcase" /><h4>No jobs found</h4></div>
        ) : filtered.map(j => (
          <div className="rdb-job-item" key={j._id}>
            <div className="rdb-job-info">
              <strong>{j.title}</strong>
              <div className="rdb-job-meta">
                <span>{j.location}</span>
                <span>{j.jobType}</span>
                <span>{j.applicationCount || 0} applicants</span>
                <span className={`badge-status ${j.isActive ? 'status-active' : 'status-inactive'}`}>
                  {j.isActive ? 'Active' : 'Closed'}
                </span>
              </div>
            </div>
            <div className="rdb-job-actions">
              <button className="rdb-btn rdb-btn-ghost rdb-btn-sm" onClick={() => setEditJob({ ...j })}>
                <i className="fas fa-edit" /> Edit
              </button>
              <button className={`rdb-btn rdb-btn-sm ${j.isActive ? 'rdb-btn-warning' : 'rdb-btn-success'}`}
                onClick={() => handleToggle(j)}>
                {j.isActive ? 'Close' : 'Reopen'}
              </button>
              <button className="rdb-btn rdb-btn-danger rdb-btn-sm" onClick={() => handleDelete(j._id)}>
                <i className="fas fa-trash" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editJob && (
        <div className="modal-bg" onClick={e => e.target===e.currentTarget && setEditJob(null)}>
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="modal-head"><h3>Edit Job</h3><button className="modal-x" onClick={() => setEditJob(null)}>×</button></div>
            <div className="modal-body" style={{ maxHeight:'60vh', overflowY:'auto' }}>
              {['title','company','location','salaryDisplay'].map(k => (
                <div key={k}>
                  <label>{k.charAt(0).toUpperCase()+k.slice(1)}</label>
                  <input type="text" value={editJob[k]||''} onChange={e => setEditJob(p => ({ ...p, [k]: e.target.value }))} style={{ width:'100%', marginBottom:'0.5rem', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:10, fontFamily:'inherit' }} />
                </div>
              ))}
              <div>
                <label>Description</label>
                <textarea rows={4} value={editJob.description||''} onChange={e => setEditJob(p => ({ ...p, description: e.target.value }))}
                  style={{ width:'100%', padding:'0.5rem 0.75rem', border:'1.5px solid #e2e8f0', borderRadius:10, fontFamily:'inherit' }} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setEditJob(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── All Applicants ────────────────────────────────────────────
function ApplicantsView({ myJobs, loadMyJobs, loadAppsForJob, showToast }) {
  const [loading,    setLoading]    = useState(true);
  const [jobs,       setJobs]       = useState(myJobs || []);
  const [selectedJob,setSelectedJob]= useState('');
  const [apps,       setApps]       = useState([]);
  const [loadingApps,setLoadingApps]= useState(false);

  useEffect(() => {
    if (!myJobs) {
      loadMyJobs().then(j => { setJobs(j); setLoading(false); if (j.length) { setSelectedJob(j[0]._id); loadApp(j[0]._id); } });
    } else { setLoading(false); if (myJobs.length) { setSelectedJob(myJobs[0]._id); loadApp(myJobs[0]._id); } }
  }, []);

  const loadApp = async (jobId) => {
    setLoadingApps(true);
    const list = await loadAppsForJob(jobId);
    setApps(list); setLoadingApps(false);
  };

  const handleJobChange = (id) => { setSelectedJob(id); loadApp(id); };

  const handleStatusChange = async (appId, status) => {
    try {
      await ApplicationService.updateStatus(appId, status);
      setApps(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      showToast('Status updated.');
    } catch (err) { showToast(err.message); }
  };

  if (loading) return <RdbSkeleton />;

  return (
    <>
      <div className="rdb-page-header"><div><h2>All Applicants</h2><p>Review and manage applications for your jobs.</p></div></div>
      {jobs.length === 0 ? (
        <div className="rdb-empty"><i className="fas fa-users" /><h4>No jobs yet</h4><p>Post a job to start receiving applications.</p></div>
      ) : (
        <>
          <div className="rdb-panel" style={{ marginBottom:'1rem' }}>
            <div className="rdb-panel-body" style={{ padding:'0.75rem 1.25rem' }}>
              <label style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--muted)', marginRight:'0.75rem' }}>Select Job:</label>
              <select value={selectedJob} onChange={e => handleJobChange(e.target.value)}
                style={{ border:'1.5px solid var(--border)', borderRadius:10, padding:'0.4rem 0.75rem', fontFamily:'inherit', background:'var(--surface2)', color:'var(--text)', fontSize:'0.875rem', outline:'none' }}>
                {jobs.map(j => (
                  <option key={j._id} value={j._id}>{j.title} ({j.applicationCount||0} applicants)</option>
                ))}
              </select>
            </div>
          </div>

          {loadingApps ? <RdbSkeleton /> : apps.length === 0 ? (
            <div className="rdb-empty"><i className="fas fa-inbox" /><h4>No applications yet for this job</h4></div>
          ) : apps.map(a => (
            <div className="rdb-applicant-card" key={a._id}>
              <div>
                <div className="rdb-applicant-name">{a.applicant?.fullName || 'Applicant'}</div>
                <div className="rdb-applicant-meta">
                  <span><i className="fas fa-envelope" /> {a.applicant?.email}</span>
                  {a.applicant?.phone && <span><i className="fas fa-phone" /> {a.applicant.phone}</span>}
                  {a.applicant?.location && <span><i className="fas fa-map-marker-alt" /> {a.applicant.location}</span>}
                  <span>Applied {new Date(a.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                </div>
                {a.coverLetter && (
                  <p className="rdb-cover-preview">
                    "{a.coverLetter.slice(0,120)}{a.coverLetter.length>120?'…':''}"
                  </p>
                )}
                {a.resumeUrl && (
                  <a href={`${import.meta.env.VITE_API_URL||'http://localhost:5000'}${a.resumeUrl}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize:'0.8rem', color:'var(--primary)', display:'inline-flex', alignItems:'center', gap:4, marginTop:6 }}>
                    <i className="fas fa-file-pdf" /> View Resume
                  </a>
                )}
              </div>
              <div className="rdb-applicant-actions">
                <span className={`badge-status ${STATUS_CLS[a.status]||'status-applied'}`}>{a.status}</span>
                <select className="rdb-status-select" value={a.status}
                  onChange={e => handleStatusChange(a._id, e.target.value)}>
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}

// ── Hiring Pipeline (Kanban) ──────────────────────────────────
function PipelineView({ myJobs, loadMyJobs, loadAppsForJob }) {
  const [loading, setLoading] = useState(true);
  const [jobs,    setJobs]    = useState(myJobs || []);
  const [all,     setAll]     = useState([]);

  useEffect(() => {
    (async () => {
      const jList = myJobs || await loadMyJobs();
      setJobs(jList);
      const results = await Promise.all(jList.slice(0,5).map(j => loadAppsForJob(j._id)));
      setAll(results.flat()); setLoading(false);
    })();
  }, []);

  const cols = JOB_STATUSES.map(s => ({
    status: s,
    apps: all.filter(a => a.status === s),
  }));

  const COLORS = { applied:'#2563eb', reviewed:'#d97706', shortlisted:'#7c3aed', interview:'#0891b2', rejected:'#dc2626', hired:'#059669' };

  if (loading) return <RdbSkeleton />;

  return (
    <>
      <div className="rdb-page-header"><div><h2>Hiring Pipeline</h2><p>Kanban view of all candidates across stages.</p></div></div>
      <div className="pipeline-board">
        {cols.map(col => (
          <div className="pipeline-col" key={col.status}>
            <div className="pipeline-col-header">
              <span style={{ color: COLORS[col.status] }}>{col.status.toUpperCase()}</span>
              <span className="pipeline-col-count">{col.apps.length}</span>
            </div>
            <div className="pipeline-col-body">
              {col.apps.length === 0 ? (
                <div style={{ fontSize:'0.78rem', color:'var(--muted)', textAlign:'center', padding:'0.5rem' }}>Empty</div>
              ) : col.apps.map(a => (
                <div className="pipeline-card" key={a._id}>
                  <div className="pc-name">{a.applicant?.fullName || 'Applicant'}</div>
                  <div className="pc-job">{a.job?.title || 'Job'}</div>
                  <div className="pc-date">{new Date(a.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Talent Search ─────────────────────────────────────────────
function TalentView({ myJobs, loadMyJobs, loadAppsForJob }) {
  const [loading, setLoading]  = useState(true);
  const [all,     setAll]      = useState([]);
  const [query,   setQuery]    = useState('');

  useEffect(() => {
    (async () => {
      const jList = myJobs || await loadMyJobs();
      const results = await Promise.all(jList.map(j => loadAppsForJob(j._id)));
      setAll(results.flat()); setLoading(false);
    })();
  }, []);

  const unique = Array.from(
    new Map(all.filter(a => a.applicant).map(a => [a.applicant._id || a.applicant.email, a])).values()
  );

  const filtered = query
    ? unique.filter(a =>
        (a.applicant?.fullName||'').toLowerCase().includes(query.toLowerCase()) ||
        (a.applicant?.email||'').toLowerCase().includes(query.toLowerCase()) ||
        (a.applicant?.location||'').toLowerCase().includes(query.toLowerCase())
      )
    : unique;

  if (loading) return <RdbSkeleton />;

  return (
    <>
      <div className="rdb-page-header"><div><h2>Talent Search</h2><p>Search across all candidates who applied to your jobs.</p></div></div>
      <div className="rdb-panel">
        <div className="rdb-filter-row">
          <input type="text" placeholder="Search by name, email, or location…" value={query}
            onChange={e => setQuery(e.target.value)} />
        </div>
        <div style={{ padding:'0.75rem' }}>
          {filtered.length === 0 ? (
            <div className="rdb-empty"><i className="fas fa-search" /><h4>No candidates found</h4></div>
          ) : filtered.map(a => (
            <div className="talent-card" key={a._id}>
              <div className="talent-avatar">{(a.applicant?.fullName||'?').charAt(0).toUpperCase()}</div>
              <div className="talent-info">
                <div className="t-name">{a.applicant?.fullName || 'Applicant'}</div>
                <div className="t-meta">
                  {a.applicant?.email && <span><i className="fas fa-envelope" /> {a.applicant.email}</span>}
                  {a.applicant?.location && <span style={{ marginLeft:8 }}><i className="fas fa-map-marker-alt" /> {a.applicant.location}</span>}
                </div>
              </div>
              <span className={`badge-status ${STATUS_CLS[a.status]||'status-applied'}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Company Profile ───────────────────────────────────────────
function CompanyView({ user, showToast }) {
  const [form, setForm] = useState({
    fullName:    user?.fullName    || '',
    companyName: user?.companyName || '',
    location:    user?.location    || '',
    phone:       user?.phone       || '',
    bio:         user?.bio         || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await UserService.updateProfile(form);
      showToast('✅ Profile saved!');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="rdb-page-header"><div><h2>Company Profile</h2><p>Update your recruiter details.</p></div></div>
      <div className="rdb-panel">
        <div className="rdb-panel-body">
          <div className="rdb-form-grid">
            {[
              { label:'Full Name',    key:'fullName' },
              { label:'Company Name', key:'companyName' },
              { label:'Location',     key:'location' },
              { label:'Phone',        key:'phone' },
            ].map(f => (
              <div className="rdb-form-group" key={f.key}>
                <label>{f.label}</label>
                <input type="text" value={form[f.key]||''} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} />
              </div>
            ))}
            <div className="rdb-form-group full">
              <label>Bio / About</label>
              <textarea rows={4} value={form.bio||''} onChange={e => setForm(p=>({...p,bio:e.target.value}))} />
            </div>
          </div>
          <button className="rdb-btn rdb-btn-primary" style={{ marginTop:'1rem' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </>
  );
}

function RdbSkeleton() {
  return (
    <>
      <div className="rdb-shimmer rdb-sk-card" style={{ height:22, width:'40%', marginBottom:8 }} />
      <div className="rdb-shimmer rdb-sk-card" style={{ height:14, width:'25%', marginBottom:20 }} />
      {[...Array(3)].map((_,i) => <div key={i} className="rdb-shimmer rdb-sk-row" />)}
    </>
  );
}
