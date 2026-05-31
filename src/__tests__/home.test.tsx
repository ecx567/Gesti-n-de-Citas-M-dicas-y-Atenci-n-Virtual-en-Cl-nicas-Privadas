// ---------------------------------------------------------------------------
// Tests for PatientHomeScreen (home.tsx)
// ---------------------------------------------------------------------------

import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock the auth context
jest.mock('@/ctx', () => ({
  useAuth: jest.fn(),
}));

// Mock appointments endpoint (used by useAppointments hook)
jest.mock('@/api/appointments/endpoints', () => ({
  fetchAppointments: jest.fn(),
  fetchAppointment: jest.fn(),
  createAppointment: jest.fn(),
  cancelAppointment: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { useAuth } from '@/ctx';
import * as endpoints from '@/api/appointments/endpoints';
import type { AppointmentApi, PaginatedResponse } from '@/api/appointments/types';

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedEndpoints = endpoints as jest.Mocked<typeof endpoints>;

// ---------------------------------------------------------------------------
// Helpers
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function mockUser() {
  mockedAuth.mockReturnValue({
    user: { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'patient' },
    session: 'authenticated' as const,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  });
}

function mockUserNull() {
  mockedAuth.mockReturnValue({
    user: null,
    session: 'unauthenticated' as const,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PatientHomeScreen', () => {
  test('shows loading indicator while fetching appointments', async () => {
    mockUser();

    // Never resolve — keep loading
    mockedEndpoints.fetchAppointments.mockReturnValue(new Promise(() => {}));

    const HomeScreen = require('@/app/(app)/(patient)/home').default;

    render(<HomeScreen />, { wrapper: createWrapper() });

    // Should show greeting and loading spinner
    expect(screen.getByText('¡Hola, Test User!')).toBeTruthy();
  });

  test('displays upcoming appointment data', async () => {
    mockUser();

    const apiData: PaginatedResponse<AppointmentApi> = {
      data: [makeAppointmentApi()],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    };
    mockedEndpoints.fetchAppointments.mockResolvedValueOnce(apiData);

    const HomeScreen = require('@/app/(app)/(patient)/home').default;

    render(<HomeScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Dr. Test')).toBeTruthy();
    });

    expect(screen.getByText('Próxima Cita')).toBeTruthy();
  });

  test('shows empty state when no future appointments', async () => {
    mockUser();

    const apiData: PaginatedResponse<AppointmentApi> = {
      data: [],
      meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
    mockedEndpoints.fetchAppointments.mockResolvedValueOnce(apiData);

    const HomeScreen = require('@/app/(app)/(patient)/home').default;

    render(<HomeScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Sin citas próximas')).toBeTruthy();
    });

    expect(screen.getByText('Reservar Cita')).toBeTruthy();
  });

  test('shows error fallback when fetch fails', async () => {
    mockUser();

    mockedEndpoints.fetchAppointments.mockRejectedValueOnce(new Error('Network error'));

    const HomeScreen = require('@/app/(app)/(patient)/home').default;

    render(<HomeScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las citas.')).toBeTruthy();
    });
  });

  test('greets with user name', async () => {
    mockUser();

    const apiData: PaginatedResponse<AppointmentApi> = {
      data: [],
      meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
    mockedEndpoints.fetchAppointments.mockResolvedValueOnce(apiData);

    const HomeScreen = require('@/app/(app)/(patient)/home').default;

    render(<HomeScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('¡Hola, Test User!')).toBeTruthy();
    });
  });

  test('handles null user gracefully', async () => {
    mockUserNull();

    const apiData: PaginatedResponse<AppointmentApi> = {
      data: [],
      meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
    mockedEndpoints.fetchAppointments.mockResolvedValueOnce(apiData);

    const HomeScreen = require('@/app/(app)/(patient)/home').default;

    render(<HomeScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('¡Hola, !')).toBeTruthy();
    });
  });
});
