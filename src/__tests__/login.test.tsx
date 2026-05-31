// ---------------------------------------------------------------------------
// Tests for LoginScreen (login.tsx)
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
}));

jest.mock('@/ctx', () => ({ useAuth: jest.fn() }));

import { useAuth } from '@/ctx';
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMock() {
  const loginMock = jest.fn<() => Promise<void>>();
  mockedUseAuth.mockReturnValue({ login: loginMock } as ReturnType<typeof useAuth>);
  return loginMock;
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

describe('LoginScreen', () => {
  test('renders title and form fields', () => {
    setupMock();
    const LoginScreen = require('@/app/(auth)/login').default;
    render(<LoginScreen />);

    expect(screen.getByText('VitaCitas')).toBeTruthy();
    expect(screen.getByPlaceholderText('ej: usuario@correo.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ingresa tu contraseña')).toBeTruthy();
    expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
  });

  test('shows validation errors when fields are empty', () => {
    setupMock();
    const LoginScreen = require('@/app/(auth)/login').default;
    render(<LoginScreen />);

    fireEvent.press(screen.getByText('Iniciar Sesión'));

    expect(screen.getByText('El correo electrónico es obligatorio')).toBeTruthy();
    expect(screen.getByText('La contraseña es obligatoria')).toBeTruthy();
  });

  test('shows email format error', () => {
    setupMock();
    const LoginScreen = require('@/app/(auth)/login').default;
    render(<LoginScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('ej: usuario@correo.com'),
      'invalid',
    );
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    expect(screen.getByText('Ingresa un correo electrónico válido')).toBeTruthy();
  });

  test('calls login and navigates on success', async () => {
    const loginMock = setupMock();
    loginMock.mockResolvedValueOnce(undefined);

    const LoginScreen = require('@/app/(auth)/login').default;
    render(<LoginScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('ej: usuario@correo.com'),
      'test@example.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Ingresa tu contraseña'),
      'secret123',
    );
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('test@example.com', 'secret123');
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/');
  });

  test('shows general error on login failure', async () => {
    const loginMock = setupMock();
    loginMock.mockRejectedValueOnce(new Error('API Error'));

    const LoginScreen = require('@/app/(auth)/login').default;
    render(<LoginScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('ej: usuario@correo.com'),
      'test@example.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Ingresa tu contraseña'),
      'secret123',
    );
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(
        screen.getByText('Ocurrió un error al iniciar sesión.'),
      ).toBeTruthy();
    });
  });

  test('shows loading state while submitting', async () => {
    const loginMock = setupMock();
    // Return unresolved promise — keeps isSubmitting = true
    loginMock.mockReturnValueOnce(new Promise<void>(() => {}));

    const LoginScreen = require('@/app/(auth)/login').default;
    render(<LoginScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('ej: usuario@correo.com'),
      'test@example.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Ingresa tu contraseña'),
      'secret123',
    );
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    // Button text should be replaced by ActivityIndicator
    expect(screen.queryByText('Iniciar Sesión')).toBeNull();
  });

  test('navigates to forgot-password and register', () => {
    setupMock();
    const LoginScreen = require('@/app/(auth)/login').default;
    render(<LoginScreen />);

    fireEvent.press(screen.getByText('¿Olvidaste tu contraseña?'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/forgot-password');

    fireEvent.press(screen.getByText('Regístrate'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/register');
  });
});
