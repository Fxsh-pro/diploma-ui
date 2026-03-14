import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../../api/auth';
import type { CurrentUser, Action } from '../../api/types';

const ROLE_ACTIONS: Record<string, Set<Action>> = {
  QA_ENGINEER:       new Set(['MANAGE_SCENARIOS', 'MANAGE_TEST_RUNS', 'VIEW_METRICS']),
  RESOURCE_OPERATOR: new Set(['MANAGE_AGENTS', 'MANAGE_POOLS', 'GENERATE_TOKEN']),
  SYSTEM_ADMIN:      new Set([
    'MANAGE_AGENTS', 'MANAGE_POOLS', 'GENERATE_TOKEN',
    'MANAGE_SCENARIOS', 'MANAGE_TEST_RUNS', 'VIEW_METRICS',
    'MANAGE_USERS', 'VIEW_AUDIT_LOG',
  ]),
};

interface AuthContextValue {
  user: CurrentUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  canDo: (action: Action) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeUser(token: string): CurrentUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email ?? '',
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const token = localStorage.getItem('token');
    return token ? decodeUser(token) : null;
  });

  const login = async (username: string, password: string) => {
    const { token, user: userResp } = await authApi.login(username, password);
    localStorage.setItem('token', token);
    setUser({
      id: userResp.id,
      username: userResp.username,
      email: userResp.email,
      role: userResp.role,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const canDo = (action: Action): boolean => {
    if (!user) return false;
    return ROLE_ACTIONS[user.role]?.has(action) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, canDo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
