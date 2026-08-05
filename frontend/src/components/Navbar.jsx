// src/components/Navbar.jsx — v3.0 (new nav + dark mode toggle)
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path;
  const dashLink = user?.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/jobseeker';

  const NAV_LINKS = [
    { to: '/',                    label: 'Home'                },
    { to: '/career-intelligence', label: 'Career Intelligence' },
    { to: '/opportunities',       label: 'Opportunities'       },
    { to: '/about',               label: 'About'               },
    { to: '/help',                label: 'Help'                },
  ];

  return (
    <nav className={`pub-nav${scrolled ? ' scrolled' : ''}${open ? ' mobile-open' : ''}`}>
      <div className="pub-nav-inner">
        {/* Logo */}
        <Link to="/" className="pub-nav-logo">
          <span>TalentTrack</span>
        </Link>

        {/* Desktop links */}
        <ul className="pub-nav-links">
          {NAV_LINKS.map(l => (
            <li key={l.to}>
              <Link to={l.to} className={`pub-nav-link${isActive(l.to) ? ' active' : ''}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="pub-nav-actions">


          {isLoggedIn ? (
            <>
              <Link to={dashLink} className="pub-nav-dashboard-btn">
                <i className="fas fa-th-large" /> Dashboard
              </Link>
              <button className="pub-nav-logout-btn" onClick={() => { logout(); navigate('/'); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="pub-nav-login-btn">Login</Link>
              <Link to="/signup" className="pub-nav-signup-btn">Sign Up</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button className="pub-nav-hamburger" onClick={() => setOpen(p => !p)} aria-label="Menu">
          <i className={`fas fa-${open ? 'times' : 'bars'}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`pub-nav-mobile${open ? ' open' : ''}`}>
        {NAV_LINKS.map(l => (
          <Link key={l.to} to={l.to} className={`pub-nav-mobile-link${isActive(l.to) ? ' active' : ''}`} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <div className="pub-nav-mobile-actions">
         
          {isLoggedIn ? (
            <button className="pub-nav-signup-btn" onClick={() => { logout(); navigate('/'); setOpen(false); }}>Logout</button>
          ) : (
            <>
              <Link to="/login"  className="pub-nav-login-btn"  onClick={() => setOpen(false)}>Login</Link>
              <Link to="/signup" className="pub-nav-signup-btn" onClick={() => setOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
