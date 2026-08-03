// src/pages/Help.jsx — v3.0 (updated with email redirect for password issues)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar         from '../components/Navbar.jsx';
import { FooterSimple } from '../components/Footer.jsx';

const GETTING_STARTED = [
  { icon:'fa-user-plus',   color:'#6366f1', title:'Create Your Account',   desc:'Click Sign Up, choose Job Seeker or Recruiter, fill in your details and create a strong password. It\'s completely free.' },
  { icon:'fa-id-card',     color:'#10b981', title:'Complete Your Profile',  desc:'Go to your Dashboard → Profile. Fill in education, experience, skills, certifications, and projects. A complete profile unlocks the best AI features.' },
  { icon:'fa-file-alt',    color:'#f59e0b', title:'Upload Your Resume',     desc:'In the Profile tab, upload your resume (PDF or DOCX, max 5 MB). This unlocks Resume Intelligence — ATS scoring, skill extraction, and improvement tips.' },
  { icon:'fa-brain',       color:'#8b5cf6', title:'Launch AI Intelligence', desc:'Try Career Digital Twin, Employability Score, or Career Escape Velocity from the sidebar. All AI features are free and powered by Gemini AI.' },
];

const DASHBOARD_GUIDE = [
  { tab:'Overview',         icon:'fa-th-large',      desc:'Your career dashboard hub with KPI cards, AI shortcuts, and recent application activity.' },
  { tab:'Career Twin',      icon:'fa-dna',           desc:'Generate your AI career twin — current identity + 5 future career path simulations with salary forecasts.' },
  { tab:'Opportunities',    icon:'fa-layer-group',   desc:'Browse and apply to all jobs and internships from TalentTrack\'s database.' },
  { tab:'Applications',     icon:'fa-paper-plane',   desc:'Track all your submitted applications and their current status (Applied → Interview → Hired).' },
  { tab:'Saved Jobs',       icon:'fa-bookmark',      desc:'Jobs you have bookmarked for later review.' },
  { tab:'Smart Matches',    icon:'fa-magic',         desc:'AI-matched jobs from TalentTrack with full explainability — match score, reasons, and missing skills.' },
  { tab:'AI Assistant',     icon:'fa-robot',         desc:'Conversational AI for career advice, resume tips, interview prep, and salary guidance — in 5 languages.' },
  { tab:'Resume Intelligence',icon:'fa-brain',       desc:'Upload resume for ATS scoring, skill gap detection, and career roadmap generation.' },
  { tab:'Employability Score',icon:'fa-chart-bar',   desc:'Your 0-1000 career readiness score across 9 dimensions with improvement recommendations.' },
  { tab:'Escape Velocity',  icon:'fa-rocket',        desc:'Discover career transitions — transferable skills, difficulty, timeline, and salary increase projections.' },
  { tab:'Skill Radar',      icon:'fa-satellite-dish',desc:'India\'s labor market intelligence — emerging skills, city demand, industry health scores.' },
  { tab:'Analytics',        icon:'fa-chart-line',    desc:'Personal career analytics — application funnel, resume score trend, and employability growth chart.' },
  { tab:'Career Insights',  icon:'fa-lightbulb',     desc:'AI-generated insights from your profile — opportunities, risks, salary intel, and hidden skill discovery.' },
  { tab:'Market Trends',    icon:'fa-globe-asia',    desc:'Workforce intelligence — fastest growing industries, hiring trends, and AI-powered forecasts.' },
  { tab:'Achievements',     icon:'fa-trophy',        desc:'Career gamification — badges, levels, and streaks earned as you progress on the platform.' },
  { tab:'Settings',         icon:'fa-cog',           desc:'Account settings, privacy controls, AI preferences, theme, language, and data export.' },
  { tab:'Profile',          icon:'fa-id-card',       desc:'Your complete career identity center — all details saved permanently in the database.' },
];

const FAQS = [
  { q:'Is TalentTrack completely free?', a:'Yes. TalentTrack is 100% free for job seekers. All AI features — Career Digital Twin, Employability Score, Resume Intelligence, and more — are free. Recruiters post jobs for free too.' },
  { q:'What AI models does TalentTrack use?', a:'TalentTrack uses a multi-provider AI system: Gemini 1.5 Flash (primary), Groq LLaMA 3.3 (fallback), OpenRouter (fallback 2), and OpenAI GPT (fallback 3). This ensures near-100% uptime for all AI features.' },
  { q:'Which languages does TalentTrack support?', a:'All AI features support English, Hindi, Tamil, Kannada, and Telugu. You can switch languages in the AI Assistant, Resume Intelligence, and Settings pages.' },
  { q:'How do I improve my Employability Score?', a:'Go to Dashboard → Employability Score and click Calculate. The AI gives you 6 specific improvement recommendations. Completing your profile, uploading a resume, adding certifications, and running skill gap analysis all improve your score.' },
  { q:'Can I apply to jobs without a resume?', a:'Yes — if you have uploaded a resume to your profile, it will be used automatically when you apply. You can also write a cover letter during the application.' },
  { q:'How do I withdraw an application?', a:'Go to Dashboard → Applications. Find the application with status "Applied" and click Withdraw.' },
  { q:'What file formats does Resume Intelligence accept?', a:'PDF, DOC, and DOCX files up to 5 MB. Scanned image-only PDFs will not work — the resume must contain extractable text.' },
  { q:'How often is market intelligence data updated?', a:'Skill Demand Radar and Market Trends data is refreshed every 24 hours automatically by the AI system.' },
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);
  const [openGuide, setOpenGuide] = useState(null);
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="help-hero">
        <div className="pub-container help-hero-inner">
          <div className="pub-badge"><i className="fas fa-life-ring" /> Help & Support</div>
          <h1>How can we <span className="gradient-text">help you?</span></h1>
          <p>Everything you need to get the most out of TalentTrack's AI Career Intelligence platform.</p>
          <div className="help-quick-links">
            {[
              { icon:'fa-play-circle',    label:'Getting Started', anchor:'#getting-started' },
              { icon:'fa-th-large',       label:'Dashboard Guide', anchor:'#dashboard' },
              { icon:'fa-question-circle',label:'FAQ',             anchor:'#faq' },
              { icon:'fa-envelope',       label:'Contact Support', anchor:'#contact' },
            ].map(l => (
              <a key={l.label} href={l.anchor} className="help-quick-link">
                <i className={`fas ${l.icon}`} /> {l.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="pub-section" id="getting-started">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-play-circle" /> Getting Started</div>
            <h2>Start your career intelligence <span className="gradient-text">journey</span></h2>
          </div>
          <div className="pub-grid-4">
            {GETTING_STARTED.map((s, i) => (
              <div key={s.title} className="help-step-card">
                <div className="help-step-num" style={{ background: s.color + '18', color: s.color }}>{String(i+1).padStart(2,'0')}</div>
                <div className="help-step-icon" style={{ color: s.color }}><i className={`fas ${s.icon}`} /></div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Guide */}
      <section className="pub-section" id="dashboard">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-th-large" /> Dashboard Guide</div>
            <h2>Your <span className="gradient-text">16-tab dashboard</span> explained</h2>
            <p>Click any tab to see what it does.</p>
          </div>
          <div className="help-guide-grid">
            {DASHBOARD_GUIDE.map((g, i) => (
              <div key={g.tab} className={`help-guide-card${openGuide === i ? ' open' : ''}`} onClick={() => setOpenGuide(openGuide === i ? null : i)}>
                <div className="help-guide-header">
                  <i className={`fas ${g.icon}`} style={{ color:'#6366f1', width:20 }} />
                  <span className="help-guide-tab">{g.tab}</span>
                  <i className={`fas fa-chevron-${openGuide === i ? 'up' : 'down'}`} style={{ color:'#9ca3af', marginLeft:'auto', fontSize:'0.75rem' }} />
                </div>
                {openGuide === i && <p className="help-guide-desc">{g.desc}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pub-section" id="faq">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-question-circle" /> FAQ</div>
            <h2>Frequently asked <span className="gradient-text">questions</span></h2>
          </div>
          <div className="help-faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className={`help-faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="help-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  <i className={`fas fa-chevron-${openFaq === i ? 'up' : 'down'}`} />
                </button>
                {openFaq === i && <div className="help-faq-a"><p>{f.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="pub-section" id="contact">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-envelope" /> Contact Support</div>
            <h2>Need more <span className="gradient-text">help?</span></h2>
          </div>
          <div className="help-contact-grid">
            <div className="help-contact-card">
              <div className="help-contact-icon" style={{ background:'#6366f118', color:'#6366f1' }}><i className="fas fa-comment-dots" /></div>
              <h3>Feedback & Suggestions</h3>
              <p>Have ideas to improve TalentTrack? Found a bug? Use our Feedback form and our team will respond.</p>
              <button className="pub-btn-primary" onClick={() => navigate('/feedback')}>Open Feedback Form</button>
            </div>

            <div className="help-contact-card">
              <div className="help-contact-icon" style={{ background:'#10b98118', color:'#10b981' }}><i className="fas fa-key" /></div>
              <h3>Password & Account Issues</h3>
              <p>Forgot your password? Use the <strong>Forgot Password</strong> link on the Login page for a reset link. If you face account issues, email us directly.</p>
              <a
                href="mailto:gururamsmgr2006@gmail.com?subject=TalentTrack Account Issue&body=Hi, I am writing from my TalentTrack registered email. Issue: "
                className="pub-btn-primary"
                style={{ display:'inline-block', textDecoration:'none', textAlign:'center' }}
              >
                <i className="fas fa-envelope" /> Email Support
              </a>
              <p style={{ fontSize:'0.75rem', color:'var(--pub-text-secondary)', marginTop:'0.5rem' }}>
                Email: <strong>gururamsmgr2006@gmail.com</strong><br />
                Please write from your TalentTrack-registered email ID.
              </p>
            </div>

            <div className="help-contact-card">
              <div className="help-contact-icon" style={{ background:'#8b5cf618', color:'#8b5cf6' }}><i className="fas fa-robot" /></div>
              <h3>AI Assistant Help</h3>
              <p>The AI Assistant inside your dashboard can answer most career questions. Log in and ask it anything — it supports 5 Indian languages.</p>
              <button className="pub-btn-secondary" onClick={() => navigate('/login')}>Open AI Assistant</button>
            </div>
          </div>
        </div>
      </section>

      <FooterSimple text="© 2026 TalentTrack — Here to help" />
    </>
  );
}
