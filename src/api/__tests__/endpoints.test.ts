// ---------------------------------------------------------------------------
// Tests for api/auth/endpoints.ts and api/appointments/endpoints.ts
// ---------------------------------------------------------------------------

import * as client from '@/api/client';
import { login, register, refreshToken, logout, forgotPassword } from '@/api/auth/endpoints';
import {
  fetchAppointments,
  fetchAppointment,
  createAppointment,
  cancelAppointment,
} from '@/api/appointments/endpoints';
import { BASE_URL } from '@/api/config';

// ---------------------------------------------------------------------------
// Mock apiClient at module level
// ---------------------------------------------------------------------------

const mockApiClient = jest.spyOn(client, 'apiClient').mockResolvedValue({
  data: {},
  response: { status: 200 } as Response,
});

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

describe('auth endpoints', () => {
  test('login calls apiClient with POST /auth/login', async () => {
    const credentials = { email: 'test@example.com', password: 'secret123' };
    await login(credentials);

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/login',
      body: credentials,
    });
  });

  test('register calls apiClient with POST /auth/register', async () => {
    const data = { name: 'Test', email: 'test@example.com', password: 'secret123' };
    await register(data);

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/register',
      body: data,
    });
  });

  test('refreshToken calls apiClient with POST /auth/refresh', async () => {
    const token = 'refresh-token-123';
    mockApiClient.mockResolvedValueOnce({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 3600 },
      response: { status: 200 } as Response,
    });

    await refreshToken(token);

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/refresh',
      body: { refreshToken: token },
    });
  });

  test('logout calls apiClient with POST /auth/logout authenticated', async () => {
    const token = 'refresh-token-123';
    mockApiClient.mockResolvedValueOnce({
      data: undefined,
      response: { status: 204 } as Response,
    });

    await logout(token);

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/logout',
      body: { refreshToken: token },
      authenticated: true,
    });
  });

  test('forgotPassword calls apiClient with POST /auth/forgot-password', async () => {
    const email = 'user@example.com';
    mockApiClient.mockResolvedValueOnce({
      data: { message: 'Email sent' },
      response: { status: 200 } as Response,
    });

    await forgotPassword(email);

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/forgot-password',
      body: { email },
    });
  });
});

// ---------------------------------------------------------------------------
// Appointments endpoints
// ---------------------------------------------------------------------------

describe('appointments endpoints', () => {
  test('fetchAppointments calls apiClient with GET /appointments', async () => {
    await fetchAppointments();

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'GET',
      url: '/appointments',
      authenticated: true,
      params: undefined,
    });
  });

  test('fetchAppointments passes params', async () => {
    await fetchAppointments({ status: 'confirmed', page: 1, limit: 20 });

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'GET',
      url: '/appointments',
      authenticated: true,
      params: { status: 'confirmed', page: 1, limit: 20 },
    });
  });

  test('fetchAppointment calls apiClient with GET /appointments/:id', async () => {
    mockApiClient.mockResolvedValueOnce({
      data: { data: { id: 'apt-1', doctor: { name: 'Dr. Test', specialty: 'General' } } },
      response: { status: 200 } as Response,
    });

    await fetchAppointment('apt-1');

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'GET',
      url: '/appointments/apt-1',
      authenticated: true,
    });
  });

  test('createAppointment calls apiClient with POST /appointments', async () => {
    const payload = {
      doctorId: 'd1',
      dateTime: '2026-06-01T10:00:00',
      location: 'Office',
      notes: 'Test',
    };
    mockApiClient.mockResolvedValueOnce({
      data: { data: { id: 'new-apt', doctor: { name: 'Dr.', specialty: 'General' } } },
      response: { status: 201 } as Response,
    });

    await createAppointment(payload);

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'POST',
      url: '/appointments',
      body: payload,
      authenticated: true,
    });
  });

  test('cancelAppointment calls apiClient with DELETE /appointments/:id', async () => {
    mockApiClient.mockResolvedValueOnce({
      data: undefined,
      response: { status: 204 } as Response,
    });

    await cancelAppointment('apt-1');

    expect(mockApiClient).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/appointments/apt-1',
      authenticated: true,
    });
  });
});
