import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="medkit" size={48} color="#0891B2" />
      </View>
      <Text style={styles.appName}>VitaCitas</Text>
      <Text style={styles.version}>Versión 1.0.0</Text>
      <Text style={styles.description}>
        App móvil inteligente para gestión de citas y atención virtual en
        clínicas privadas.
      </Text>
      <View style={styles.divider} />
      <Text style={styles.copyright}>
        © 2026 Universidad Estatal de Milagro (UNEMI)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 8,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  version: {
    fontSize: 14,
    color: '#94A3B8',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  copyright: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
