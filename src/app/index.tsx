import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useAuth } from '@/ctx';

/**
 * Root index screen — shown while the auth context resolves the session.
 * Displays a branded splash / loading state.
 */
export default function SplashScreen() {
  const { session } = useAuth();

  if (session !== 'loading') {
    // Session resolved — the layout will handle routing to auth or app.
    // This screen stays mounted briefly until a redirect triggers.
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0891B2" />
      <Text style={styles.text}>VitaCitas</Text>
    </View>
  );
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
