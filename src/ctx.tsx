import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
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
import { fetchProfile } from '@/api/users/endpoints';
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
  /** Update the in-memory user data (e.g. after profile edit). */
  setUser: (user: User | null) => void;
  /** Authenticate with email/password. */
  login: (email: string, password: string) => Promise<void>;
  /** Create an account and start a session. */
  register: (name: string, email: string, password: string) => Promise<void>;
  /** Clear session and remove token from SecureStore */
  logout: () => Promise<void>;
  /** Fetch the latest profile from GET /users/me and update the in-memory user. */
  refreshProfile: () => Promise<void>;
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
  const [user, setUserState] = useState<User | null>(null);

  // Expose setUser so screens can update the cached user (e.g. after profile edit)
  const setUser = useCallback((u: User | null) => setUserState(u), []);

  // Fetch latest profile from the API
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await fetchProfile();
      setUserState({ id: profile.id, name: profile.name, email: profile.email, role: profile.role });
    } catch {
      // Silent fail — user data stays as-is
    }
  }, []);

  // On mount — check for existing tokens in SecureStore
  useEffect(() => {
    initializeTokens().then(() => {
      if (isAuthenticated()) {
        setSession('authenticated');
        // Fetch full profile on cold start to get the latest user data
        refreshProfile();
      } else {
        setSession('unauthenticated');
      }
    });
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    await setTokens(response.accessToken, response.refreshToken);
    setUserState(response.user);
    setSession('authenticated');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await apiRegister({ name, email, password });
    await setTokens(response.accessToken, response.refreshToken);
    setUserState(response.user);
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
    setUserState(null);
    setSession('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, setUser, login, register, logout, refreshProfile }}>
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
