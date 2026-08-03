// src/pages/Home.jsx — v3.0 AI Career Intelligence Platform
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar      from '../components/Navbar.jsx';
import { FooterFull } from '../components/Footer.jsx';
import AIChatbot   from '../components/AIChatbot.jsx';
import { BACKEND_URL } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// ── Animated counter ─────────────────────────────────────────
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = Math.ceil(target / 60);
      const t = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(t); }
        else setCount(start);
      }, 24);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Mini job card for home ────────────────────────────────────
function MiniJobCard({ job }) {
  const navigate = useNavigate();
  const typeColor = { fulltime:'#6366f1', parttime:'#8b5cf6', internship:'#10b981', contract:'#f59e0b', remote:'#06b6d4' };
  const c = typeColor[job.jobType] || '#6366f1';
  return (
    <div className="home-job-card" onClick={() => navigate('/opportunities')}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.6rem' }}>
        <span className="home-job-type" style={{ background: c + '18', color: c }}>{job.jobType}</span>
        <i className="fas fa-arrow-right" style={{ color:'#9ca3af', fontSize:'0.75rem' }} />
      </div>
      <h4 className="home-job-title">{job.title}</h4>
      <p className="home-job-company">{job.company}</p>
      <p className="home-job-location"><i className="fas fa-map-marker-alt" /> {job.location}</p>
      {job.salaryDisplay && job.salaryDisplay !== 'Not specified' && (
        <p className="home-job-salary"><i className="fas fa-rupee-sign" /> {job.salaryDisplay}</p>
      )}
    </div>
  );
}

// ── Career journey step ───────────────────────────────────────
function JourneyStep({ num, label, icon, color, isLast }) {
  return (
    <div className="home-journey-step">
      <div className="home-journey-icon" style={{ background: color + '18', color }}>
        <i className={`fas ${icon}`} />
      </div>
      <div className="home-journey-label">{label}</div>
      {!isLast && <div className="home-journey-arrow"><i className="fas fa-chevron-down" /></div>}
    </div>
  );
}

const JOURNEY_STEPS = [
  { label:'Current Skills',     icon:'fa-user',        color:'#6366f1' },
  { label:'AI Analysis',        icon:'fa-brain',       color:'#8b5cf6' },
  { label:'Career Prediction',  icon:'fa-chart-line',  color:'#10b981' },
  { label:'Skill Gap Detection',icon:'fa-search',      color:'#f59e0b' },
  { label:'Roadmap Generation', icon:'fa-road',        color:'#ef4444' },
  { label:'Opportunity Matching',icon:'fa-magic',      color:'#06b6d4' },
];

const CIOS_FEATURES = [
  { icon:'fa-dna',            title:'Career Digital Twin',  desc:'AI-generated digital representation of your career — current identity and future simulations.',    color:'#8b5cf6', path:'/career-intelligence' },
  { icon:'fa-chart-bar',      title:'Employability Score',  desc:'0-1000 score across 9 dimensions measuring your real-world career readiness.',                    color:'#6366f1', path:'/career-intelligence' },
  { icon:'fa-brain',          title:'Resume Intelligence',  desc:'ATS scoring, skill extraction, keyword analysis, and personalized improvement roadmap.',          color:'#10b981', path:'/career-intelligence' },
  { icon:'fa-rocket',         title:'Escape Velocity',      desc:'Identify transferable skills and discover high-growth career transitions with success probabilities.',color:'#ef4444', path:'/career-intelligence' },
  { icon:'fa-satellite-dish', title:'Skill Demand Radar',   desc:'India\'s national labor market intelligence — emerging skills, city demand, industry health.',   color:'#f59e0b', path:'/career-intelligence' },
  { icon:'fa-globe-asia',     title:'Market Trends',        desc:'Workforce intelligence dashboard with AI forecasts for 6 months, 1 year, 3 years, and 5 years.', color:'#06b6d4', path:'/career-intelligence' },
];

const PROBLEMS = [
  { icon:'fa-puzzle-piece', title:'Skill Mismatch',     desc:'77% of professionals apply to jobs they are not fully qualified for, wasting time and opportunities.', color:'#ef4444' },
  { icon:'fa-question-circle', title:'Career Uncertainty', desc:'Most professionals have no data-driven visibility into which career paths will grow or decline.',    color:'#f59e0b' },
  { icon:'fa-eye-slash',    title:'Hidden Opportunities',desc:'Thousands of emerging roles never appear on traditional job portals. They require proactive discovery.', color:'#8b5cf6' },
  { icon:'fa-industry',     title:'Industry Changes',    desc:'AI and automation are reshaping 65% of existing job functions. Professionals need real-time intelligence.', color:'#6366f1' },
];

const TECH_LAYERS = [
  { icon:'fa-laptop-code', label:'React Frontend',        color:'#06b6d4' },
  { icon:'fa-server',      label:'Node.js + Express API', color:'#10b981' },
  { icon:'fa-database',    label:'MongoDB Atlas',         color:'#6366f1' },
  { icon:'fa-robot',       label:'Gemini / Groq AI',      color:'#8b5cf6' },
  { icon:'fa-cogs',        label:'Recommendation Engine', color:'#f59e0b' },
  { icon:'fa-brain',       label:'Career Intelligence Engine', color:'#ef4444' },
  { icon:'fa-chart-pie',   label:'Analytics Layer',       color:'#06b6d4' },
];

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [homeData, setHomeData] = useState({ featuredJobs: [], latestJobs: [], latestInternships: [] });
  const [loading,  setLoading]  = useState(true);
  const [labForm,  setLabForm]  = useState({ skills:'', role:'', industry:'' });
  const [labResult,setLabResult]= useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/jobs/home?limit=6`)
      .then(r => r.json())
      .then(d => { if (d.success) setHomeData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const runLab = () => {
    if (!labForm.skills.trim()) return;
    // Simulated result — real AI analysis requires login
    setLabResult({
      paths: ['Senior ' + (labForm.role || 'Developer'), 'AI Specialist', 'Tech Lead'],
      gap: labForm.skills.split(',').length < 5 ? 'Medium' : 'Low',
      potential: '₹18–32 LPA',
      probability: Math.floor(Math.random() * 20 + 70) + '%',
    });
  };

  const dashLink = user?.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/jobseeker';

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-content">
          <div className="pub-badge"><i className="fas fa-robot" /> India's First AI Career Intelligence OS</div>
          <h1 className="home-hero-h1">
            AI Career Intelligence<br />
            <span className="gradient-text">For Future-Ready Professionals</span>
          </h1>
          <p className="home-hero-sub">
            Analyze skills, discover opportunities, predict career growth, and build your future using AI-powered career intelligence.
          </p>
          <div className="home-hero-btns">
            {isLoggedIn ? (
              <button className="pub-btn-primary" onClick={() => navigate(dashLink)}>
                <i className="fas fa-th-large" /> Open Dashboard
              </button>
            ) : (
              <button className="pub-btn-primary" onClick={() => navigate('/signup')}>
                <i className="fas fa-rocket" /> Launch Career Intelligence
              </button>
            )}
            <button className="pub-btn-secondary" onClick={() => navigate('/opportunities')}>
              <i className="fas fa-layer-group" /> Explore Opportunities
            </button>
          </div>

          {/* Mini feature badges */}
          <div className="home-hero-features">
            {['Career Digital Twin','Employability Score','Skill Radar','Market Intelligence'].map(f => (
              <span key={f} className="home-hero-feature-badge"><i className="fas fa-check" /> {f}</span>
            ))}
          </div>
        </div>

        {/* Hero visual — dashboard-style preview card */}
        <div className="home-hero-visual">
          <div className="home-hero-card">
            <div className="home-hero-card-header">
              <div className="home-hero-card-dot" style={{ background:'#ef4444' }} />
              <div className="home-hero-card-dot" style={{ background:'#f59e0b' }} />
              <div className="home-hero-card-dot" style={{ background:'#10b981' }} />
              <span style={{ marginLeft:'auto', fontSize:'0.7rem', color:'#94a3b8' }}>TalentTrack AI Dashboard</span>
            </div>
            <div className="home-hero-card-score">
              <div className="home-preview-score">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#6366f1" strokeWidth="8"
                    strokeDasharray="160 201" strokeLinecap="round" transform="rotate(-90 40 40)" />
                  <text x="40" y="45" textAnchor="middle" fontSize="16" fontWeight="800" fill="#6366f1">742</text>
                </svg>
                <div><div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>Employability Score</div><div style={{ color:'#6366f1', fontWeight:700, fontSize:'0.85rem' }}>Strong</div></div>
              </div>
              <div className="home-preview-insights">
                {['🚀 25 new jobs match your profile','📈 Employability +40 this week','💡 AI Engineer — best career path'].map((i, idx) => (
                  <div key={idx} className="home-preview-insight">{i}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ──────────────────────────────── */}
      <section className="pub-section home-problem-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">The Problem</div>
            <h2>Career challenges <span className="gradient-text">professionals face daily</span></h2>
            <p>The traditional approach to careers is broken. TalentTrack fixes it with AI.</p>
          </div>
          <div className="pub-grid-4">
            {PROBLEMS.map(p => (
              <div key={p.title} className="home-problem-card">
                <div className="home-problem-icon" style={{ background: p.color + '18', color: p.color }}>
                  <i className={`fas ${p.icon}`} />
                </div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="home-solution-banner">
            <i className="fas fa-arrow-down" />
            <span>TalentTrack solves all of this with AI Career Intelligence</span>
            <button className="pub-btn-primary" onClick={() => navigate('/career-intelligence')}>See How →</button>
          </div>
        </div>
      </section>

      {/* ── CIOS FEATURE SUITE ───────────────────────────── */}
      <section className="pub-section home-cios-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-robot" /> AI Intelligence Suite</div>
            <h2>Career Intelligence <span className="gradient-text">Operating System</span></h2>
            <p>Six integrated AI modules working together to transform your career journey.</p>
          </div>
          <div className="pub-grid-3">
            {CIOS_FEATURES.map(f => (
              <div key={f.title} className="home-cios-card" onClick={() => navigate(f.path)}>
                <div className="home-cios-icon" style={{ background: f.color + '18', color: f.color }}>
                  <i className={`fas ${f.icon}`} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className="home-cios-cta" style={{ color: f.color }}>Explore → </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAREER JOURNEY SIMULATION ────────────────────── */}
      <section className="pub-section home-journey-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">How It Works</div>
            <h2>Your AI <span className="gradient-text">Career Journey</span></h2>
            <p>From your current skills to your dream career — TalentTrack maps every step.</p>
          </div>
          <div className="home-journey-flow">
            {JOURNEY_STEPS.map((s, i) => (
              <JourneyStep key={s.label} {...s} isLast={i === JOURNEY_STEPS.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── OPPORTUNITY ENGINE ───────────────────────────── */}
      <section className="pub-section home-opp-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-layer-group" /> Unified Opportunity Engine</div>
            <h2>Every opportunity, <span className="gradient-text">in one place</span></h2>
            <p>Jobs, internships, and emerging roles — all from TalentTrack's verified database.</p>
          </div>

          {loading ? (
            <div className="home-jobs-grid">
              {[...Array(6)].map((_, i) => <div key={i} className="home-job-card skeleton"><div className="sk-line sk-title" /></div>)}
            </div>
          ) : homeData.featuredJobs.length === 0 ? (
            <div className="pub-empty-state">
              <i className="fas fa-briefcase" />
              <p>No jobs posted yet. Recruiters are signing up!</p>
            </div>
          ) : (
            <div className="home-jobs-grid">
              {homeData.featuredJobs.slice(0, 6).map(j => <MiniJobCard key={j._id} job={j} />)}
            </div>
          )}

          <div className="home-opp-ctas">
            <button className="pub-btn-primary" onClick={() => navigate('/opportunities?tab=jobs')}>
              <i className="fas fa-briefcase" /> Browse All Jobs
            </button>
            <button className="pub-btn-secondary" onClick={() => navigate('/opportunities?tab=internships')}>
              <i className="fas fa-graduation-cap" /> Explore Internships
            </button>
            <button className="pub-btn-outline" onClick={() => navigate('/opportunities?tab=emerging')}>
              <i className="fas fa-rocket" /> Emerging Roles
            </button>
          </div>
        </div>
      </section>

      {/* ── FUTURE CAREER LABORATORY ─────────────────────── */}
      <section className="pub-section home-lab-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-flask" /> Future Career Laboratory</div>
            <h2>Simulate your <span className="gradient-text">career future</span></h2>
            <p>Enter your current skills and see what AI predicts for your career growth potential.</p>
          </div>

          <div className="home-lab-card">
            <div className="home-lab-form">
              <div className="home-lab-field">
                <label>Your Current Skills</label>
                <input type="text" placeholder="e.g. Python, React, SQL, Machine Learning…"
                  value={labForm.skills} onChange={e => setLabForm(p => ({ ...p, skills: e.target.value }))} />
              </div>
              <div className="home-lab-field">
                <label>Target Role (optional)</label>
                <input type="text" placeholder="e.g. Data Scientist, Full Stack Developer…"
                  value={labForm.role} onChange={e => setLabForm(p => ({ ...p, role: e.target.value }))} />
              </div>
              <div className="home-lab-field">
                <label>Preferred Industry (optional)</label>
                <input type="text" placeholder="e.g. FinTech, HealthTech, Product…"
                  value={labForm.industry} onChange={e => setLabForm(p => ({ ...p, industry: e.target.value }))} />
              </div>
              <button className="pub-btn-primary home-lab-btn" onClick={runLab} disabled={!labForm.skills.trim()}>
                <i className="fas fa-magic" /> Simulate My Career Future
              </button>
              <p className="home-lab-note">Sign up for full AI-powered simulation with salary projections and personalized roadmaps.</p>
            </div>

            <div className="home-lab-result">
              {!labResult ? (
                <div className="home-lab-placeholder">
                  <i className="fas fa-dna" />
                  <p>Enter your skills to see a preview of your career simulation</p>
                </div>
              ) : (
                <div className="home-lab-output">
                  <div className="home-lab-output-header">Preview Results</div>
                  <div className="home-lab-output-item"><span>Predicted Career Paths</span>
                    <div>{labResult.paths.map((p, i) => <span key={i} className="home-lab-tag">{p}</span>)}</div>
                  </div>
                  <div className="home-lab-output-item"><span>Skill Gap Level</span><strong style={{ color:'#f59e0b' }}>{labResult.gap}</strong></div>
                  <div className="home-lab-output-item"><span>Salary Potential</span><strong style={{ color:'#10b981' }}>{labResult.potential}</strong></div>
                  <div className="home-lab-output-item"><span>Success Probability</span><strong style={{ color:'#6366f1' }}>{labResult.probability}</strong></div>
                  <button className="pub-btn-primary" style={{ marginTop:'1rem', width:'100%' }} onClick={() => navigate('/signup')}>
                    Get Full AI Analysis →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY ARCHITECTURE ──────────────────────── */}
      <section className="pub-section home-tech-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">Architecture</div>
            <h2>Production-Grade <span className="gradient-text">Technology Stack</span></h2>
            <p>Built for scale, security, and AI — every layer designed for enterprise-grade performance.</p>
          </div>
          <div className="home-tech-grid">
            {TECH_LAYERS.map(t => (
              <div key={t.label} className="home-tech-card">
                <div className="home-tech-icon" style={{ background: t.color + '18', color: t.color }}>
                  <i className={`fas ${t.icon}`} />
                </div>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
          <div className="home-tech-arch">
            <div className="home-arch-layer" style={{ background:'#6366f118', border:'1px solid #6366f130' }}>
              <strong>Frontend</strong> — React + Vite + Responsive Design
            </div>
            <div className="home-arch-connector"><i className="fas fa-arrows-alt-v" style={{ color:'#6b7280' }} /></div>
            <div className="home-arch-layer" style={{ background:'#10b98118', border:'1px solid #10b98130' }}>
              <strong>Backend API</strong> — Node.js + Express + JWT Auth
            </div>
            <div className="home-arch-connector"><i className="fas fa-arrows-alt-v" style={{ color:'#6b7280' }} /></div>
            <div className="home-arch-layer" style={{ background:'#f59e0b18', border:'1px solid #f59e0b30' }}>
              <strong>AI Layer</strong> — Gemini + Groq + OpenRouter (fallback waterfall)
            </div>
            <div className="home-arch-connector"><i className="fas fa-arrows-alt-v" style={{ color:'#6b7280' }} /></div>
            <div className="home-arch-layer" style={{ background:'#8b5cf618', border:'1px solid #8b5cf630' }}>
              <strong>Database</strong> — MongoDB Atlas + 12 collections
            </div>
          </div>
        </div>
      </section>

      {/* ── IMPACT METRICS ───────────────────────────────── */}
      <section className="pub-section home-metrics-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">Platform Impact</div>
            <h2>Built to <span className="gradient-text">make a difference</span></h2>
          </div>
          <div className="pub-grid-4">
            {[
              { target:16,   suffix:'+', label:'AI Intelligence Features',  icon:'fa-robot',     color:'#6366f1' },
              { target:9,    suffix:'',  label:'Career Intelligence Modules',icon:'fa-brain',     color:'#8b5cf6' },
              { target:5,    suffix:'',  label:'Indian Languages Supported', icon:'fa-language',  color:'#10b981' },
              { target:1000, suffix:'',  label:'Max Employability Score',    icon:'fa-chart-bar', color:'#f59e0b' },
            ].map(m => (
              <div key={m.label} className="home-metric-card">
                <div className="home-metric-icon" style={{ background: m.color + '18', color: m.color }}>
                  <i className={`fas ${m.icon}`} />
                </div>
                <div className="home-metric-value" style={{ color: m.color }}>
                  <Counter target={m.target} suffix={m.suffix} />
                </div>
                <div className="home-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="home-final-cta">
        <div className="pub-container home-cta-inner">
          <h2>Stop searching for jobs.<br /><span className="gradient-text">Start understanding your future.</span></h2>
          <p>Join TalentTrack and unlock India's first AI Career Intelligence Operating System — free for all job seekers.</p>
          <div className="home-hero-btns" style={{ justifyContent:'center' }}>
            {isLoggedIn ? (
              <button className="pub-btn-primary pub-btn-lg" onClick={() => navigate(dashLink)}>
                <i className="fas fa-th-large" /> Open Your Dashboard
              </button>
            ) : (
              <>
                <button className="pub-btn-primary pub-btn-lg" onClick={() => navigate('/signup')}>
                  <i className="fas fa-rocket" /> Get Started Free
                </button>
                <button className="pub-btn-secondary pub-btn-lg" onClick={() => navigate('/career-intelligence')}>
                  <i className="fas fa-brain" /> Explore Intelligence Suite
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <FooterFull />
      <AIChatbot />
    </>
  );
}
