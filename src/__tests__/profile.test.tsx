// ---------------------------------------------------------------------------
// Tests for ProfileScreen (profile.tsx)
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
}));

jest.mock('@/ctx', () => ({ useAuth: jest.fn() }));

import { useAuth } from '@/ctx';
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfileScreen', () => {
  function setupUser(overrides?: Partial<ReturnType<typeof useAuth>>) {
    const defaultAuth: ReturnType<typeof useAuth> = {
      user: { id: 'u1', name: 'Erick Test', email: 'erick@test.com', role: 'patient' },
      session: 'authenticated',
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    };
    mockedAuth.mockReturnValue({ ...defaultAuth, ...overrides });
  }

  test('renders user data from context', () => {
    setupUser();
    const ProfileScreen = require('@/app/(app)/profile').default;
    render(<ProfileScreen />);

    expect(screen.getByText('Erick Test')).toBeTruthy();
    expect(screen.getByText('erick@test.com')).toBeTruthy();
    expect(screen.getByText('patient')).toBeTruthy();
  });

  test('renders menu items with correct navigation', () => {
    setupUser();
    const ProfileScreen = require('@/app/(app)/profile').default;
    render(<ProfileScreen />);

    expect(screen.getByText('Editar Perfil')).toBeTruthy();
    expect(screen.getByText('Configuración')).toBeTruthy();
    expect(screen.getByText('Acerca de')).toBeTruthy();

    fireEvent.press(screen.getByText('Editar Perfil'));
    expect(mockRouterPush).toHaveBeenCalledWith('/edit-profile');

    fireEvent.press(screen.getByText('Configuración'));
    expect(mockRouterPush).toHaveBeenCalledWith('/settings');

    fireEvent.press(screen.getByText('Acerca de'));
    expect(mockRouterPush).toHaveBeenCalledWith('/about');
  });

  test('shows logout confirmation and logs out on confirm', async () => {
    const logoutMock = jest.fn().mockResolvedValue(undefined);
    setupUser({ logout: logoutMock });

    const ProfileScreen = require('@/app/(app)/profile').default;
    render(<ProfileScreen />);

    const alertSpy = jest.spyOn(Alert, 'alert');

    fireEvent.press(screen.getByText('Cerrar Sesión'));

    // Spy should have been called with title, message, and buttons
    expect(alertSpy).toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void | Promise<void>;
    }>;

    const confirmButton = buttons.find((b) => b.style === 'destructive')!;
    await confirmButton.onPress!();

    expect(logoutMock).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/');

    await waitFor(() => {
      expect(screen.getByText('Cerrando sesión...')).toBeTruthy();
    });

    alertSpy.mockRestore();
  });

  test('does not log out when cancel is pressed in alert', () => {
    const logoutMock = jest.fn();
    setupUser({ logout: logoutMock });

    const ProfileScreen = require('@/app/(app)/profile').default;
    render(<ProfileScreen />);

    const alertSpy = jest.spyOn(Alert, 'alert');

    fireEvent.press(screen.getByText('Cerrar Sesión'));

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void;
    }>;

    const cancelButton = buttons.find((b) => b.style === 'cancel')!;
    cancelButton.onPress?.();

    expect(logoutMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Cerrando sesión...')).toBeNull();

    alertSpy.mockRestore();
  });
});
