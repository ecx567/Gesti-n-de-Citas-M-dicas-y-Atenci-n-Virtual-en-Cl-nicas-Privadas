// src/api/users/endpoints.ts

import { apiClient } from '@/api/client';
import type { UserProfile, UpdateProfilePayload } from './types';

/**
 * Fetch the current authenticated user's profile.
 * GET /users/me → UserProfile
 */
export function fetchProfile(): Promise<UserProfile> {
  return apiClient<UserProfile>({
    method: 'GET',
    url: '/users/me',
    authenticated: true,
  }).then((res) => res.data);
}

/**
 * Update user profile fields.
 * PUT /users/:id → UserProfile
 */
export function updateProfile(
  id: string,
  data: UpdateProfilePayload,
): Promise<UserProfile> {
  return apiClient<UserProfile>({
    method: 'PUT',
    url: `/users/${id}`,
    body: data,
    authenticated: true,
  }).then((res) => res.data);
}
