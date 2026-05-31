// src/hooks/useDoctors.ts

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { STALE_TIME } from '@/api/config';
import { fetchSpecialties, fetchDoctors } from '@/api/doctors/endpoints';
import type { DoctorInfo } from '@/api/doctors/types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const doctorKeys = {
  all: ['doctors'] as const,
  specialties: () => ['doctors', 'specialties'] as const,
  list: (specialty?: string) => ['doctors', specialty] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch all available medical specialties.
 */
export function useSpecialties(): UseQueryResult<string[], Error> {
  return useQuery({
    queryKey: doctorKeys.specialties(),
    queryFn: fetchSpecialties,
    staleTime: STALE_TIME * 4, // specialties change rarely
  });
}

/**
 * Fetch doctors, optionally filtered by specialty.
 */
export function useDoctors(specialty?: string): UseQueryResult<DoctorInfo[], Error> {
  return useQuery({
    queryKey: doctorKeys.list(specialty),
    queryFn: () => fetchDoctors(specialty),
    staleTime: STALE_TIME,
    enabled: !!specialty, // only run when a specialty is selected
  });
}
