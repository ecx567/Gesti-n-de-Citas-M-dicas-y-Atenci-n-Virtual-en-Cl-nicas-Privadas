// src/api/auth/endpoints.ts

import { apiClient } from '@/api/client';
import type { LoginRequest, RegisterRequest, AuthResponse } from './types';

/**
 * Authenticate with email and password.
 * Stores tokens client-side via `setTokens` inside the login flow.
 */
export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiClient<AuthResponse>({
    method: 'POST',
    url: '/auth/login',
    body: data,
  }).then((res) => res.data);
}

/**
 * Create a new account and return auth tokens.
 */
export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiClient<AuthResponse>({
    method: 'POST',
    url: '/auth/register',
    body: data,
  }).then((res) => res.data);
}

/**
 * Exchange a refresh token for a new access/refresh token pair.
 */
export function refreshToken(
  token: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  return apiClient<{ accessToken: string; refreshToken: string; expiresIn: number }>({
    method: 'POST',
    url: '/auth/refresh',
    body: { refreshToken: token },
  }).then((res) => res.data);
}

/**
 * Invalidate a refresh token on the server and clear the session.
 */
export function logout(token: string): Promise<void> {
  return apiClient<void>({
    method: 'POST',
    url: '/auth/logout',
    body: { refreshToken: token },
    authenticated: true,
  }).then(() => undefined);
}

/**
 * Request a password reset email.
 */
export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>({
    method: 'POST',
    url: '/auth/forgot-password',
    body: { email },
  }).then((res) => res.data);
}
