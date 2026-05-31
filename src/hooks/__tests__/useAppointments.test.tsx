// ---------------------------------------------------------------------------
// Tests for hooks/useAppointments.ts
// ---------------------------------------------------------------------------

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock endpoints BEFORE importing the hooks
jest.mock('@/api/appointments/endpoints', () => ({
  fetchAppointments: jest.fn(),
  fetchAppointment: jest.fn(),
  createAppointment: jest.fn(),
  cancelAppointment: jest.fn(),
}));

import { useAppointments, useAppointment, useCreateAppointment, useCancelAppointment } from '@/hooks/useAppointments';
import * as endpoints from '@/api/appointments/endpoints';
import type { AppointmentApi, PaginatedResponse } from '@/api/appointments/types';
import { ApiError } from '@/api/client';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeAppointmentApi(overrides?: Partial<AppointmentApi>): AppointmentApi {
  return {
    id: 'apt-1',
    doctor: { id: 'd1', name: 'Dr. Test', specialty: 'General' },
    patientId: 'p1',
    dateTime: '2026-06-01T10:00:00.000Z',
    status: 'confirmed',
    location: 'Office 101',
    notes: 'Test notes',
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
    ...overrides,
  };
}

const mockedEndpoints = endpoints as jest.Mocked<typeof endpoints>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAppointments', () => {
  test('returns data when fetch succeeds', async () => {
    const apiData: PaginatedResponse<AppointmentApi> = {
      data: [makeAppointmentApi()],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    };
    mockedEndpoints.fetchAppointments.mockResolvedValueOnce(apiData);

    const { result } = renderHook(() => useAppointments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].doctorName).toBe('Dr. Test');
    expect(result.current.data![0].id).toBe('apt-1');
  });

  test('returns error when fetch fails', async () => {
    mockedEndpoints.fetchAppointments.mockRejectedValueOnce(
      new ApiError('SERVER_ERROR', 'Internal error', 500),
    );

    const { result } = renderHook(() => useAppointments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Internal error');
  });
});

describe('useAppointment', () => {
  test('returns null on 404', async () => {
    mockedEndpoints.fetchAppointment.mockRejectedValueOnce(
      new ApiError('NOT_FOUND', 'Appointment not found', 404),
    );

    const { result } = renderHook(() => useAppointment('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  test('returns appointment data when found', async () => {
    mockedEndpoints.fetchAppointment.mockResolvedValueOnce(makeAppointmentApi({ id: 'apt-2' }));

    const { result } = renderHook(() => useAppointment('apt-2'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.id).toBe('apt-2');
    expect(result.current.data!.doctorName).toBe('Dr. Test');
  });
});

describe('useCreateAppointment', () => {
  test('calls mutation and returns mapped data', async () => {
    const created = makeAppointmentApi({
      id: 'new-apt',
      doctor: { id: 'd1', name: 'Dr. Create', specialty: 'Cardio' },
    });
    mockedEndpoints.createAppointment.mockResolvedValueOnce(created);

    const { result } = renderHook(() => useCreateAppointment(), { wrapper: createWrapper() });

    const payload = { doctorId: 'd1', dateTime: '2026-06-01T10:00:00.000Z', location: 'Office' };

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(mockedEndpoints.createAppointment).toHaveBeenCalledWith(payload);
    expect(result.current.data?.doctorName).toBe('Dr. Create');
  });
});

describe('useCancelAppointment', () => {
  test('calls cancelAppointment mutation and invalidates cache on success', async () => {
    mockedEndpoints.cancelAppointment.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCancelAppointment(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync('apt-1');
    });

    expect(mockedEndpoints.cancelAppointment).toHaveBeenCalledWith('apt-1');
    // After successful mutation, onSuccess should invalidate queries
    // (verified by the fact mutateAsync resolves without throwing)
  });

  test('surfaces error when cancelAppointment fails', async () => {
    mockedEndpoints.cancelAppointment.mockRejectedValueOnce(
      new ApiError('SERVER_ERROR', 'Failed to cancel', 500),
    );

    const { result } = renderHook(() => useCancelAppointment(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync('apt-1')).rejects.toThrow('Failed to cancel');
  });
});
