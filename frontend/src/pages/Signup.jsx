// src/pages/Signup.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import { Toast } from '../components/SharedComponents.jsx';
import { useToast } from '../hooks/useToast.js';

function getStrength(pwd) {
  if (!pwd) return { width:0, color:'#e5e7eb', label:'' };
  let s = 0;
  if (pwd.length >= 6)  s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 2) return { width:33, color:'#dc2626', label:'Weak' };
  if (s === 3) return { width:66, color:'#f59e0b', label:'Medium' };
  return { width:100, color:'#10b981', label:'Strong' };
}

function validate(fields, role) {
  const errs = {};
  if (!fields.fullName.trim())           errs.fullName = 'Full name is required.';
  if (role === 'recruiter' && !fields.companyName.trim()) errs.companyName = 'Company name is required.';
  if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errs.email = 'Valid email is required.';
  if (!fields.password)                  errs.password = 'Password is required.';
  else if (fields.password.length < 8)   errs.password = 'At least 8 characters.';
  else if (!/[A-Z]/.test(fields.password)) errs.password = 'Must include an uppercase letter.';
  else if (!/[0-9]/.test(fields.password)) errs.password = 'Must include a number.';
  if (!fields.confirmPassword)           errs.confirmPassword = 'Please confirm your password.';
  else if (fields.confirmPassword !== fields.password) errs.confirmPassword = 'Passwords do not match.';
  return errs;
}

export default function Signup() {
  const { signup, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [role, setRole] = useState('jobseeker');
  const [fields, setFields] = useState({ fullName:'', companyName:'', email:'', password:'', confirmPassword:'' });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isLoggedIn && user) {
      navigate(user.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/jobseeker', { replace:true });
    }
  }, [isLoggedIn, user, navigate]);

  const set = (name, val) => setFields(p => ({ ...p, [name]: val }));
  const touch = (name) => setTouched(p => ({ ...p, [name]: true }));

  const errs = validate(fields, role);
  const isValid = Object.keys(errs).length === 0;
  const strength = getStrength(fields.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ fullName:true, companyName:true, email:true, password:true, confirmPassword:true });
    if (!isValid) return;
    setLoading(true); setFormError('');
    try {
      const data = await signup({
        fullName: fields.fullName.trim(),
        email: fields.email.trim(),
        password: fields.password,
        role,
        companyName: role === 'recruiter' ? fields.companyName.trim() : undefined,
      });
      showToast('✅ Account created! Redirecting…');
      setTimeout(() => {
        navigate(data.user.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/jobseeker', { replace:true });
      }, 1000);
    } catch (err) {
      setFormError(err.message || '⚠️ Signup failed. Please try again.');
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
          {/* Role switcher */}
          <div className="role-switch">
            {['jobseeker','recruiter'].map(r => (
              <button key={r} type="button"
                className={`role-btn${role === r ? ' active' : ''}`}
                onClick={() => { setRole(r); setFields(p => ({ ...p, companyName:'' })); setTouched({}); }}
              >
                {r === 'jobseeker' ? 'User' : 'Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" placeholder="Enter your full name"
                value={fields.fullName}
                onChange={e => set('fullName', e.target.value)}
                onBlur={() => touch('fullName')}
              />
              {touched.fullName && errs.fullName && <span className="error-text">{errs.fullName}</span>}
            </div>

            {/* Company (recruiter only) */}
            {role === 'recruiter' && (
              <div className="form-group">
                <label>Company Name *</label>
                <input type="text" placeholder="Your company name"
                  value={fields.companyName}
                  onChange={e => set('companyName', e.target.value)}
                  onBlur={() => touch('companyName')}
                />
                {touched.companyName && errs.companyName && <span className="error-text">{errs.companyName}</span>}
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label>Email *</label>
              <input type="email" placeholder="you@example.com"
                value={fields.email}
                onChange={e => set('email', e.target.value)}
                onBlur={() => touch('email')}
              />
              {touched.email && errs.email && <span className="error-text">{errs.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password *</label>
              <input type="password" placeholder="Create a password"
                value={fields.password}
                onChange={e => set('password', e.target.value)}
                onBlur={() => touch('password')}
              />
              <div className="strength-meter">
                <div className="strength-bar" style={{ width:`${strength.width}%`, backgroundColor: strength.color }} />
              </div>
              {strength.label && <p className="strength-label">{strength.label}</p>}
              {touched.password && errs.password && <span className="error-text">{errs.password}</span>}
            </div>

            {/* Confirm */}
            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" placeholder="Confirm your password"
                value={fields.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                onBlur={() => touch('confirmPassword')}
              />
              {touched.confirmPassword && errs.confirmPassword && <span className="error-text">{errs.confirmPassword}</span>}
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-pulse" /> Creating account…</> : 'Create account'}
            </button>
            {formError && <p className="auth-error">{formError}</p>}
          </form>

          <p className="auth-prompt">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
