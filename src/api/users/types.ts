// src/api/users/types.ts

import type { User } from '@/api/auth/types';

/**
 * Extended user profile returned by GET /users/me and PUT /users/:id.
 * Extends the auth `User` with phone and timestamps.
 */
export interface UserProfile extends User {
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for PUT /users/:id — all fields optional.
 */
export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string | null;
  currentPassword?: string;
  newPassword?: string;
}
