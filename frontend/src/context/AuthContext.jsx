import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('foodloop_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setOrganization(res.data.organization);
          }
        } catch (err) {
          console.error('Failed to restore session:', err.message);
          localStorage.removeItem('foodloop_token');
          localStorage.removeItem('foodloop_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('foodloop_token', res.data.token);
      localStorage.setItem('foodloop_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setOrganization(res.data.organization);
      return res.data;
    }
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      localStorage.setItem('foodloop_token', res.data.token);
      localStorage.setItem('foodloop_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setOrganization(res.data.organization);
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('foodloop_token');
    localStorage.removeItem('foodloop_user');
    setUser(null);
    setOrganization(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setOrganization(res.data.organization);
      }
    } catch (e) {
      console.warn('Failed to refresh user:', e.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isDonor: user?.role === 'donor',
        isRecipient: user?.role === 'recipient',
        isVolunteer: user?.role === 'volunteer',
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
