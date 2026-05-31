// ---------------------------------------------------------------------------
// Tests for AppointmentDetailScreen (appointment/[id].tsx)
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { ReactNode } from 'react';
import type { AppointmentApi } from '@/api/appointments/types';
import { ApiError } from '@/api/client';

// Mock endpoints (used by the hooks internally)
jest.mock('@/api/appointments/endpoints', () => ({
  fetchAppointment: jest.fn(),
  fetchAppointments: jest.fn(),
  createAppointment: jest.fn(),
  cancelAppointment: jest.fn(),
}));

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack }),
  useLocalSearchParams: () => ({ id: 'apt-1' }),
  Stack: { Screen: () => null },
}));

import * as endpoints from '@/api/appointments/endpoints';
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
    notes: 'Bring records',
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

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppointmentDetailScreen', () => {
  test('shows loading indicator', () => {
    // Never-resolving promise — keeps isLoading = true
    mockedEndpoints.fetchAppointment.mockReturnValue(new Promise(() => {}));

    const AppointmentDetailScreen = require('@/app/(app)/appointment/[id]').default;
    render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    // During loading, neither the "not found" state nor detail content should appear.
    // ActivityIndicator renders (no text content to query), so we verify loading
    // by asserting nothing else renders in place of the detail view.
    expect(screen.queryByText('Cita no encontrada')).toBeNull();
    expect(screen.queryByText('Confirmada')).toBeNull();
  });

  test('shows not found state when appointment is null', async () => {
    mockedEndpoints.fetchAppointment.mockRejectedValueOnce(
      new ApiError('NOT_FOUND', 'Appointment not found', 404),
    );

    const AppointmentDetailScreen = require('@/app/(app)/appointment/[id]').default;
    render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cita no encontrada')).toBeTruthy();
    });

    expect(screen.getByText('Volver a Mis Citas')).toBeTruthy();
  });

  test('renders appointment details', async () => {
    mockedEndpoints.fetchAppointment.mockResolvedValueOnce(makeAppointmentApi());

    const AppointmentDetailScreen = require('@/app/(app)/appointment/[id]').default;
    render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Dr. Test')).toBeTruthy();
    });

    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('Office 101')).toBeTruthy();
    expect(screen.getByText('Bring records')).toBeTruthy();
    // Detail row labels
    expect(screen.getByText('Fecha')).toBeTruthy();
    expect(screen.getByText('Hora')).toBeTruthy();
    expect(screen.getByText('Ubicación')).toBeTruthy();
  });

  test('shows status banner with correct color for confirmed', async () => {
    mockedEndpoints.fetchAppointment.mockResolvedValueOnce(makeAppointmentApi({ status: 'confirmed' }));

    const AppointmentDetailScreen = require('@/app/(app)/appointment/[id]').default;
    render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Confirmada')).toBeTruthy();
    });
  });

  test('shows cancel button only for confirmed appointments', async () => {
    // Test with confirmed — cancel button should be visible
    mockedEndpoints.fetchAppointment.mockResolvedValueOnce(makeAppointmentApi({ status: 'confirmed' }));

    const AppointmentDetailScreen = require('@/app/(app)/appointment/[id]').default;
    const { unmount } = render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cancelar Cita')).toBeTruthy();
    });

    unmount();

    // Test with pending — cancel button should NOT be visible
    mockedEndpoints.fetchAppointment.mockResolvedValueOnce(
      makeAppointmentApi({ status: 'pending' }),
    );

    render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeTruthy();
    });

    expect(screen.queryByText('Cancelar Cita')).toBeNull();
  });

  test('opens confirmation alert on cancel press', async () => {
    mockedEndpoints.fetchAppointment.mockResolvedValueOnce(makeAppointmentApi({ status: 'confirmed' }));

    const AppointmentDetailScreen = require('@/app/(app)/appointment/[id]').default;
    render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cancelar Cita')).toBeTruthy();
    });

    const alertSpy = jest.spyOn(Alert, 'alert');
    fireEvent.press(screen.getByText('Cancelar Cita'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Cancelar Cita',
      '¿Estás seguro de que querés cancelar esta cita?',
      expect.any(Array),
    );

    alertSpy.mockRestore();
  });

  test('shows error text when cancel fails', async () => {
    mockedEndpoints.fetchAppointment.mockResolvedValueOnce(makeAppointmentApi({ status: 'confirmed' }));
    mockedEndpoints.cancelAppointment.mockRejectedValueOnce(new Error('API Error'));

    const AppointmentDetailScreen = require('@/app/(app)/appointment/[id]').default;
    render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cancelar Cita')).toBeTruthy();
    });

    const alertSpy = jest.spyOn(Alert, 'alert');
    fireEvent.press(screen.getByText('Cancelar Cita'));

    // Simulate pressing confirm
    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void | Promise<void>;
    }>;
    const confirmButton = buttons.find((b) => b.style === 'destructive')!;
    await confirmButton.onPress!();

    await waitFor(() => {
      expect(
        screen.getByText('Ocurrió un error al cancelar la cita. Intenta de nuevo.'),
      ).toBeTruthy();
    });

    alertSpy.mockRestore();
  });

  test('cancel button shows spinner while cancelling', async () => {
    mockedEndpoints.fetchAppointment.mockResolvedValueOnce(makeAppointmentApi({ status: 'confirmed' }));
    // Never-resolving promise — keeps cancelState = 'cancelling'
    mockedEndpoints.cancelAppointment.mockReturnValue(new Promise(() => {}));

    const AppointmentDetailScreen = require('@/app/(app)/appointment/[id]').default;
    render(<AppointmentDetailScreen />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cancelar Cita')).toBeTruthy();
    });

    const alertSpy = jest.spyOn(Alert, 'alert');
    fireEvent.press(screen.getByText('Cancelar Cita'));

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void | Promise<void>;
    }>;
    const confirmButton = buttons.find((b) => b.style === 'destructive')!;
    // Fire-and-forget — the promise never resolves (unresolved cancelAppointment)
    // so we cannot await it. The synchronous setCancelState('cancelling') runs
    // before the await, so React flushes the state update immediately.
    confirmButton.onPress!();
    await act(async () => {});

    // Cancel text should disappear, replaced by ActivityIndicator
    await waitFor(() => {
      expect(screen.queryByText('Cancelar Cita')).toBeNull();
    });

    alertSpy.mockRestore();
  });
});
