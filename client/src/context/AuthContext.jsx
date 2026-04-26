import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyAuthSession = useCallback((session) => {
    if (!session?.token || !session?.user) {
      return;
    }

    localStorage.setItem('token', session.token);
    setUser(session.user);
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/users/profile');
          setUser(res.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (email, password, expectedRole) => {
    const res = await api.post('/auth/login', { email, password });

    if (expectedRole && res.data.user?.role !== expectedRole) {
      throw new Error(
        expectedRole === 'admin'
          ? 'This account is not an admin account.'
          : 'This account is an admin account. Use admin login instead.'
      );
    }

    applyAuthSession(res.data);
    return res.data;
  }, [applyAuthSession]);

  const register = useCallback(async (name, email, password, address, phone) => {
    const res = await api.post('/auth/register', { name, email, password, address, phone });
    return res.data;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const res = await api.put('/users/profile', payload);
    setUser(res.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    register,
    updateProfile,
    logout,
    applyAuthSession,
    loading,
  }), [user, login, register, updateProfile, logout, applyAuthSession, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
