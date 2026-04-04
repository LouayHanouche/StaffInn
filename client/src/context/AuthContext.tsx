import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';

type Role = 'HOTEL' | 'CANDIDATE' | 'ADMIN';

interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    role: 'HOTEL' | 'CANDIDATE';
    email: string;
    password: string;
    hotelName?: string;
    fullName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async (): Promise<void> => {
    try {
      const refreshed = await api.post<{ accessToken: string }>('/auth/refresh');
      tokenStore.set(refreshed.accessToken);
      const profile = await api.get<{ user: AuthUser }>('/auth/me');
      setUser(profile.user);
    } catch {
      tokenStore.set(null);
      setUser(null);
    }
  };

  useEffect(() => {
    void refresh().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const payload = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
      email,
      password,
    });
    tokenStore.set(payload.accessToken);
    setUser(payload.user);
  };

  const register = async (payload: {
    role: 'HOTEL' | 'CANDIDATE';
    email: string;
    password: string;
    hotelName?: string;
    fullName?: string;
  }): Promise<void> => {
    const created = await api.post<{ accessToken: string; user: AuthUser }>('/auth/register', payload);
    tokenStore.set(created.accessToken);
    setUser(created.user);
  };

  const logout = async (): Promise<void> => {
    await api.post('/auth/logout');
    tokenStore.set(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
