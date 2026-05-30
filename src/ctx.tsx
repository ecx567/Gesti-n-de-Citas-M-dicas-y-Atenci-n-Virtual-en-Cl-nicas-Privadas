import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth-token';
const MOCK_TOKEN = 'mock-token-vitacitas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionState =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

export interface AuthContextValue {
  /** Current session state */
  session: SessionState;
  /**
   * Authenticate with email/password.
   * Currently mock — stores a static token in SecureStore.
   * Will be wired to a real API in a future change.
   */
  login: (email: string, password: string) => Promise<void>;
  /**
   * Create an account and start a session.
   * Currently mock — stores a static token in SecureStore.
   * Will be wired to a real API in a future change.
   */
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

  // On mount — check for existing token in SecureStore
  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((token) => {
        setSession(token ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        // SecureStore not available (e.g. web) — treat as unauthenticated
        setSession('unauthenticated');
      });
  }, []);

  const login = useCallback(async (_email: string, _password: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, MOCK_TOKEN);
    setSession('authenticated');
  }, []);

  const register = useCallback(
    async (_name: string, _email: string, _password: string) => {
      await SecureStore.setItemAsync(TOKEN_KEY, MOCK_TOKEN);
      setSession('authenticated');
    },
    [],
  );

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setSession('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, register, logout }}>
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
