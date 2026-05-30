/// <reference types="jest" />

// ---------------------------------------------------------------------------
// Tests for api/client.ts — fetch wrapper & token store
// ---------------------------------------------------------------------------

import {
  apiClient,
  ApiError,
  setTokens,
  clearTokens,
  isAuthenticated,
  initializeTokens,
} from '@/api/client';
import { BASE_URL, TIMEOUT } from '@/api/config';

// Mock SecureStore (used by setTokens, clearTokens, initializeTokens)
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    statusText: response.statusText ?? 'OK',
    json: response.json ?? (() => Promise.resolve({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as const,
    url: '',
    clone: () => ({}) as Response,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
  } as Response);
}

function mockFetchError(status: number, body?: Record<string, unknown>) {
  return mockFetch({
    ok: false,
    status,
    statusText: status >= 500 ? 'Internal Server Error' : 'Bad Request',
    json: () => Promise.resolve(body ?? { error: 'TEST_ERROR', message: 'Test error' }),
  });
}

/** Create a mock fetch that returns a pending promise and aborts on signal. */
function mockAbortableFetch() {
  return jest
    .spyOn(global, 'fetch')
    .mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = (init as RequestInit & { signal?: AbortSignal })?.signal;
        if (!signal) return;

        const onAbort = () => {
          const error = new DOMException('The operation was aborted', 'AbortError');
          reject(error);
        };

        if (signal.aborted) {
          onAbort();
        } else {
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
    });
}

/** Create a mock fetch that throws a network-like error. */
function mockNetworkError() {
  return jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useRealTimers();
  await clearTokens(); // reset in-memory state
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('apiClient', () => {
  test('successful request returns parsed data', async () => {
    const data = { id: '1', name: 'test' };
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });

    const result = await apiClient<typeof data>({
      method: 'GET',
      url: '/test',
    });

    expect(result.data).toEqual(data);
    expect(result.response.status).toBe(200);
  });

  test('4xx error throws ApiError with correct fields', async () => {
    mockFetchError(422, {
      error: 'VALIDATION_ERROR',
      message: 'Email is required',
      validationErrors: { email: ['is required'] },
    });

    await expect(apiClient({ method: 'POST', url: '/test', body: {} })).rejects.toThrow(ApiError);

    try {
      await apiClient({ method: 'POST', url: '/test', body: {} });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).error).toBe('VALIDATION_ERROR');
      expect((err as ApiError).message).toBe('Email is required');
      expect((err as ApiError).statusCode).toBe(422);
      expect((err as ApiError).validationErrors).toEqual({ email: ['is required'] });
    }
  });

  test('401 with refresh succeeds retries original request', async () => {
    // First call returns 401, second returns 200
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'UNAUTHORIZED', message: 'Token expired' }),
        headers: new Headers(),
        redirected: false,
        type: 'basic' as const,
        url: '',
        clone: () => ({}) as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
        headers: new Headers(),
        redirected: false,
        type: 'basic' as const,
        url: '',
        clone: () => ({}) as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'retried-ok' }),
        headers: new Headers(),
        redirected: false,
        type: 'basic' as const,
        url: '',
        clone: () => ({}) as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
      } as Response);

    // Set initial tokens so the request is authenticated
    await setTokens('old-access', 'old-refresh');

    const result = await apiClient<{ data: string }>({
      method: 'GET',
      url: '/appointments',
      authenticated: true,
    });

    // Should retry and succeed
    expect(result.data).toEqual({ data: 'retried-ok' });
    // Total calls: original (401) + refresh (200) + retry (200)
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  test('401 with refresh failure clears tokens and throws error', async () => {
    // First call returns 401, refresh also returns 401
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'UNAUTHORIZED', message: 'Token expired' }),
        headers: new Headers(),
        redirected: false,
        type: 'basic' as const,
        url: '',
        clone: () => ({}) as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'REFRESH_FAILED', message: 'Invalid refresh token' }),
        headers: new Headers(),
        redirected: false,
        type: 'basic' as const,
        url: '',
        clone: () => ({}) as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
      } as Response);

    await setTokens('old-access', 'old-refresh');

    await expect(
      apiClient({ method: 'GET', url: '/appointments', authenticated: true }),
    ).rejects.toThrow(ApiError);

    // Tokens should be cleared
    expect(isAuthenticated()).toBe(false);
    // Original call + refresh call
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('unauthenticated request omits Authorization header', async () => {
    const fetchSpy = mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await apiClient({ method: 'GET', url: '/public' });

    const callArgs = fetchSpy.mock.calls[0];
    const headers = (callArgs[1] as RequestInit)?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBeUndefined();
  });

  test('timeout wraps as ApiError with error TIMEOUT', async () => {
    jest.useFakeTimers();
    mockAbortableFetch();

    const promise = apiClient({ method: 'GET', url: '/slow' });

    // Advance past TIMEOUT to trigger the abort
    jest.advanceTimersByTime(TIMEOUT + 100);

    await expect(promise).rejects.toThrow(ApiError);

    try {
      await promise;
    } catch (err) {
      expect((err as ApiError).error).toBe('TIMEOUT');
      expect((err as ApiError).statusCode).toBe(0);
    }

    jest.useRealTimers();
  });

  test('network error wraps as ApiError with error NETWORK_ERROR', async () => {
    mockNetworkError();

    await expect(apiClient({ method: 'GET', url: '/test' })).rejects.toThrow(ApiError);

    try {
      await apiClient({ method: 'GET', url: '/test' });
    } catch (err) {
      expect((err as ApiError).error).toBe('NETWORK_ERROR');
      expect((err as ApiError).statusCode).toBe(0);
    }
  });
});

describe('token store', () => {
  test('setTokens updates in-memory state', async () => {
    expect(isAuthenticated()).toBe(false);
    await setTokens('access-123', 'refresh-456');
    expect(isAuthenticated()).toBe(true);
  });

  test('clearTokens resets in-memory state', async () => {
    await setTokens('access-123', 'refresh-456');
    expect(isAuthenticated()).toBe(true);
    await clearTokens();
    expect(isAuthenticated()).toBe(false);
  });

  test('initializeTokens reads nothing when no tokens stored', async () => {
    // getItemAsync mock already returns null
    await initializeTokens();
    expect(isAuthenticated()).toBe(false);
  });
});
