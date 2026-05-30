import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Appointment } from '@/types/appointment';
import type { ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AppointmentCardProps {
  appointment: Appointment;
}

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

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg } as ViewStyle]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Reusable appointment card displaying doctor info, date, time, and
 * a color-coded status badge. Pressable → navigates to `/appointment/[id]`.
 */
export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/appointment/${appointment.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Header: icon, doctor/specialty, badge */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="medkit-outline" size={24} color="#0891B2" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardDoctor} numberOfLines={1}>
            {appointment.doctorName}
          </Text>
          <Text style={styles.cardSpecialty} numberOfLines={1}>
            {appointment.specialty}
          </Text>
        </View>
        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.cardDivider} />

      {/* Details: date & time */}
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

      {/* Chevron indicator */}
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
  cardPressed: {
    opacity: 0.85,
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevronContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -9,
  },
});
