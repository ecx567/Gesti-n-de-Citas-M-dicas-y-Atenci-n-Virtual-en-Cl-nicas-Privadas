import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/ctx';

/**
 * Inner layout that reads auth state and conditionally renders.
 * - Loading → shows loading indicator
 * - Unauthenticated → redirects to auth group (login)
 * - Authenticated → renders current route via <Stack />
 */
function RootLayoutNav() {
  const { session } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Auth guard: redirect unauthenticated users to the login screen
  useEffect(() => {
    if (session === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, segments, router]);

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
