// src/pages/Login.jsx
//
// FIX FE-1: Removed cosmetic role switcher (had no effect on login)
// FIX FE-6: Replaced fake "forgot password" toast with real navigation
//           to /forgot-password page

import { useState, useEffect }         from 'react';
import { Link, useNavigate }            from 'react-router-dom';
import { useAuth }                      from '../context/AuthContext.jsx';
import Navbar                           from '../components/Navbar.jsx';
import { Toast }                        from '../components/SharedComponents.jsx';
import { useToast }                     from '../hooks/useToast.js';

export default function Login() {
  const { login, isLoggedIn, user } = useAuth();
  const navigate   = useNavigate();
  const { toast, showToast } = useToast();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      navigate(
        user.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/jobseeker',
        { replace: true }
      );
    }
  }, [isLoggedIn, user, navigate]);

  const isValid = email.trim() && password.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await login({ email: email.trim(), password });
      showToast('✅ Login successful! Redirecting…');
      setTimeout(() => {
        navigate(
          data.user.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/jobseeker',
          { replace: true }
        );
      }, 800);
    } catch (err) {
      setError(err.message || '⚠️ Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body">
      <Navbar />
      <Toast toast={toast} />
      <main className="auth-main">
        <div className="auth-card">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1a1a2e', fontWeight: 700 }}>
            Sign in to TalentTrack
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <i className="fas fa-envelope" />
              <input
                type="email" placeholder="Email address" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <i className="fas fa-lock" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <i
                className={`fas fa-eye${showPwd ? '' : '-slash'}`}
                style={{ cursor: 'pointer', color: '#9ca3af' }}
                onClick={() => setShowPwd(p => !p)}
              />
            </div>

            {/* FIX: Real link to /forgot-password — no more fake toast */}
            <div className="forgot-link">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="auth-btn" disabled={!isValid || loading}>
              {loading
                ? <><i className="fas fa-spinner fa-pulse" /> Logging in…</>
                : 'Log in'}
            </button>

            {error && <p className="auth-error">{error}</p>}
          </form>

          <p className="auth-prompt">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
