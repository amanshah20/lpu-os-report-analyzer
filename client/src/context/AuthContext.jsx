import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, studentAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));

  // Sync user to localStorage
  const saveUser = useCallback((userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
    setUser(userData);
  }, []);

  // Fetch fresh user profile on mount
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await studentAPI.getProfile();
          if (res.data.success) {
            saveUser(res.data.user);
          }
        } catch (err) {
          // Token might be expired - that's handled by interceptor
          if (err.response?.status !== 401) {
            console.error('Auth init error:', err.message);
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [saveUser]);

  const login = useCallback(async (userData, tokens) => {
    const { accessToken: at, refreshToken: rt } = tokens;
    localStorage.setItem('accessToken', at);
    if (rt) localStorage.setItem('refreshToken', rt);
    setAccessToken(at);
    saveUser(userData);
  }, [saveUser]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    saveUser(null);
    toast.success('Logged out successfully');
  }, [saveUser]);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAuthenticated = !!user && !!accessToken;
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isTeacher,
        isStudent,
        accessToken,
        login,
        logout,
        updateUser,
        saveUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
