import { Stack } from 'expo-router';

/**
 * Auth group layout — wraps login, register, and forgot-password screens
 * in a styled Stack navigator with a clean header.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0891B2',
        headerTitleStyle: { fontWeight: '600', color: '#0F172A' },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Iniciar Sesión' }} />
      <Stack.Screen name="register" options={{ title: 'Crear Cuenta' }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: 'Recuperar Contraseña' }}
      />
    </Stack>
  );
}
