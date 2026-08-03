// src/context/AuthContext.jsx
//
// FIX FE-2: Removed unnecessary dynamic import of setUser.
//           api.js is already statically imported — just destructure setUser directly.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/authService.js';
import { getUser, setUser } from '../services/api.js'; // FIX: added setUser to static import

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUserState] = useState(() => getUser());
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const stored = getUser();
    if (stored) setUserState(stored);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await AuthService.login(credentials);
      setUserState(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (fields) => {
    setLoading(true);
    try {
      const data = await AuthService.signup(fields);
      setUserState(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUserState(null);
  };

  const refreshUser = async () => {
    try {
      const data = await AuthService.getMe();
      // FIX: Use the statically imported setUser — no dynamic import needed
      setUser(data.user);
      setUserState(data.user);
      return data.user;
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, signup, logout, refreshUser,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
