// src/pages/CareerIntelligence.jsx — AI capabilities showcase
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar         from '../components/Navbar.jsx';
import { FooterFull } from '../components/Footer.jsx';
import { useAuth }    from '../context/AuthContext.jsx';

const FEATURES = [
  {
    icon:'fa-dna', title:'Career Digital Twin', color:'#8b5cf6',
    tagline:'A living AI model of your career identity',
    desc:'TalentTrack creates an AI-powered digital replica of your career — analyzing your skills, experience, certifications, and interests to show exactly where you stand and where you can go.',
    outputs:['Current Career Health Score','Skill Strength Score','Market Value Estimate','5 career path simulations','Success probability per path','Automation risk assessment'],
  },
  {
    icon:'fa-chart-bar', title:'Employability Score', color:'#6366f1',
    tagline:'A 0–1000 score measuring your real readiness',
    desc:'Unlike simple profile completeness scores, TalentTrack\'s Employability Score measures 9 real career dimensions that employers actually care about — and tells you exactly how to improve each one.',
    outputs:['Resume Quality','Technical Skills','Soft Skills','Certifications','Projects','Experience','Market Demand','Communication','AI Readiness'],
  },
  {
    icon:'fa-brain', title:'Resume Intelligence', color:'#10b981',
    tagline:'Beyond ATS — full career readiness analysis',
    desc:'Upload your resume and get a comprehensive intelligence report combining ATS scoring, skill extraction, keyword gap analysis, certification suggestions, project recommendations, and interview prep topics.',
    outputs:['ATS Score','Overall Score','Career Readiness Score','Missing Keywords','Skill Extraction','Certification Suggestions','Project Suggestions','Interview Prep Topics'],
  },
  {
    icon:'fa-rocket', title:'Career Escape Velocity', color:'#ef4444',
    tagline:'Break free from stagnant careers',
    desc:'Identify your transferable skills and discover data-driven career transitions with success probabilities, estimated timelines, salary growth projections, and specific first steps to take immediately.',
    outputs:['Transferable Skills Detection','4–6 Transition Options','Difficulty Rating','Estimated Timeline','Expected Salary Increase','Success Probability','First 3 Steps'],
  },
  {
    icon:'fa-satellite-dish', title:'Skill Demand Radar', color:'#f59e0b',
    tagline:'India\'s national labor market intelligence',
    desc:'Real-time skill demand intelligence covering emerging skills, declining skills, city-wise demand across 7 major Indian cities, industry health scores, and salary intelligence for 20+ roles.',
    outputs:['Emerging Skills (with growth rate)','Declining Skills','7 City Demand Maps','Industry Health Scores','Salary Intelligence','6-Month Forecast','1/3/5-Year Forecasts'],
  },
  {
    icon:'fa-globe-asia', title:'Market Trends', color:'#06b6d4',
    tagline:'Workforce intelligence for India\'s future',
    desc:'A comprehensive market intelligence dashboard showing the fastest growing industries, technology trends reshaping the workforce, hiring patterns, emerging career opportunities, and AI-powered forecasts.',
    outputs:['Fastest Growing Industries','Fastest Growing Careers','Technology Trends','Hiring Trends','Emerging Opportunities','Salary Benchmarks','Future Workforce Forecasts'],
  },
];

const HOW_IT_WORKS = [
  { step:'01', title:'Build Your Profile',     desc:'Add skills, experience, education, certifications, projects, and career goals.', icon:'fa-user-circle', color:'#6366f1' },
  { step:'02', title:'Upload Your Resume',     desc:'Our AI extracts skills, detects gaps, and scores your resume against ATS systems.', icon:'fa-file-alt', color:'#10b981' },
  { step:'03', title:'Get Your Twin',          desc:'AI generates your Career Digital Twin — your current identity and 5 future paths.', icon:'fa-dna', color:'#8b5cf6' },
  { step:'04', title:'Score Your Readiness',   desc:'Calculate your Employability Score across 9 dimensions with specific improvements.', icon:'fa-chart-bar', color:'#f59e0b' },
  { step:'05', title:'Discover Opportunities', desc:'AI matches you to real TalentTrack jobs with full explainability — no black boxes.', icon:'fa-magic', color:'#ef4444' },
  { step:'06', title:'Track Intelligence',     desc:'Regular AI insights, career alerts, achievement badges, and analytics dashboard.', icon:'fa-chart-line', color:'#06b6d4' },
];

export default function CareerIntelligence() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  const f = FEATURES[activeFeature];
  const dashLink = user?.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/jobseeker';

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="ci-hero">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-brain" /> AI Career Intelligence</div>
            <h1>Not a job portal.<br /><span className="gradient-text">A Career Operating System.</span></h1>
            <p>TalentTrack's AI intelligence suite gives you complete visibility into your career — who you are, who you can become, and exactly how to get there.</p>
            <div className="home-hero-btns" style={{ justifyContent:'center', marginTop:'2rem' }}>
              {isLoggedIn
                ? <button className="pub-btn-primary" onClick={() => navigate(dashLink)}><i className="fas fa-th-large" /> Open Dashboard</button>
                : <button className="pub-btn-primary" onClick={() => navigate('/signup')}><i className="fas fa-rocket" /> Start Free</button>
              }
              <button className="pub-btn-secondary" onClick={() => navigate('/opportunities')}>
                <i className="fas fa-layer-group" /> Browse Opportunities
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive feature explorer */}
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">Intelligence Suite</div>
            <h2>Six AI modules. <span className="gradient-text">One unified system.</span></h2>
            <p>Click each module to explore what it does.</p>
          </div>

          <div className="ci-explorer">
            {/* Left: feature selector */}
            <div className="ci-feature-list">
              {FEATURES.map((feat, i) => (
                <button
                  key={feat.title}
                  className={`ci-feature-btn${activeFeature === i ? ' active' : ''}`}
                  style={activeFeature === i ? { borderColor: feat.color, background: feat.color + '12' } : {}}
                  onClick={() => setActiveFeature(i)}
                >
                  <div className="ci-feature-btn-icon" style={{ color: feat.color, background: feat.color + '18' }}>
                    <i className={`fas ${feat.icon}`} />
                  </div>
                  <div>
                    <div className="ci-feature-btn-title">{feat.title}</div>
                    <div className="ci-feature-btn-tagline">{feat.tagline}</div>
                  </div>
                  {activeFeature === i && <i className="fas fa-chevron-right" style={{ color: feat.color, marginLeft:'auto' }} />}
                </button>
              ))}
            </div>

            {/* Right: feature detail */}
            <div className="ci-feature-detail" style={{ borderColor: f.color + '40' }}>
              <div className="ci-feature-detail-icon" style={{ background: f.color + '18', color: f.color }}>
                <i className={`fas ${f.icon}`} />
              </div>
              <h3 style={{ color: f.color }}>{f.title}</h3>
              <p className="ci-feature-tagline">{f.tagline}</p>
              <p className="ci-feature-desc">{f.desc}</p>
              <div className="ci-feature-outputs">
                <p className="ci-outputs-label">What you get:</p>
                <div className="ci-outputs-grid">
                  {f.outputs.map((o, i) => (
                    <div key={i} className="ci-output-item">
                      <i className="fas fa-check" style={{ color: f.color }} /> {o}
                    </div>
                  ))}
                </div>
              </div>
              <button className="pub-btn-primary" style={{ background: f.color, marginTop:'1.5rem', border:'none' }}
                onClick={() => navigate(isLoggedIn ? dashLink : '/signup')}>
                {isLoggedIn ? 'Open in Dashboard →' : 'Unlock This Feature →'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="pub-section ci-how-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">Process</div>
            <h2>From sign-up to <span className="gradient-text">career clarity</span></h2>
            <p>Six steps from profile creation to AI-powered career intelligence.</p>
          </div>
          <div className="ci-steps-grid">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="ci-step-card">
                <div className="ci-step-num" style={{ color: s.color }}>{s.step}</div>
                <div className="ci-step-icon" style={{ background: s.color + '18', color: s.color }}>
                  <i className={`fas ${s.icon}`} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="ci-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI transparency section */}
      <section className="pub-section ci-xai-section">
        <div className="pub-container">
          <div className="ci-xai-inner">
            <div>
              <div className="pub-badge"><i className="fas fa-shield-alt" /> Explainable AI</div>
              <h2>No black boxes. <span className="gradient-text">Full transparency.</span></h2>
              <p>Every recommendation TalentTrack makes comes with a full explanation — match reasons, missing skills, and what you can do to improve. You always know why AI made a suggestion.</p>
              <ul className="ci-xai-list">
                {['Every job match shows exact match % and reasons','Missing skills are ranked by importance','All scores have category-level breakdowns','AI Mentor explains every career insight'].map(i => (
                  <li key={i}><i className="fas fa-check" style={{ color:'#10b981' }} /> {i}</li>
                ))}
              </ul>
            </div>
            <div className="ci-xai-card">
              <div className="ci-xai-card-header">
                <i className="fas fa-magic" style={{ color:'#6366f1' }} /> Smart Match Analysis
              </div>
              {[
                { label:'Match Score',     value:'87%',                  color:'#10b981' },
                { label:'Skills Matched',  value:'React, Node.js, MongoDB',color:'#6366f1' },
                { label:'Missing Skills',  value:'TypeScript, AWS',       color:'#f59e0b' },
                { label:'Career Growth',   value:'Senior → Lead in 2yr',  color:'#8b5cf6' },
                { label:'Why Recommended', value:'92% profile alignment',  color:'#06b6d4' },
              ].map(r => (
                <div key={r.label} className="ci-xai-row">
                  <span className="ci-xai-key">{r.label}</span>
                  <span className="ci-xai-val" style={{ color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-final-cta">
        <div className="pub-container home-cta-inner">
          <h2>Ready to experience <span className="gradient-text">career intelligence?</span></h2>
          <p>Join thousands of professionals using TalentTrack AI to understand and shape their career future.</p>
          <div className="home-hero-btns" style={{ justifyContent:'center' }}>
            {isLoggedIn
              ? <button className="pub-btn-primary pub-btn-lg" onClick={() => navigate(dashLink)}><i className="fas fa-th-large" /> Open Dashboard</button>
              : <button className="pub-btn-primary pub-btn-lg" onClick={() => navigate('/signup')}><i className="fas fa-rocket" /> Start Free Today</button>
            }
          </div>
        </div>
      </section>

      <FooterFull />
    </>
  );
}
