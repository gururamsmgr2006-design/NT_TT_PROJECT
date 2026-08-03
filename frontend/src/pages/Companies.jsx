// src/pages/Companies.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { FooterSimple } from '../components/Footer.jsx';

const COMPANIES = [
  { id:1,  name:'Google',     location:'Mountain View, CA & Global',   description:'Innovative tech giant shaping the future of search, cloud, and AI.',              logo:'G' },
  { id:2,  name:'Microsoft',  location:'Redmond, WA & Worldwide',      description:'Empowering every person and organization on the planet.',                          logo:'M' },
  { id:3,  name:'Amazon',     location:'Seattle, WA & Global',         description:'E-commerce, cloud computing, and digital streaming leader.',                       logo:'A' },
  { id:4,  name:'Infosys',    location:'Bengaluru, India & Global',    description:'Consulting and IT services powerhouse.',                                            logo:'I' },
  { id:5,  name:'TCS',        location:'Mumbai, India & Worldwide',    description:'Global IT services and consulting firm.',                                           logo:'T' },
  { id:6,  name:'Apple',      location:'Cupertino, CA',                description:'Design, develop, and sell consumer electronics and software.',                     logo:'A' },
  { id:7,  name:'Meta',       location:'Menlo Park, CA & Remote',      description:'Building the future of social connection and metaverse.',                          logo:'M' },
  { id:8,  name:'Netflix',    location:'Los Gatos, CA & Global',       description:'Leading streaming entertainment service.',                                          logo:'N' },
  { id:9,  name:'Adobe',      location:'San Jose, CA',                 description:'Creative and digital marketing software leader.',                                   logo:'A' },
  { id:10, name:'Salesforce', location:'San Francisco, CA & Remote',   description:'Customer relationship management platform.',                                        logo:'S' },
];

export default function Companies() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = COMPANIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewJobs = (name) => {
    sessionStorage.setItem('filterByCompany', name);
    navigate('/jobs');
  };

  return (
    <>
      <Navbar />

      <div className="page-header-bar">
        <h1>Top Companies</h1>
        <p>Explore leading employers and start your career journey</p>
      </div>

      {/* Search */}
      <div style={{ background:'white', padding:'1.5rem 1rem', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <div className="input-group" style={{ marginBottom:0 }}>
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by company name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="companies-section">
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'#6b7280', gridColumn:'1/-1' }}>
            <i className="fas fa-building" style={{ fontSize:'2.5rem', marginBottom:'1rem', display:'block', opacity:0.4 }} />
            <p>No companies match "{search}". Try another name.</p>
          </div>
        ) : (
          <div className="companies-grid">
            {filtered.map(c => (
              <div className="company-card" key={c.id}>
                <div className="company-logo">{c.logo}</div>
                <div className="company-name">{c.name}</div>
                <div className="company-location">
                  <i className="fas fa-map-marker-alt" style={{ fontSize:'0.8rem' }} /> {c.location}
                </div>
                <p className="company-description">{c.description}</p>
                <button className="view-jobs-btn" onClick={() => handleViewJobs(c.name)}>
                  View Jobs
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <FooterSimple text="© 2025 TalentTrack — Discover your next workplace" />
    </>
  );
}
