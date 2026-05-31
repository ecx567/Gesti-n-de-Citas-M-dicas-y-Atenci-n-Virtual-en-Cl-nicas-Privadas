import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppointment, useCancelAppointment } from '@/hooks/useAppointments';
import type { ViewStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmada',
    color: colors.success,
    bg: colors.successBg,
    icon: 'checkmark-circle' as const,
  },
  pending: {
    label: 'Pendiente',
    color: colors.warning,
    bg: colors.warningBg,
    icon: 'time-outline' as const,
  },
  cancelled: {
    label: 'Cancelada',
    color: colors.error,
    bg: colors.errorBg,
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
        <Ionicons name={icon} size={20} color={colors.primary} />
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
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: appointment, isLoading } = useAppointment(id ?? '');
  const cancelMutation = useCancelAppointment();
  const [cancelState, setCancelState] = useState<'idle' | 'cancelling' | 'error'>('idle');

  function handleCancel() {
    Alert.alert('Cancelar Cita', '¿Estás seguro de que querés cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, Cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancelState('cancelling');
          try {
            await cancelMutation.mutateAsync(id!);
            setCancelState('idle');
          } catch {
            setCancelState('error');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={notFoundStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <Ionicons name="search-outline" size={64} color={colors.disabled} />
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
            <Ionicons name="person" size={32} color={colors.primary} />
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

        {/* Cancel button — only for confirmed appointments */}
        {appointment.status === 'confirmed' ? (
          <View style={styles.cancelSection}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
                cancelState === 'cancelling' && styles.cancelButtonDisabled,
              ]}
              onPress={handleCancel}
              disabled={cancelState === 'cancelling'}
            >
              {cancelState === 'cancelling' ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color={colors.white} />
                  <Text style={styles.cancelButtonText}>Cancelar Cita</Text>
                </>
              )}
            </Pressable>

            {cancelState === 'error' ? (
              <Text style={styles.cancelErrorText}>
                Ocurrió un error al cancelar la cita. Intenta de nuevo.
              </Text>
            ) : null}
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
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statusText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.card,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  doctorSpecialty: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.card,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.card,
  },
  notesTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  notesText: {
    fontSize: fontSize.lg,
    color: colors.text,
    lineHeight: 22,
  },

  // Cancel section
  cancelSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    minHeight: 52,
  },
  cancelButtonPressed: {
    opacity: 0.85,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  cancelErrorText: {
    color: colors.error,
    fontSize: fontSize.md,
    textAlign: 'center',
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
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  buttonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
});
