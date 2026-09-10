import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, setToken } from '../api/client';
import type { AuthUser, Role } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const USER_KEY = 'hospital.user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authApi.login(username, password);
    setToken(result.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // 启动时校验令牌有效性，账号被停用/过期则自动登出
  useEffect(() => {
    const token = localStorage.getItem('hospital.accessToken');
    if (!token) return;
    setLoading(true);
    authApi
      .me()
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      hasRole: (...roles) => (user ? roles.includes(user.role) : false)
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
