// src/services/api.js — UPDATED v2.0 (all CIOS services)
export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const getToken   = ()  => localStorage.getItem('talenttrack_token');
export const setToken   = (t) => localStorage.setItem('talenttrack_token', t);
export const removeToken= ()  => localStorage.removeItem('talenttrack_token');
export const setUser    = (u) => localStorage.setItem('talenttrack_user', JSON.stringify(u));
export const getUser    = ()  => { try { return JSON.parse(localStorage.getItem('talenttrack_user')); } catch { return null; } };
export const removeUser = ()  => localStorage.removeItem('talenttrack_user');

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(`${BACKEND_URL}${endpoint}`, { ...options, headers, credentials: 'include' });
  let data;
  try { data = await response.json(); } catch { throw new Error('Server returned invalid response.'); }
  if (!response.ok) throw new Error(data?.message || data?.errors?.[0]?.msg || `Request failed (${response.status})`);
  return data;
}

export const AIService = {
  chat: (p) => apiRequest('/api/ai/chat', { method:'POST', body:JSON.stringify(p) }),
  getConversations:   ()   => apiRequest('/api/ai/conversations'),
  getConversation:    (id) => apiRequest(`/api/ai/conversations/${id}`),
  deleteConversation: (id) => apiRequest(`/api/ai/conversations/${id}`, { method:'DELETE' }),
  analyzeResume:    (p) => apiRequest('/api/ai/resume/analyze', { method:'POST', body:JSON.stringify(p) }),
  getResumeHistory: ()  => apiRequest('/api/ai/resume/history'),
  analyzeSkillGap:    (p) => apiRequest('/api/ai/skill-gap', { method:'POST', body:JSON.stringify(p) }),
  getSkillGapHistory: ()  => apiRequest('/api/ai/skill-gap/history'),
  generateRoadmap:   (p) => apiRequest('/api/ai/roadmap', { method:'POST', body:JSON.stringify(p) }),
  getRoadmapHistory: ()  => apiRequest('/api/ai/roadmap/history'),
  generateRecommendations: (p) => apiRequest('/api/ai/recommendations/generate', { method:'POST', body:JSON.stringify(p) }),
  getRecommendations: ()  => apiRequest('/api/ai/recommendations'),
};
export const CareerTwinService      = { generate:(p)=>apiRequest('/api/ai/career-twin',{method:'POST',body:JSON.stringify(p)}), get:()=>apiRequest('/api/ai/career-twin') };
export const EmployabilityService   = { calculate:(p)=>apiRequest('/api/ai/employability',{method:'POST',body:JSON.stringify(p||{})}), getHistory:()=>apiRequest('/api/ai/employability/history') };
export const EscapeVelocityService  = { analyze:(p)=>apiRequest('/api/ai/career-escape',{method:'POST',body:JSON.stringify(p)}), getHistory:()=>apiRequest('/api/ai/career-escape/history') };
export const InsightsService        = { get:()=>apiRequest('/api/ai/insights'), refresh:(p)=>apiRequest('/api/ai/insights/refresh',{method:'POST',body:JSON.stringify(p||{})}) };
export const MarketService          = { getSkillRadar:()=>apiRequest('/api/market/skill-radar'), getMarketTrends:()=>apiRequest('/api/market/trends') };
export const AnalyticsService       = { getDashboard:()=>apiRequest('/api/analytics/dashboard') };
export const AchievementService     = { get:()=>apiRequest('/api/achievements'), check:()=>apiRequest('/api/achievements/check',{method:'POST'}) };
export const ProfileService         = { getFull:()=>apiRequest('/api/profile/full'), updateFull:(p)=>apiRequest('/api/profile/full',{method:'PUT',body:JSON.stringify(p)}), updateSettings:(p)=>apiRequest('/api/profile/settings',{method:'PUT',body:JSON.stringify(p)}), exportUrl:()=>`${BACKEND_URL}/api/profile/export`, verifyDelete:(p)=>apiRequest('/api/profile/verify-delete',{method:'POST',body:JSON.stringify(p)}), deleteAccount:(p)=>apiRequest('/api/profile/account',{method:'DELETE',body:JSON.stringify(p)}) };
