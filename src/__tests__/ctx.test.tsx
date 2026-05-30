// ---------------------------------------------------------------------------
// Tests for AuthContext (ctx.tsx)
// ---------------------------------------------------------------------------

import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock SecureStore (used internally by @/api/client)
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
}));

// Mock auth endpoints (used directly by ctx)
jest.mock('@/api/auth/endpoints', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
}));

import { AuthProvider, useAuth, type SessionState } from '@/ctx';
import * as authEndpoints from '@/api/auth/endpoints';
// eslint-disable-next-line import/first
import { clearTokens } from '@/api/client';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockedAuth = authEndpoints as jest.Mocked<typeof authEndpoints>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

/** Test component that reads auth context and exposes values for assertions. */
function TestConsumer({
  onUpdate,
}: {
  onUpdate: (value: {
    session: SessionState;
    doLogin: () => Promise<void>;
    doLogout: () => Promise<void>;
  }) => void;
}) {
  const { session, login, logout } = useAuth();

  return (
    <>
      <Text testID="session">{session}</Text>
      <Pressable testID="btn-login" onPress={() => login('test@example.com', 'secret')} />
      <Pressable testID="btn-logout" onPress={() => logout()} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  jest.clearAllMocks();
  // Reset client.ts in-memory tokens
  await clearTokens();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthContext', () => {
  test('init shows loading then unauthenticated when no tokens', async () => {
    // getItemAsync returns null (default mock) → no tokens
    render(<TestConsumer />, { wrapper: createWrapper() });

    // Starts at loading
    expect(screen.getByTestId('session')).toHaveTextContent('loading');

    // Transitions to unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });
  });

  test('init sets authenticated when tokens exist in SecureStore', async () => {
    // Mock getItemAsync to return tokens
    const SecureStore = require('expo-secure-store');
    SecureStore.getItemAsync.mockResolvedValue('some-token');

    render(<TestConsumer />, { wrapper: createWrapper() });

    // Transitions to authenticated
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
    });
  });

  test('login calls endpoint and transitions to authenticated', async () => {
    mockedAuth.login.mockResolvedValueOnce({
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      expiresIn: 3600,
      user: { id: 'u1', name: 'Test', email: 'test@example.com', role: 'patient' },
    });

    render(<TestConsumer />, { wrapper: createWrapper() });

    // Wait for init to settle
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });

    // Trigger login
    await act(async () => {
      screen.getByTestId('btn-login').props.onPress();
    });

    // Should call the endpoint
    expect(mockedAuth.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret',
    });

    // Should transition to authenticated
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
    });
  });

  test('logout calls endpoint and transitions to unauthenticated', async () => {
    // First log in
    mockedAuth.login.mockResolvedValueOnce({
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      expiresIn: 3600,
      user: { id: 'u1', name: 'Test', email: 'test@example.com', role: 'patient' },
    });

    render(<TestConsumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });

    await act(async () => {
      screen.getByTestId('btn-login').props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
    });

    // Now logout
    mockedAuth.logout.mockResolvedValueOnce(undefined);

    await act(async () => {
      screen.getByTestId('btn-logout').props.onPress();
    });

    // Should call logout endpoint
    expect(mockedAuth.logout).toHaveBeenCalled();

    // Should transition to unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });
  });
});
