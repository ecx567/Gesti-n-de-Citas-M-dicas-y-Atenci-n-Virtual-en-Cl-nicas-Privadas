import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/ctx';
import { useAppointments } from '@/hooks/useAppointments';
import type { Appointment } from '@/types/appointment';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmada', color: colors.success, bg: colors.successBg },
  pending: { label: 'Pendiente', color: colors.warning, bg: colors.warningBg },
  cancelled: { label: 'Cancelada', color: colors.error, bg: colors.errorBg },
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
      <Ionicons name="calendar-outline" size={64} color={colors.disabled} />
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
          <Ionicons name="medkit-outline" size={24} color={colors.primary} />
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
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.cardDetailText}>{appointment.date}</Text>
        </View>
        <View style={styles.cardDetailRow}>
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
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
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
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
          <Ionicons name="cloud-offline-outline" size={48} color={colors.disabled} />
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
          <Ionicons name="add-circle-outline" size={22} color={colors.white} />
          <Text style={styles.quickActionPrimaryText}>Reservar Cita</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.quickActionSecondary,
            pressed && styles.quickActionSecondaryPressed,
          ]}
          onPress={handleViewAll}
        >
          <Ionicons name="list-outline" size={22} color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 60,
    gap: spacing.xl,
  },

  // Greeting
  greetingSection: {
    gap: 4,
  },
  greeting: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  greetingSub: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },

  // Section
  sectionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: -4,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.card,
    gap: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardDoctor: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardSpecialty: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
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
    fontSize: fontSize.md,
    color: colors.text,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Loader
  loader: {
    marginTop: 40,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Quick actions
  quickActions: {
    gap: spacing.md,
    marginTop: 4,
  },
  quickActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  quickActionPressed: {
    opacity: 0.8,
  },
  quickActionPrimaryText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  quickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionSecondaryPressed: {
    backgroundColor: colors.background,
  },
  quickActionSecondaryText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
  },
  emptyCtaText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
