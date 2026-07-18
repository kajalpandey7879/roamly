'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { authApi, type MockUser } from '@/features/auth/api';

interface AuthContextValue {
  user: MockUser | null;
  isLoggedIn: boolean;
  isHydrating: boolean;
  login: () => Promise<MockUser>;
  loginWithEmail: (email: string, challengeId: string, code: string) => Promise<MockUser>;
  logout: () => void;
  toggleAuth: () => Promise<void>;
  requestLogin: (returnTo?: string) => void;
  promoteToHost: () => void;
}

const FALLBACK_MOCK_USER: MockUser = {
  id: 1,
  name: 'Alex Morgan',
  avatar: 'https://i.pravatar.cc/160?img=12',
  role: 'guest',
  joined_year: 2021,
  is_superhost: 0,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const loadMockUser = useCallback(async () => {
    try {
      return await authApi.getMockUser();
    } catch {
      return FALLBACK_MOCK_USER;
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const token = window.localStorage.getItem('roamly-auth-token');
      if (token) {
        try {
          setUser(await authApi.me(token));
        } catch {
          window.localStorage.removeItem('roamly-auth-token');
          window.localStorage.removeItem('roamly-authenticated');
        }
      } else if (window.localStorage.getItem('roamly-authenticated') === 'true') {
        setUser(await loadMockUser());
      }
      setIsHydrating(false);
    };
    void restoreSession();
  }, [loadMockUser]);

  const login = useCallback(async () => {
    const authenticatedUser = await loadMockUser();
    setUser(authenticatedUser);
    window.localStorage.setItem('roamly-authenticated', 'true');
    window.localStorage.removeItem('roamly-auth-token');
    return authenticatedUser;
  }, [loadMockUser]);

  const loginWithEmail = useCallback(async (email: string, challengeId: string, code: string) => {
    const result = await authApi.verifyEmailCode(email, challengeId, code);
    setUser(result.user);
    window.localStorage.setItem('roamly-authenticated', 'true');
    window.localStorage.setItem('roamly-auth-token', result.access_token);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    const token = window.localStorage.getItem('roamly-auth-token');
    if (token) void authApi.logout(token).catch(() => undefined);
    setUser(null);
    window.localStorage.removeItem('roamly-authenticated');
    window.localStorage.removeItem('roamly-auth-token');
    toast.success('You are now logged out');
  }, []);

  const requestLogin = useCallback((returnTo?: string) => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const requestedPath = returnTo ?? currentPath;
    const safeReturnTo =
      requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
    window.location.assign(`/login?return_to=${encodeURIComponent(safeReturnTo)}`);
  }, []);

  const toggleAuth = useCallback(async () => {
    if (user) logout();
    else await login();
  }, [login, logout, user]);

  const promoteToHost = useCallback(() => {
    setUser((current) => (current ? { ...current, role: 'host' } : current));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        isHydrating,
        login,
        loginWithEmail,
        logout,
        toggleAuth,
        requestLogin,
        promoteToHost,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
