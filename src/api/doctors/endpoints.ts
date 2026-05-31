// src/api/doctors/endpoints.ts

import { apiClient } from '@/api/client';
import type { DoctorInfo } from './types';

/**
 * Fetch all available medical specialties.
 * GET /specialties → string[]
 */
export function fetchSpecialties(): Promise<string[]> {
  return apiClient<string[]>({
    method: 'GET',
    url: '/specialties',
  }).then((res) => res.data);
}

/**
 * Fetch doctors, optionally filtered by specialty.
 * GET /doctors[?specialty=X] → DoctorInfo[]
 */
export function fetchDoctors(specialty?: string): Promise<DoctorInfo[]> {
  return apiClient<DoctorInfo[]>({
    method: 'GET',
    url: '/doctors',
    params: specialty ? { specialty } : undefined,
  }).then((res) => res.data);
}
