import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, registerUser, type AuthUser } from '../services/authApi';

const TOKEN_KEY = 'streamvault_auth_token';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  authLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  signup: (input: { username: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser(token);
        if (!cancelled) setUserState(data.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken(null);
          setUserState(null);
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    authLoading,
    setUser: (u: AuthUser) => setUserState(u),
    refreshUser: async () => {
      if (!token) return;
      try {
        const data = await getCurrentUser(token);
        setUserState(data.user);
      } catch {}
    },
    login: async input => {
      const data = await loginUser(input);
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUserState(data.user);
    },
    signup: async input => {
      const data = await registerUser(input);
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUserState(data.user);
    },
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUserState(null);
    },
  }), [authLoading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}