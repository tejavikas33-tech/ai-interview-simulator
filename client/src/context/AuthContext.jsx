import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('preppulse_token'));
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState(null);

  // Check health and existing session on mount
  useEffect(() => {
    async function init() {
      try {
        const health = await api.checkHealth().catch(() => null);
        if (health) setSystemStatus(health.services);

        const savedToken = localStorage.getItem('preppulse_token');
        if (savedToken) {
          const res = await api.getMe();
          if (res && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        }
      } catch (err) {
        console.warn('Session verification error:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('preppulse_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (email, password, fullName) => {
    const res = await api.register({ email, password, fullName });
    localStorage.setItem('preppulse_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    localStorage.setItem('preppulse_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('preppulse_token');
    setToken(null);
    setUser(null);
  };

  const refreshSystemStatus = async () => {
    try {
      const health = await api.checkHealth();
      if (health) setSystemStatus(health.services);
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        systemStatus,
        login,
        register,
        demoLogin,
        logout,
        refreshSystemStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
