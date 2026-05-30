// src/api/client.ts

import * as SecureStore from 'expo-secure-store';
import { BASE_URL, TIMEOUT } from './config';

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly name = 'ApiError';

  constructor(
    readonly error: string,
    message: string,
    readonly statusCode: number,
    readonly validationErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Token store (module-level, in-memory + persisted to SecureStore)
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = 'auth-access-token';
const REFRESH_TOKEN_KEY = 'auth-refresh-token';

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Persist tokens to SecureStore and update in-memory store. */
export async function setTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  refreshToken = refresh;

  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
  } catch {
    // SecureStore not available (e.g. web) — in-memory only is fine
  }
}

/** Clear tokens from SecureStore and in-memory store. */
export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;

  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // SecureStore not available (e.g. web)
  }
}

/** Read tokens from SecureStore into the in-memory store on app launch. */
export async function initializeTokens(): Promise<void> {
  try {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);

    if (access && refresh) {
      accessToken = access;
      refreshToken = refresh;
    }
  } catch {
    // SecureStore not available (e.g. web)
  }
}

/** Check whether the token store currently holds a valid access token. */
export function isAuthenticated(): boolean {
  return accessToken !== null;
}

// ---------------------------------------------------------------------------
// Refresh dedup
// ---------------------------------------------------------------------------

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const storedRefreshToken = refreshToken;

  if (!storedRefreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (!response.ok) {
      await clearTokens();
      return false;
    }

    const body = await response.json();
    await setTokens(body.accessToken, body.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

export interface ApiClientConfig {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  body?: unknown;
  authenticated?: boolean;
  params?: Record<string, string | number | undefined>;
}

export interface ApiClientResponse<T> {
  data: T;
  response: Response;
}

/**
 * Retry the original request with the refreshed token.
 * Extracted to avoid duplicating fetch + timeout logic.
 */
async function retryRequest<T>(
  url: string,
  method: string,
  body: unknown,
): Promise<ApiClientResponse<T>> {
  const retryHeaders: Record<string, string> = {};
  if (body !== undefined) {
    retryHeaders['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    retryHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      method,
      headers: retryHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof DOMException && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Connection failed',
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generic fetch wrapper.
 *
 * - Injects `Authorization: Bearer <token>` when `authenticated: true`
 * - Sets up an AbortController with TIMEOUT
 * - Parses JSON response body
 * - Throws `ApiError` on non-2xx responses
 * - Intercepts 401 → attempts transparent token refresh → retries once
 * - Multiple concurrent 401s share a single refresh via `refreshPromise` dedup
 */
export async function apiClient<T>(config: ApiClientConfig): Promise<ApiClientResponse<T>> {
  const { method, url, body, authenticated = false, params } = config;

  // Build query string
  let fullUrl = `${BASE_URL}${url}`;
  if (params) {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) cleaned[key] = String(value);
    }
    const searchParams = new URLSearchParams(cleaned);
    fullUrl += `?${searchParams.toString()}`;
  }

  // Build headers
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (authenticated && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // Handle 401 → refresh → retry
    if (response.status === 401 && authenticated) {
      const refreshed = await handleRefresh();
      if (refreshed) {
        // Retry original request with new token
        return await retryRequest<T>(fullUrl, method, body);
      }
    }

    return handleResponse<T>(response);
  } catch (error) {
    // Wrap non-ApiError (network, timeout) so consumers get a consistent shape
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof DOMException && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Connection failed',
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Deduplicate concurrent 401s by sharing a single refresh promise.
 * Only the first caller creates the promise; subsequent callers await it.
 */
async function handleRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Parse the fetch Response and throw ApiError on non-2xx.
 */
async function handleResponse<T>(response: Response): Promise<ApiClientResponse<T>> {
  if (!response.ok) {
    let errorBody: Record<string, unknown> = {};
    try {
      errorBody = await response.json();
    } catch {
      // Body may not be JSON — fall through with empty object
    }

    throw new ApiError(
      (errorBody.error as string) ?? 'UNKNOWN_ERROR',
      (errorBody.message as string) ?? response.statusText,
      response.status,
      errorBody.validationErrors as Record<string, string[]> | undefined,
    );
  }

  // 204 No Content — no body to parse
  if (response.status === 204) {
    return { data: undefined as unknown as T, response };
  }

  const data = (await response.json()) as T;
  return { data, response };
}
