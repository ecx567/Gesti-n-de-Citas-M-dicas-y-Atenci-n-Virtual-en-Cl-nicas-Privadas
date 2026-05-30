// src/api/appointments/endpoints.ts

import { apiClient } from '@/api/client';
import type {
  ApiResponse,
  AppointmentApi,
  CreateAppointmentPayload,
  PaginatedResponse,
} from './types';

/**
 * Fetch a paginated, optionally filtered list of appointments.
 */
export function fetchAppointments(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AppointmentApi>> {
  return apiClient<PaginatedResponse<AppointmentApi>>({
    method: 'GET',
    url: '/appointments',
    authenticated: true,
    params,
  }).then((res) => res.data);
}

/**
 * Fetch a single appointment by ID.
 */
export function fetchAppointment(id: string): Promise<AppointmentApi> {
  return apiClient<ApiResponse<AppointmentApi>>({
    method: 'GET',
    url: `/appointments/${id}`,
    authenticated: true,
  }).then((res) => res.data.data);
}

/**
 * Create a new appointment.
 */
export function createAppointment(payload: CreateAppointmentPayload): Promise<AppointmentApi> {
  return apiClient<ApiResponse<AppointmentApi>>({
    method: 'POST',
    url: '/appointments',
    body: payload,
    authenticated: true,
  }).then((res) => res.data.data);
}

/**
 * Cancel an appointment by ID.
 */
export function cancelAppointment(id: string): Promise<void> {
  return apiClient<void>({
    method: 'DELETE',
    url: `/appointments/${id}`,
    authenticated: true,
  }).then(() => undefined);
}
