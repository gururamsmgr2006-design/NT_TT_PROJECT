// src/App.jsx — v3.0 (safe transitional version)
import './styles/ai-features.css';
import './styles/public.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }       from './context/AuthContext.jsx';
import { ThemeProvider }      from './context/ThemeContext.jsx';
import { ProtectedRoute, ErrorBoundary } from './components/SharedComponents.jsx';

import Home               from './pages/Home.jsx';
import Opportunities      from './pages/Opportunities.jsx';
import CareerIntelligence from './pages/CareerIntelligence.jsx';
import Companies          from './pages/Companies.jsx';
import About              from './pages/About.jsx';
import Help               from './pages/Help.jsx';
import Feedback           from './pages/Feedback.jsx';
import Login              from './pages/Login.jsx';
import Signup             from './pages/Signup.jsx';
import ForgotPassword     from './pages/auth/ForgotPassword.jsx';
import ResetPassword      from './pages/auth/ResetPassword.jsx';
import JobseekerDashboard from './pages/dashboard/JobseekerDashboard.jsx';
import RecruiterDashboard from './pages/dashboard/RecruiterDashboard.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"                    element={<Home />} />
            <Route path="/opportunities"       element={<Opportunities />} />
            <Route path="/career-intelligence" element={<CareerIntelligence />} />
            <Route path="/companies"           element={<Companies />} />
            <Route path="/about"               element={<About />} />
            <Route path="/help"                element={<Help />} />
            <Route path="/feedback"            element={<Feedback />} />
            <Route path="/login"               element={<Login />} />
            <Route path="/signup"              element={<Signup />} />

            {/* Redirect old routes */}
            <Route path="/jobs"        element={<Navigate to="/opportunities?tab=jobs" replace />} />
            <Route path="/internships" element={<Navigate to="/opportunities?tab=internships" replace />} />

            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/dashboard/jobseeker" element={
              <ProtectedRoute role="jobseeker">
                <ErrorBoundary><JobseekerDashboard /></ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter" element={
              <ProtectedRoute role="recruiter">
                <ErrorBoundary><RecruiterDashboard /></ErrorBoundary>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}