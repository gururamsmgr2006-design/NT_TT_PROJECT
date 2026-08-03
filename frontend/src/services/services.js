// src/services/services.js
//
// UPDATE: Added FeedbackService for the new feedback API endpoint

import { apiRequest } from './api.js';

// ── Jobs ──────────────────────────────────────────────────────
export const JobService = {
  getJobs:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/jobs${q ? '?' + q : ''}`);
  },
  getJob:    (id)       => apiRequest(`/api/jobs/${id}`),
  getMyJobs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/jobs/recruiter/my-jobs${q ? '?' + q : ''}`);
  },
  createJob: (data)     => apiRequest('/api/jobs',    { method:'POST',   body: JSON.stringify(data) }),
  updateJob: (id, data) => apiRequest(`/api/jobs/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  deleteJob: (id)       => apiRequest(`/api/jobs/${id}`, { method:'DELETE' }),
};

// ── Applications ──────────────────────────────────────────────
export const ApplicationService = {
  apply: async (jobId, { coverLetter = '', resumeFile = null } = {}) => {
    if (resumeFile) {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      if (coverLetter) fd.append('coverLetter', coverLetter);
      return apiRequest(`/api/applications/${jobId}`, { method:'POST', body: fd });
    }
    return apiRequest(`/api/applications/${jobId}`, {
      method: 'POST',
      body:   JSON.stringify({ coverLetter }),
    });
  },
  getMyApplications: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/applications/my-applications${q ? '?' + q : ''}`);
  },
  getApplicants:  (jobId) => apiRequest(`/api/applications/job/${jobId}`),
  updateStatus:   (appId, status, recruiterNotes = '') =>
    apiRequest(`/api/applications/${appId}/status`, {
      method: 'PUT',
      body:   JSON.stringify({ status, recruiterNotes }),
    }),
  withdraw: (appId) => apiRequest(`/api/applications/${appId}`, { method:'DELETE' }),
};

// ── Users ─────────────────────────────────────────────────────
export const UserService = {
  updateProfile:  (data)  => apiRequest('/api/users/profile', { method:'PUT', body: JSON.stringify(data) }),
  uploadResume:   (file)  => {
    const fd = new FormData();
    fd.append('resume', file);
    return apiRequest('/api/users/upload-resume', { method:'POST', body: fd });
  },
  toggleSaveJob:  (jobId) => apiRequest(`/api/users/save-job/${jobId}`, { method:'POST' }),
  getSavedJobs:   ()      => apiRequest('/api/users/saved-jobs'),
  changePassword: (currentPassword, newPassword) =>
    apiRequest('/api/users/change-password', {
      method: 'PUT',
      body:   JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ── Feedback (NEW) ────────────────────────────────────────────
export const FeedbackService = {
  submit: (data) => apiRequest('/api/feedback', { method:'POST', body: JSON.stringify(data) }),
};
