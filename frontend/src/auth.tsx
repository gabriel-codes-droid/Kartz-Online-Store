// auth.tsx - Auth context with full TypeScript types.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import api, { fetchMe, setToken } from './api';
import type { SignupPayload, UpgradePayload, User } from './types';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login(identifier: string, password: string): Promise<User>;
  signup(payload: SignupPayload): Promise<User>;
  logout(): Promise<void>;
  upgradeToArtist(payload: UpgradePayload): Promise<User>;
  refresh(): Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async (): Promise<User | null> => {
    const u = await fetchMe();
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function login(identifier: string, password: string): Promise<User> {
    const { data } = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { identifier, password }
    );
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload: SignupPayload): Promise<User> {
    const { data } = await api.post<{ token: string; user: User }>(
      '/auth/signup',
      payload
    );
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout(): Promise<void> {
    setToken('');
    setUser(null);
  }

  async function upgradeToArtist(payload: UpgradePayload): Promise<User> {
    const { data } = await api.post<{ user: User; token?: string }>(
      '/auth/upgrade-artist',
      payload
    );
    if (data.token) setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  const value: AuthContextValue = {
    user,
    loading,
    login,
    signup,
    logout,
    upgradeToArtist,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
