// src/components/SharedComponents.jsx
//
// FIX FE-4: Added ErrorBoundary class component.
//           Catches runtime errors in dashboard components and
//           shows a friendly error screen instead of a blank white page.

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext.jsx';

// ─── Toast ────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast-wrap${toast.type === 'error' ? ' error' : ''}`}>
      {toast.msg}
    </div>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────
export function LoadingSpinner({ text = 'Loading…' }) {
  return (
    <div className="spinner-page">
      <i className="fas fa-spinner fa-pulse" />
      {text}
    </div>
  );
}

// ─── ProtectedRoute ───────────────────────────────────────────
export function ProtectedRoute({ children, role }) {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={
      user?.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/jobseeker'
    } replace />;
  }
  return children;
}

// ─── ErrorBoundary ────────────────────────────────────────────
// Class component — required because React Error Boundaries must use
// componentDidCatch lifecycle method, which isn't available in hooks.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you could send to Sentry here
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: '2rem', textAlign: 'center',
        }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '1rem' }} />
          <h2 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: '400px' }}>
            An unexpected error occurred. Please refresh the page or navigate back to the home page.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.6rem 1.4rem', background: '#2E4057', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
              }}
            >
              <i className="fas fa-sync-alt" style={{ marginRight: '6px' }} />
              Refresh Page
            </button>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              style={{
                padding: '0.6rem 1.4rem', background: '#f3f4f6', color: '#374151',
                border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Go Home
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '600px', width: '100%' }}>
              <summary style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '0.85rem' }}>
                Error details (dev only)
              </summary>
              <pre style={{
                background: '#1f2937', color: '#f87171', padding: '1rem',
                borderRadius: '6px', overflow: 'auto', fontSize: '0.75rem', marginTop: '0.5rem',
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
