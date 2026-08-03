// src/pages/Opportunities.jsx
// Replaces Jobs.jsx + Internships.jsx
// All data from existing backend APIs — no new endpoints needed
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams }     from 'react-router-dom';
import Navbar            from '../components/Navbar.jsx';
import { FooterSimple }  from '../components/Footer.jsx';
import { Toast }         from '../components/SharedComponents.jsx';
import { useToast }      from '../hooks/useToast.js';
import { JobService, UserService } from '../services/services.js';
import { MarketService } from '../services/api.js';
import { useAuth }       from '../context/AuthContext.jsx';

const CATEGORIES   = ['tech','finance','marketing','design','sales','hr','operations','other'];
const JOB_TYPES    = ['fulltime','parttime','contract','remote'];

// ── Job / Intern card ────────────────────────────────────────
function OpCard({ job, onApply, onSave, saved }) {
  const typeColor = {
    fulltime:'#6366f1', parttime:'#8b5cf6', internship:'#10b981',
    contract:'#f59e0b', remote:'#06b6d4',
  };
  const c = typeColor[job.jobType] || '#6366f1';

  return (
    <div className="opp-card">
      <div className="opp-card-top">
        <div className="opp-card-badge" style={{ background: c + '18', color: c }}>
          {job.jobType}
        </div>
        <button className="opp-save-btn" onClick={() => onSave(job._id)} title="Save job">
          <i className={`${saved ? 'fas' : 'far'} fa-bookmark`} style={{ color: saved ? c : '#9ca3af' }} />
        </button>
      </div>
      <h3 className="opp-card-title">{job.title}</h3>
      <p className="opp-card-company"><i className="fas fa-building" /> {job.company}</p>
      <div className="opp-card-meta">
        <span><i className="fas fa-map-marker-alt" /> {job.location || 'India'}</span>
        {job.category && <span className="opp-card-tag">{job.category}</span>}
        {job.experienceLevel && job.experienceLevel !== 'any' && (
          <span className="opp-card-tag">{job.experienceLevel}</span>
        )}
      </div>
      {job.description && (
        <p className="opp-card-desc">{job.description.slice(0, 100)}…</p>
      )}
      <div className="opp-card-footer">
        <span className="opp-card-salary" style={{ color: job.salaryDisplay && job.salaryDisplay !== 'Not specified' ? '#10b981' : '#9ca3af' }}>
          {job.salaryDisplay && job.salaryDisplay !== 'Not specified' ? `₹ ${job.salaryDisplay}` : 'Competitive'}
        </span>
        <button className="opp-apply-btn" style={{ background: c }} onClick={() => onApply(job._id)}>
          Apply →
        </button>
      </div>
    </div>
  );
}

// ── Emerging role card (from market intelligence) ────────────
function EmergingCard({ career }) {
  const navigate = useNavigate();
  return (
    <div className="opp-card emerging-card">
      <div className="opp-card-top">
        <div className="opp-card-badge" style={{ background: '#8b5cf618', color: '#8b5cf6' }}>Emerging Role</div>
        <span className="opp-growth-tag">↑ {career.growth}</span>
      </div>
      <h3 className="opp-card-title">{career.career}</h3>
      <div className="opp-card-meta">
        <span><i className="fas fa-rupee-sign" /> {career.avgSalary}</span>
        <span className="opp-card-tag">{career.demand}</span>
      </div>
      <p className="opp-card-desc">{career.openings}</p>
      <div className="opp-card-footer">
        <span className="opp-card-salary" style={{ color:'#8b5cf6' }}>Future Opportunity</span>
        <button className="opp-apply-btn" style={{ background:'#8b5cf6' }} onClick={() => navigate('/signup')}>
          Get Ready →
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { key:'jobs',       label:'Jobs',          icon:'fa-briefcase'     },
  { key:'internships',label:'Internships',   icon:'fa-graduation-cap'},
  { key:'emerging',   label:'Emerging Roles',icon:'fa-rocket'        },
];

export default function Opportunities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'jobs';

  const { user, isLoggedIn } = useAuth();
  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  const [tab,        setTab]        = useState(defaultTab);
  const [jobs,       setJobs]       = useState([]);
  const [internships,setInternships]= useState([]);
  const [emerging,   setEmerging]   = useState([]);
  const [savedIds,   setSavedIds]   = useState(new Set());
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);

  // Filters
  const [keyword,  setKeyword]  = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [jobType,  setJobType]  = useState('');

  // ── Fetch jobs ────────────────────────────────────────────
  const fetchJobs = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await JobService.getJobs({ limit: 12, ...params });
      setJobs(res.jobs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      showToast(err.message || 'Failed to load jobs', 'error');
    } finally { setLoading(false); }
  }, []);

  // ── Fetch internships ─────────────────────────────────────
  const fetchInternships = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await JobService.getJobs({ jobType: 'internship', limit: 12, ...params });
      setInternships(res.jobs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      showToast(err.message || 'Failed to load internships', 'error');
    } finally { setLoading(false); }
  }, []);

  // ── Fetch emerging roles from market intelligence ─────────
  const fetchEmerging = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MarketService.getSkillRadar();
      setEmerging(res.fastestGrowingCareers || []);
    } catch {
      setEmerging([]);
    } finally { setLoading(false); }
  }, []);

  // ── Fetch saved jobs ──────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn && user?.role === 'jobseeker') {
      UserService.getSavedJobs()
        .then(r => setSavedIds(new Set((r.savedJobs || []).map(j => j._id))))
        .catch(() => {});
    }
  }, [isLoggedIn]);

  // ── On tab change ─────────────────────────────────────────
  useEffect(() => {
    setPage(1);
    setKeyword(''); setLocation(''); setCategory(''); setJobType('');
    if (tab === 'jobs')        fetchJobs({ page: 1 });
    if (tab === 'internships') fetchInternships({ page: 1 });
    if (tab === 'emerging')    fetchEmerging();
  }, [tab]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const p = { page: 1 };
    if (keyword)  p.keyword  = keyword;
    if (location) p.location = location;
    if (category) p.category = category;
    if (jobType)  p.jobType  = jobType;
    setPage(1);
    tab === 'jobs' ? fetchJobs(p) : fetchInternships({ ...p, jobType: 'internship' });
  };

  const handlePageChange = (p) => {
    setPage(p);
    const params = { page: p };
    if (keyword)  params.keyword  = keyword;
    if (location) params.location = location;
    if (category) params.category = category;
    if (jobType)  params.jobType  = jobType;
    tab === 'jobs' ? fetchJobs(params) : fetchInternships({ ...params, jobType: 'internship' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApply = (jobId) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (user?.role !== 'jobseeker') { showToast('Only jobseekers can apply', 'error'); return; }
    navigate('/dashboard/jobseeker', { state: { openApply: jobId } });
  };

  const handleSave = async (jobId) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (user?.role !== 'jobseeker') { showToast('Only jobseekers can save jobs', 'error'); return; }
    try {
      const res = await UserService.toggleSaveJob(jobId);
      setSavedIds(prev => {
        const next = new Set(prev);
        res.saved ? next.add(jobId) : next.delete(jobId);
        return next;
      });
      showToast(res.saved ? '✅ Job saved!' : 'Job removed from saved list');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const displayList = tab === 'jobs' ? jobs : tab === 'internships' ? internships : emerging;

  return (
    <>
      <Navbar />
      <Toast toast={toast} />

      {/* Hero */}
      <section className="opp-hero">
        <div className="opp-hero-content">
          <div className="pub-badge"><i className="fas fa-layer-group" /> Unified Opportunity Engine</div>
          <h1>Find Your Next <span className="gradient-text">Opportunity</span></h1>
          <p>Jobs, internships, and emerging career paths — all from TalentTrack's verified database.</p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="opp-stats-bar">
        <div className="opp-stat"><i className="fas fa-briefcase" style={{ color:'#6366f1' }} /><span>Live Jobs</span></div>
        <div className="opp-stat-divider" />
        <div className="opp-stat"><i className="fas fa-graduation-cap" style={{ color:'#10b981' }} /><span>Internships</span></div>
        <div className="opp-stat-divider" />
        <div className="opp-stat"><i className="fas fa-rocket" style={{ color:'#8b5cf6' }} /><span>Emerging Roles</span></div>
        <div className="opp-stat-divider" />
        <div className="opp-stat"><i className="fas fa-robot" style={{ color:'#f59e0b' }} /><span>AI Matched</span></div>
      </div>

      {/* Tabs */}
      <div className="opp-tabs-bar">
        <div className="opp-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`opp-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`fas ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & filters (not shown for emerging) */}
      {tab !== 'emerging' && (
        <div className="opp-search-bar">
          <form className="opp-search-inner" onSubmit={handleSearch}>
            <div className="opp-search-field">
              <i className="fas fa-search" />
              <input type="text" placeholder="Role, skill, or keyword…" value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
            <div className="opp-search-field">
              <i className="fas fa-map-marker-alt" />
              <input type="text" placeholder="Location…" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            {tab === 'jobs' && (
              <>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                <select value={jobType} onChange={e => setJobType(e.target.value)}>
                  <option value="">All Types</option>
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </>
            )}
            {tab === 'internships' && (
              <select value={jobType} onChange={e => setJobType(e.target.value)}>
                <option value="">Paid &amp; Unpaid</option>
                <option value="paid">Paid Only</option>
              </select>
            )}
            <button type="submit" className="opp-search-btn">Search</button>
          </form>
        </div>
      )}

      {/* Results */}
      <div className="opp-content">
        {tab !== 'emerging' && (
          <div className="opp-results-header">
            <span>{loading ? 'Loading…' : `${total} ${tab === 'jobs' ? 'jobs' : 'internships'} found`}</span>
            {total > 0 && !loading && <span>Page {page} of {totalPages}</span>}
          </div>
        )}

        {loading ? (
          <div className="opp-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="opp-card skeleton">
                <div className="sk-line sk-title" style={{ marginBottom: 12 }} />
                <div className="sk-line sk-medium" />
                <div className="sk-line sk-short" style={{ marginTop: 12 }} />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="opp-empty">
            <i className={`fas ${TABS.find(t => t.key === tab)?.icon || 'fa-search'}`} />
            <h3>Nothing here yet</h3>
            <p>{tab === 'emerging' ? 'Market data is loading.' : 'Try different keywords or check back soon.'}</p>
          </div>
        ) : tab === 'emerging' ? (
          <div className="opp-grid">
            {emerging.map((c, i) => <EmergingCard key={i} career={c} />)}
          </div>
        ) : (
          <div className="opp-grid">
            {displayList.map(j => (
              <OpCard key={j._id} job={j} onApply={handleApply} onSave={handleSave} saved={savedIds.has(j._id)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && tab !== 'emerging' && (
          <div className="opp-pagination">
            <button disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
              <i className="fas fa-chevron-left" />
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => handlePageChange(p)}>{p}</button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}

        {/* AI recommendations CTA */}
        {!isLoggedIn && (
          <div className="opp-ai-cta">
            <div className="opp-ai-cta-icon"><i className="fas fa-robot" /></div>
            <div>
              <h3>Get AI-Matched Opportunities</h3>
              <p>Sign up to unlock AI-powered job recommendations tailored to your skills and career goals.</p>
            </div>
            <button className="pub-btn-primary" onClick={() => navigate('/signup')}>
              Get Smart Matches →
            </button>
          </div>
        )}
      </div>

      <FooterSimple text="© 2026 TalentTrack — Your unified opportunity ecosystem" />
    </>
  );
}
