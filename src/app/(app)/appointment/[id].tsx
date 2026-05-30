import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppointment } from '@/hooks/useAppointments';
import type { ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmada',
    color: '#16A34A',
    bg: '#F0FDF4',
    icon: 'checkmark-circle' as const,
  },
  pending: {
    label: 'Pendiente',
    color: '#D97706',
    bg: '#FFFBEB',
    icon: 'time-outline' as const,
  },
  cancelled: {
    label: 'Cancelada',
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: 'close-circle' as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Detail row component
// ---------------------------------------------------------------------------

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.row}>
      <View style={detailStyles.iconBox as ViewStyle}>
        <Ionicons name={icon} size={20} color="#0891B2" />
      </View>
      <View style={detailStyles.textCol}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: appointment, isLoading } = useAppointment(id ?? '');

  if (isLoading) {
    return (
      <View style={notFoundStyles.container}>
        <ActivityIndicator size="large" color="#0891B2" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={notFoundStyles.container}>
        <Stack.Screen
          options={{
            title: 'Cita no encontrada',
            headerBackTitle: 'Volver',
          }}
        />
        <Ionicons name="search-outline" size={64} color="#CBD5E1" />
        <Text style={notFoundStyles.title}>Cita no encontrada</Text>
        <Text style={notFoundStyles.subtitle}>No encontramos una cita con el ID "{id}".</Text>
        <Pressable style={notFoundStyles.button} onPress={() => router.back()}>
          <Text style={notFoundStyles.buttonText}>Volver a Mis Citas</Text>
        </Pressable>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[appointment.status];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Detalle de Cita',
          headerBackTitle: 'Volver',
        }}
      />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon} size={24} color={statusCfg.color} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>

        {/* Doctor info card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorAvatar}>
            <Ionicons name="person" size={32} color="#0891B2" />
          </View>
          <View>
            <Text style={styles.doctorName}>{appointment.doctorName}</Text>
            <Text style={styles.doctorSpecialty}>{appointment.specialty}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <DetailRow icon="calendar-outline" label="Fecha" value={appointment.date} />
          <DetailRow icon="time-outline" label="Hora" value={appointment.time} />
          <DetailRow icon="location-outline" label="Ubicación" value={appointment.location} />
        </View>

        {/* Notes */}
        {appointment.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notas</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
});

// ---------------------------------------------------------------------------
// Not-found styles
// ---------------------------------------------------------------------------

const notFoundStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#0891B2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
