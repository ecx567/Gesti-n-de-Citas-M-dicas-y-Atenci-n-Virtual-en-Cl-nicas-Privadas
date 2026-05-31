import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  initializeTokens,
  setTokens,
  clearTokens,
  isAuthenticated,
  getRefreshToken,
} from '@/api/client';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from '@/api/auth/endpoints';
import type { User } from '@/api/auth/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  /** Current session state */
  session: SessionState;
  /** Current user data, null when not authenticated. */
  user: User | null;
  /** Authenticate with email/password. */
  login: (email: string, password: string) => Promise<void>;
  /** Create an account and start a session. */
  register: (name: string, email: string, password: string) => Promise<void>;
  /** Clear session and remove token from SecureStore */
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>('loading');
  const [user, setUser] = useState<User | null>(null);

  // On mount — check for existing tokens in SecureStore
  useEffect(() => {
    initializeTokens().then(() => {
      setSession(isAuthenticated() ? 'authenticated' : 'unauthenticated');
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    await setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    setSession('authenticated');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await apiRegister({ name, email, password });
    await setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    setSession('authenticated');
  }, []);

  const logout = useCallback(async () => {
    const token = getRefreshToken();
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        // Even if the logout API call fails, clear local state
      }
    }
    await clearTokens();
    setUser(null);
    setSession('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
