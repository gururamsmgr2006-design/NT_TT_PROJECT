// src/pages/About.jsx — Research project / innovation presentation style
import { useNavigate } from 'react-router-dom';
import Navbar         from '../components/Navbar.jsx';
import { FooterFull } from '../components/Footer.jsx';

const OBJECTIVES = [
  { icon:'fa-dna',            color:'#8b5cf6', title:'Career Identity Intelligence', desc:'Create AI-powered career twin representations that accurately model a professional\'s current and future career state.' },
  { icon:'fa-chart-bar',      color:'#6366f1', title:'Employability Quantification', desc:'Develop a comprehensive, multi-dimensional scoring system to objectively measure career readiness on a 0-1000 scale.' },
  { icon:'fa-satellite-dish', color:'#f59e0b', title:'Labor Market Intelligence',    desc:'Build real-time market intelligence capabilities covering skill demand, industry health, and career forecasts for India.' },
  { icon:'fa-rocket',         color:'#ef4444', title:'Career Transition Modelling',  desc:'Identify transferable skills and model high-probability career transitions using AI pattern recognition.' },
  { icon:'fa-magic',          color:'#10b981', title:'Explainable AI Matching',      desc:'Implement transparent, explainable AI job matching where every recommendation is justified with specific reasons.' },
  { icon:'fa-language',       color:'#06b6d4', title:'Multilingual Accessibility',   desc:'Make AI career intelligence accessible in 5 Indian languages to remove linguistic barriers for all professionals.' },
];

const TECH_STACK = [
  { layer:'Frontend',   tech:'React 18 + Vite + CSS3',          icon:'fa-laptop-code', color:'#06b6d4' },
  { layer:'Backend',    tech:'Node.js + Express.js',             icon:'fa-server',      color:'#10b981' },
  { layer:'Database',   tech:'MongoDB Atlas + Mongoose',         icon:'fa-database',    color:'#6366f1' },
  { layer:'AI Layer',   tech:'Gemini + Groq + OpenRouter',       icon:'fa-robot',       color:'#8b5cf6' },
  { layer:'Auth',       tech:'JWT + bcryptjs (salt 12)',          icon:'fa-shield-alt',  color:'#ef4444' },
  { layer:'File Parse', tech:'pdf-parse + mammoth',              icon:'fa-file-alt',    color:'#f59e0b' },
  { layer:'Email',      tech:'Nodemailer + SMTP',                icon:'fa-envelope',    color:'#06b6d4' },
  { layer:'Security',   tech:'Helmet + express-rate-limit',      icon:'fa-lock',        color:'#10b981' },
];

const INNOVATIONS = [
  { num:'01', title:'Provider-Agnostic AI Layer',      desc:'A waterfall fallback system (Gemini → Groq → OpenRouter → OpenAI) ensures 99.9% AI uptime regardless of individual provider outages.',           color:'#6366f1' },
  { num:'02', title:'Career Digital Twin Engine',      desc:'First implementation in India of a full career twin — a living AI model of the user\'s professional identity that simulates multiple futures.',      color:'#8b5cf6' },
  { num:'03', title:'Unified Employability Framework', desc:'A 9-dimension weighted scoring model that produces a single 0-1000 score, calibrated specifically to Indian job market standards.',                  color:'#10b981' },
  { num:'04', title:'Explainable AI Job Matching',     desc:'Every job match includes match percentage, specific match reasons, missing skills, and why other jobs were not recommended — zero black boxes.',     color:'#ef4444' },
  { num:'05', title:'Real-Time Market Intelligence',   desc:'AI-generated Indian labor market data covering 7 cities, 10+ industries, and 4 forecast horizons — refreshed every 24 hours automatically.',       color:'#f59e0b' },
  { num:'06', title:'Multilingual Career Intelligence',desc:'All AI modules support English, Hindi, Tamil, Kannada, and Telugu — the first multilingual career intelligence platform built for India.',          color:'#06b6d4' },
];

const FUTURE_SCOPE = [
  'Real-time job notifications via WhatsApp and SMS',
  'Video resume analysis with AI body language scoring',
  'Recruiter intelligence dashboard with candidate ranking',
  'Integration with LinkedIn, GitHub, and HackerRank for automatic profile enrichment',
  'Peer career benchmarking (anonymous) against professionals in similar roles',
  'Interview simulation with AI-powered feedback and scoring',
  'Campus placement intelligence for engineering colleges',
  'Government job market integration (UPSC, SSC, banking sector)',
];

export default function About() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="about-hero">
        <div className="pub-container about-hero-inner">
          <div className="pub-badge"><i className="fas fa-award" /> Innovation Project</div>
          <h1>India's First <span className="gradient-text">AI Career Intelligence OS</span></h1>
          <p className="about-hero-sub">A research and innovation project redefining how Indian professionals understand, plan, and transform their careers using artificial intelligence.</p>
          <div className="about-hero-meta">
            <span><i className="fas fa-code" /> Full-Stack MERN</span>
            <span><i className="fas fa-robot" /> 4 AI Providers</span>
            <span><i className="fas fa-database" /> 12 DB Collections</span>
            <span><i className="fas fa-language" /> 5 Languages</span>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="pub-section">
        <div className="pub-container about-mv-grid">
          <div className="about-mv-card about-mission">
            <div className="pub-badge" style={{ marginBottom:'1rem' }}><i className="fas fa-bullseye" /> Mission</div>
            <h2>Democratize career intelligence for every Indian professional</h2>
            <p>TalentTrack's mission is to give every job seeker — regardless of college tier, city, or background — access to the same quality of career intelligence that was previously only available to those who could afford expensive career coaches or elite alumni networks.</p>
            <p>By leveraging AI, we make data-driven career planning accessible at zero cost.</p>
          </div>
          <div className="about-mv-card about-vision">
            <div className="pub-badge" style={{ marginBottom:'1rem' }}><i className="fas fa-eye" /> Vision</div>
            <h2>A career intelligence layer for India's 500 million workforce</h2>
            <p>We envision TalentTrack as the foundational career intelligence infrastructure for India — where every professional can understand their career health in real-time, predict which skills will be valuable in 3 years, and receive AI-powered guidance that accounts for India's unique job market dynamics.</p>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="pub-section about-problem-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">Research Motivation</div>
            <h2>The problem we <span className="gradient-text">set out to solve</span></h2>
          </div>
          <div className="about-problem-content">
            <div className="about-problem-stats">
              {[
                { stat:'93%', desc:'of Indian graduates are not job-ready according to industry surveys', color:'#ef4444' },
                { stat:'₹4.8L', desc:'average salary loss due to career indecision in the first 3 years of employment', color:'#f59e0b' },
                { stat:'67%', desc:'of professionals report applying to roles they are significantly underqualified for', color:'#6366f1' },
                { stat:'0', desc:'data-driven career intelligence platforms built specifically for Indian job market conditions', color:'#8b5cf6' },
              ].map(s => (
                <div key={s.stat} className="about-problem-stat">
                  <div className="about-stat-value" style={{ color: s.color }}>{s.stat}</div>
                  <div className="about-stat-desc">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="about-problem-text">
              <p>Traditional job portals solve only one small part of the career problem — they list jobs. They don't help professionals understand whether they are ready for those jobs, which skills they need to develop, which career paths align with their experience, or how the job market will evolve in the next 3 years.</p>
              <p>TalentTrack is built on the hypothesis that career intelligence — not just job listings — is what professionals truly need. Every feature in the platform is designed around answering one fundamental question: <em>"What should I do next in my career, and why?"</em></p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Objectives */}
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">Research Objectives</div>
            <h2>What TalentTrack <span className="gradient-text">aims to achieve</span></h2>
          </div>
          <div className="pub-grid-3">
            {OBJECTIVES.map(o => (
              <div key={o.title} className="about-obj-card">
                <div className="about-obj-icon" style={{ background: o.color + '18', color: o.color }}>
                  <i className={`fas ${o.icon}`} />
                </div>
                <h3>{o.title}</h3>
                <p>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Innovation Highlights */}
      <section className="pub-section about-innovations-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge"><i className="fas fa-lightbulb" /> Innovation Highlights</div>
            <h2>What makes TalentTrack <span className="gradient-text">different</span></h2>
          </div>
          <div className="about-innovations">
            {INNOVATIONS.map(inn => (
              <div key={inn.num} className="about-innovation-card">
                <div className="about-inn-num" style={{ color: inn.color }}>{inn.num}</div>
                <div className="about-inn-content">
                  <h3 style={{ color: inn.color }}>{inn.title}</h3>
                  <p>{inn.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">Technology Stack</div>
            <h2>Production-grade <span className="gradient-text">architecture</span></h2>
          </div>
          <div className="pub-grid-4">
            {TECH_STACK.map(t => (
              <div key={t.layer} className="about-tech-card">
                <div className="about-tech-icon" style={{ background: t.color + '18', color: t.color }}>
                  <i className={`fas ${t.icon}`} />
                </div>
                <div className="about-tech-layer">{t.layer}</div>
                <div className="about-tech-name">{t.tech}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Scope */}
      <section className="pub-section about-future-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <div className="pub-badge">Future Scope</div>
            <h2>The roadmap <span className="gradient-text">ahead</span></h2>
            <p>TalentTrack v2 and beyond — planned features for the next phase of development.</p>
          </div>
          <div className="about-future-grid">
            {FUTURE_SCOPE.map((f, i) => (
              <div key={i} className="about-future-item">
                <span className="about-future-num">{String(i+1).padStart(2,'0')}</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-final-cta">
        <div className="pub-container home-cta-inner">
          <h2>Experience the <span className="gradient-text">innovation</span></h2>
          <p>TalentTrack is free for all job seekers. Sign up and access India's most advanced career intelligence platform.</p>
          <div className="home-hero-btns" style={{ justifyContent:'center' }}>
            <button className="pub-btn-primary pub-btn-lg" onClick={() => navigate('/signup')}>
              <i className="fas fa-rocket" /> Get Started Free
            </button>
            <button className="pub-btn-secondary pub-btn-lg" onClick={() => navigate('/feedback')}>
              <i className="fas fa-comment-dots" /> Send Feedback
            </button>
          </div>
        </div>
      </section>

      <FooterFull />
    </>
  );
}
