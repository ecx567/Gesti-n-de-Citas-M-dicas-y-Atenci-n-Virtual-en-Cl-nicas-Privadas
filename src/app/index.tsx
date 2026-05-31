import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/ctx';

/**
 * Root index screen.
 *
 * - loading   → branded splash
 * - unauthenticated → let the auth guard in _layout.tsx handle redirect to login
 * - authenticated   → redirect to patient home
 *
 * MUST handle all three states explicitly because root index.tsx
 * shadows (app)/index.tsx — returning null would leave a blank screen.
 */
export default function SplashScreen() {
  const { session } = useAuth();

  if (session === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0891B2" />
        <Text style={styles.text}>VitaCitas</Text>
      </View>
    );
  }

  if (session === 'authenticated') {
    return <Redirect href="/(app)/(patient)/home" />;
  }

  // unauthenticated — return null to let the auth guard redirect to login
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0F172A',
  },
});
