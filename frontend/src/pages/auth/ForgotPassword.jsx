// src/pages/auth/ForgotPassword.jsx
// NEW FILE — Phase 7 password reset, step 1

import { useState }       from 'react';
import { Link }           from 'react-router-dom';
import { apiRequest }     from '../../services/api.js';
import Navbar             from '../../components/Navbar.jsx';

export default function ForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body:   JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body">
      <Navbar />
      <main className="auth-main">
        <div className="auth-card">
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-envelope-open-text" style={{ fontSize: '3rem', color: '#059669', marginBottom: '1rem' }} />
              <h2 style={{ color: '#1a1a2e', marginBottom: '0.75rem' }}>Check your email</h2>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                If an account with that email exists, we've sent a password reset link.
                The link expires in <strong>15 minutes</strong>.
              </p>
              <Link to="/login" className="auth-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#1a1a2e', fontWeight: 700 }}>
                Reset your password
              </h2>
              <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Enter your email address and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="input-group">
                  <i className="fas fa-envelope" />
                  <input
                    type="email" placeholder="Email address" autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading
                    ? <><i className="fas fa-spinner fa-pulse" /> Sending…</>
                    : 'Send Reset Link'}
                </button>

                {error && <p className="auth-error">{error}</p>}
              </form>

              <p className="auth-prompt">
                Remember your password? <Link to="/login">Log in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
