import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/ctx';

/**
 * Inner layout that reads auth state and conditionally renders.
 * - Loading → shows nothing (the splash screen at index.tsx handles UI)
 * - Otherwise → renders the current route via <Stack />
 */
function RootLayoutNav() {
  const { session } = useAuth();

  if (session === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <ActivityIndicator size="large" color="#0891B2" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}

/**
 * Root layout — wraps every screen in the auth context provider.
 * Auth screens (login, register) and app screens (tabs, home) will be
 * added in subsequent PRs as child route groups.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
