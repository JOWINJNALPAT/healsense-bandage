import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isDoctor: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  demoLogin: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('healsense_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('healsense_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('healsense_token');
      if (storedToken) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
          localStorage.setItem('healsense_user', JSON.stringify(res.user));
        } catch {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem('healsense_token');
          localStorage.removeItem('healsense_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('healsense_token', res.token);
    localStorage.setItem('healsense_user', JSON.stringify(res.user));
  };

  const register = async (data: { name: string; email: string; password: string; role: UserRole }) => {
    const res = await api.register(data);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('healsense_token', res.token);
    localStorage.setItem('healsense_user', JSON.stringify(res.user));
  };

  const demoLogin = async (role: UserRole = 'doctor') => {
    const res = await api.demoLogin(role);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('healsense_token', res.token);
    localStorage.setItem('healsense_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    await api.logout();
    setToken(null);
    setUser(null);
  };

  const isDoctor = user?.role === 'doctor';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isDoctor,
        loading,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
