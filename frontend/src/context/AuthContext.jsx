import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { logoutSession } from '../services/authService';

const AuthContext = createContext();

const getStoredToken = () => {
  const token = localStorage.getItem('token') || '';
  return token === 'demo-token' || token === 'admin-token' ? '' : token;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(() => getStoredToken() ? JSON.parse(localStorage.getItem('user') || 'null') : null);
  const [role, setRole] = useState(() => getStoredToken() ? localStorage.getItem('role') || 'customer' : 'customer');

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('role');
    }
  }, [role]);

  const login = (userData, sessionToken, userRole = 'customer') => {
    if (!sessionToken) {
      throw new Error('The server did not return a login session. Please try again.');
    }
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', sessionToken);
    localStorage.setItem('role', userRole);
    setUser(userData);
    setToken(sessionToken);
    setRole(userRole);
  };

  const clearSession = () => {
    setUser(null);
    setToken('');
    setRole('customer');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutSession();
      }
    } finally {
      clearSession();
    }
  };

  useEffect(() => {
    const handleExpiredSession = () => clearSession();
    window.addEventListener('auth:expired', handleExpiredSession);
    return () => window.removeEventListener('auth:expired', handleExpiredSession);
  }, []);

  const value = useMemo(() => ({ user, token, role, login, logout }), [user, token, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
