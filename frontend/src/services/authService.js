// src/services/authService.js
import { apiRequest, setToken, setUser, removeToken, removeUser, getToken, getUser } from './api.js';

export const AuthService = {
  signup: async ({ fullName, email, password, role, companyName }) => {
    const data = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, role, companyName }),
    });
    if (data.token) { setToken(data.token); setUser(data.user); }
    return data;
  },

  login: async ({ email, password }) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) { setToken(data.token); setUser(data.user); }
    return data;
  },

  logout: () => { removeToken(); removeUser(); },

  getMe: () => apiRequest('/api/auth/me'),

  isLoggedIn: () => !!getToken(),
  getCurrentUser: getUser,
};
