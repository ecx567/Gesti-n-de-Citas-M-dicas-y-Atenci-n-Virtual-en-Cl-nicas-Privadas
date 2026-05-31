// ---------------------------------------------------------------------------
// Tests for ForgotPasswordScreen (forgot-password.tsx)
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('@/api/auth/endpoints', () => ({
  forgotPassword: jest.fn(),
}));

import * as authEndpoints from '@/api/auth/endpoints';
const mockedEndpoints = authEndpoints as jest.Mocked<typeof authEndpoints>;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ForgotPasswordScreen', () => {
  test('renders form initially', () => {
    const ForgotPasswordScreen = require('@/app/(auth)/forgot-password').default;
    render(<ForgotPasswordScreen />);

    expect(screen.getByText('Recuperar Contraseña')).toBeTruthy();
    expect(screen.getByPlaceholderText('ej: usuario@correo.com')).toBeTruthy();
    expect(screen.getByText('Enviar Instrucciones')).toBeTruthy();
  });

  test('shows validation error on empty email', () => {
    const ForgotPasswordScreen = require('@/app/(auth)/forgot-password').default;
    render(<ForgotPasswordScreen />);

    fireEvent.press(screen.getByText('Enviar Instrucciones'));

    expect(screen.getByText('El correo electrónico es obligatorio')).toBeTruthy();
  });

  test('shows confirmation on success', async () => {
    mockedEndpoints.forgotPassword.mockResolvedValueOnce({ message: 'Email sent' });

    const ForgotPasswordScreen = require('@/app/(auth)/forgot-password').default;
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('ej: usuario@correo.com'),
      'test@example.com',
    );
    fireEvent.press(screen.getByText('Enviar Instrucciones'));

    await waitFor(() => {
      expect(screen.getByText('Correo Enviado')).toBeTruthy();
    });

    // Confirmation view shows the submitted email
    expect(screen.getByText(/test@example\.com/)).toBeTruthy();
    expect(screen.getByText('Volver a Iniciar Sesión')).toBeTruthy();
    expect(mockedEndpoints.forgotPassword).toHaveBeenCalledWith('test@example.com');
  });

  test('shows error message on API failure', async () => {
    mockedEndpoints.forgotPassword.mockRejectedValueOnce(new Error('API Error'));

    const ForgotPasswordScreen = require('@/app/(auth)/forgot-password').default;
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('ej: usuario@correo.com'),
      'test@example.com',
    );
    fireEvent.press(screen.getByText('Enviar Instrucciones'));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Ocurrió un error al enviar el correo. Intenta de nuevo.',
        ),
      ).toBeTruthy();
    });
  });

  test('navigates back to login', () => {
    const ForgotPasswordScreen = require('@/app/(auth)/forgot-password').default;
    render(<ForgotPasswordScreen />);

    fireEvent.press(screen.getByText('← Volver a Iniciar Sesión'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/login');
  });
});
