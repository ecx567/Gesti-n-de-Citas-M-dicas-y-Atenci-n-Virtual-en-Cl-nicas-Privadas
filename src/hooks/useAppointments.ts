// src/hooks/useAppointments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { STALE_TIME } from '@/api/config';
import {
  fetchAppointments,
  fetchAppointment,
  createAppointment,
  cancelAppointment,
} from '@/api/appointments/endpoints';
import { ApiError } from '@/api/client';
import type { AppointmentApi, CreateAppointmentPayload } from '@/api/appointments/types';
import type { Appointment } from '@/types/appointment';

// ---------------------------------------------------------------------------
// API → Domain mapping
// ---------------------------------------------------------------------------

/**
 * Map API appointment to domain Appointment.
 *
 * NOTE: `date` and `time` are locale-formatted convenience strings
 * (`toLocaleDateString`/`toLocaleTimeString` with `es-ES`).
 * They live in the React Query cache — if locale requirements ever change,
 * invalidate `appointmentKeys.all` to refresh them.
 * Use `dateTime` (raw ISO 8601) for locale-independent access.
 */
function mapAppointment(api: AppointmentApi): Appointment {
  const dateObj = new Date(api.dateTime);

  return {
    id: api.id,
    doctorName: api.doctor.name,
    specialty: api.doctor.specialty,
    date: dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    dateTime: api.dateTime,
    time: dateObj.toLocaleTimeString('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    status: api.status,
    location: api.location,
    notes: api.notes ?? '',
  };
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export interface AppointmentFilters {
  status?: string;
}

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (filters?: AppointmentFilters) => ['appointments', filters] as const,
  detail: (id: string) => ['appointments', id] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated, optionally filtered list of appointments.
 */
export function useAppointments(
  filters?: AppointmentFilters,
): UseQueryResult<Appointment[], Error> {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: async () => {
      const response = await fetchAppointments({
        status: filters?.status,
        page: 1,
        limit: 50,
      });
      return response.data.map(mapAppointment);
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Fetch a single appointment by ID.
 * Returns `null` when the appointment is not found (404).
 */
export function useAppointment(id: string): UseQueryResult<Appointment | null, Error> {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: async () => {
      try {
        const apiAppointment = await fetchAppointment(id);
        return mapAppointment(apiAppointment);
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Create a new appointment and invalidate the appointments list cache on success.
 */
export function useCreateAppointment(): UseMutationResult<
  Appointment,
  Error,
  CreateAppointmentPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAppointmentPayload) => {
      const apiAppointment = await createAppointment(payload);
      return mapAppointment(apiAppointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

/**
 * Cancel an appointment by ID and invalidate the appointments list cache on success.
 */
export function useCancelAppointment(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await cancelAppointment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
