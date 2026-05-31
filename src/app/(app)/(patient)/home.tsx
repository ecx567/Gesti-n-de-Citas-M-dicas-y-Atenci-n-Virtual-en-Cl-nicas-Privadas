import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/ctx';
import { useAppointments } from '@/hooks/useAppointments';
import type { Appointment } from '@/types/appointment';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmada', color: '#16A34A', bg: '#F0FDF4' },
  pending: { label: 'Pendiente', color: '#D97706', bg: '#FFFBEB' },
  cancelled: { label: 'Cancelada', color: '#DC2626', bg: '#FEF2F2' },
} as const;

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onBook }: { onBook: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>Sin citas próximas</Text>
      <Text style={styles.emptySubtitle}>
        No tienes citas agendadas. {String.fromCodePoint(0x1f44d)}
      </Text>
      <Pressable style={styles.emptyCta} onPress={onBook}>
        <Text style={styles.emptyCtaText}>Reservar Cita</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Appointment card
// ---------------------------------------------------------------------------

function AppointmentCard({
  appointment,
}: {
  appointment: Appointment;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="medkit-outline" size={24} color="#0891B2" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardDoctor}>{appointment.doctorName}</Text>
          <Text style={styles.cardSpecialty}>{appointment.specialty}</Text>
        </View>
        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardDetails}>
        <View style={styles.cardDetailRow}>
          <Ionicons name="calendar-outline" size={18} color="#64748B" />
          <Text style={styles.cardDetailText}>{appointment.date}</Text>
        </View>
        <View style={styles.cardDetailRow}>
          <Ionicons name="time-outline" size={18} color="#64748B" />
          <Text style={styles.cardDetailText}>{appointment.time}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Home screen
// ---------------------------------------------------------------------------

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: appointments, isLoading, error } = useAppointments();

  const upcoming = appointments?.filter((a) => a.status !== 'cancelled')[0] ?? null;

  const handleBookAppointment = () => {
    router.push('/book-appointment');
  };

  const handleViewAll = () => {
    router.push('/appointments');
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {`¡Hola, ${user?.name ?? ''}!`}
          </Text>
        </View>
        <ActivityIndicator size="large" color="#0891B2" style={styles.loader} />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {`¡Hola, ${user?.name ?? ''}!`}
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
          <Text style={styles.errorText}>No se pudieron cargar las citas.</Text>
          <Text style={styles.errorSubtext}>Deslizá hacia abajo para reintentar.</Text>
        </View>
      </ScrollView>
    );
  }

  if (!upcoming) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {`¡Hola, ${user?.name ?? ''}!`}
          </Text>
        </View>
        <EmptyState onBook={handleBookAppointment} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>
          {`¡Hola, ${user?.name ?? ''}!`}
        </Text>
        <Text style={styles.greetingSub}>Bienvenido a VitaCitas</Text>
      </View>

      {/* Section title */}
      <Text style={styles.sectionTitle}>Próxima Cita</Text>

      {/* Appointment card */}
      <Pressable onPress={() => router.push(`/appointment/${upcoming.id}`)}>
        <AppointmentCard appointment={upcoming} />
      </Pressable>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={({ pressed }) => [
            styles.quickActionPrimary,
            pressed && styles.quickActionPressed,
          ]}
          onPress={handleBookAppointment}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.quickActionPrimaryText}>Reservar Cita</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.quickActionSecondary,
            pressed && styles.quickActionSecondaryPressed,
          ]}
          onPress={handleViewAll}
        >
          <Ionicons name="list-outline" size={22} color="#0891B2" />
          <Text style={styles.quickActionSecondaryText}>Ver Todas</Text>
        </Pressable>
      </View>
    </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    gap: 20,
  },

  // Greeting
  greetingSection: {
    gap: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  greetingSub: {
    fontSize: 15,
    color: '#64748B',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: -4,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardSpecialty: {
    fontSize: 13,
    color: '#64748B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  cardDetails: {
    gap: 10,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardDetailText: {
    fontSize: 14,
    color: '#334155',
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Loader
  loader: {
    marginTop: 40,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  // Quick actions
  quickActions: {
    gap: 12,
    marginTop: 4,
  },
  quickActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0891B2',
    paddingVertical: 16,
    borderRadius: 14,
  },
  quickActionPressed: {
    opacity: 0.8,
  },
  quickActionPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionSecondaryPressed: {
    backgroundColor: '#F8FAFC',
  },
  quickActionSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891B2',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 12,
    backgroundColor: '#0891B2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyCtaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
