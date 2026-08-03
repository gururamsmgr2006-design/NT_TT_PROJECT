// src/pages/auth/ResetPassword.jsx
// NEW FILE — Phase 7 password reset, step 2

import { useState }           from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest }         from '../../services/api.js';
import Navbar                 from '../../components/Navbar.jsx';

export default function ResetPassword() {
  const { token }  = useParams();
  const navigate   = useNavigate();

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd,         setShowPwd]         = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [error,           setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { setError('Both fields are required.'); return; }
    if (newPassword !== confirmPassword)  { setError('Passwords do not match.');   return; }
    if (newPassword.length < 8)           { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(newPassword))       { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(newPassword))       { setError('Password must contain at least one number.'); return; }

    setLoading(true);
    setError('');
    try {
      await apiRequest(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        body:   JSON.stringify({ newPassword, confirmPassword }),
      });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(err.message || 'This link is invalid or has expired. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-body">
        <Navbar />
        <main className="auth-main">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#059669', marginBottom: '1rem' }} />
            <h2 style={{ color: '#1a1a2e', marginBottom: '0.75rem' }}>Password Reset!</h2>
            <p style={{ color: '#6b7280' }}>Your password has been changed. Redirecting to login…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-body">
      <Navbar />
      <main className="auth-main">
        <div className="auth-card">
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#1a1a2e', fontWeight: 700 }}>
            Set new password
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Must be at least 8 characters with one uppercase letter and one number.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <i className="fas fa-lock" />
              <input
                type={showPwd ? 'text' : 'password'} placeholder="New password"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
              />
              <i
                className={`fas fa-eye${showPwd ? '' : '-slash'}`}
                style={{ cursor: 'pointer', color: '#9ca3af' }}
                onClick={() => setShowPwd(p => !p)}
              />
            </div>
            <div className="input-group">
              <i className="fas fa-lock" />
              <input
                type={showPwd ? 'text' : 'password'} placeholder="Confirm new password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading
                ? <><i className="fas fa-spinner fa-pulse" /> Resetting…</>
                : 'Reset Password'}
            </button>

            {error && <p className="auth-error">{error}</p>}
          </form>

          <p className="auth-prompt">
            <Link to="/forgot-password">Request a new link</Link> · <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
