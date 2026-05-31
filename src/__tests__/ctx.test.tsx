// ---------------------------------------------------------------------------
// Tests for AuthContext (ctx.tsx)
// ---------------------------------------------------------------------------

import { render, screen, waitFor, act, fireEvent } from '@testing-library/react-native';
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

// eslint-disable-next-line import/first
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
function TestConsumer() {
  const { session, user, login, logout } = useAuth();

  return (
    <>
      <Text testID="session">{session}</Text>
      <Text testID="user">{user ? `${user.name}|${user.email}|${user.role}` : 'null'}</Text>
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
  // Reset in-memory tokens in client.ts
  await clearTokens();
  // Force getItemAsync back to default null — clearAllMocks does NOT undo
  // mockResolvedValue('some-token') set by the "init sets authenticated" test.
  const SecureStore = require('expo-secure-store');
  SecureStore.getItemAsync.mockImplementation(() => Promise.resolve(null));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthContext', () => {
  test('init shows loading then unauthenticated when no tokens', async () => {
    render(<TestConsumer />, { wrapper: createWrapper() });

    expect(screen.getByTestId('session')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });
  });

  test('init sets authenticated when tokens exist in SecureStore', async () => {
    const SecureStore = require('expo-secure-store');
    SecureStore.getItemAsync.mockResolvedValue('some-token');

    render(<TestConsumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
    });
  });

  test('user is null when unauthenticated', async () => {
    render(<TestConsumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('login sets user in context', async () => {
    mockedAuth.login.mockResolvedValueOnce({
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      expiresIn: 3600,
      user: { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'patient' },
    });

    render(<TestConsumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });

    await act(async () => {
      const btn = screen.getByTestId('btn-login');
      fireEvent.press(btn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Test User|test@example.com|patient');
  });

  test('logout clears user', async () => {
    mockedAuth.login.mockResolvedValueOnce({
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      expiresIn: 3600,
      user: { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'patient' },
    });

    render(<TestConsumer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });

    await act(async () => {
      const btn = screen.getByTestId('btn-login');
      fireEvent.press(btn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Test User|test@example.com|patient');

    mockedAuth.logout.mockResolvedValueOnce(undefined);

    await act(async () => {
      const btn = screen.getByTestId('btn-logout');
      fireEvent.press(btn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('login calls endpoint and transitions to authenticated', async () => {
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
      const btn = screen.getByTestId('btn-login');
      fireEvent.press(btn);
    });

    expect(mockedAuth.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret',
    });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
    });
  });

  test('logout calls endpoint and transitions to unauthenticated', async () => {
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
      const btn = screen.getByTestId('btn-login');
      fireEvent.press(btn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('authenticated');
    });

    mockedAuth.logout.mockResolvedValueOnce(undefined);

    await act(async () => {
      const btn = screen.getByTestId('btn-logout');
      fireEvent.press(btn);
    });

    expect(mockedAuth.logout).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('unauthenticated');
    });
  });
});
