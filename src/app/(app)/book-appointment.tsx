import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useSpecialties, useDoctors } from '@/hooks/useDoctors';
import { ApiError } from '@/api/client';

// ---------------------------------------------------------------------------
// Date/time helpers
// ---------------------------------------------------------------------------

interface DayOption {
  label: string;
  value: string; // YYYY-MM-DD
}

interface TimeSlot {
  label: string;
  value: string; // HH:mm
}

/** Generate the next N days starting from tomorrow, skipping weekends. */
function getNextDays(count: number): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();
  let added = 0;

  for (let i = 1; added < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Skip weekends
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    days.push({
      label: date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      value: date.toISOString().split('T')[0],
    });
    added++;
  }

  return days;
}

/** Generate 1-hour time slots from 08:00 to 17:00, skipping 12:00-13:00 (lunch). */
function getTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 8; h <= 17; h++) {
    if (h >= 12 && h < 14) continue; // lunch break
    const hour = h.toString().padStart(2, '0');
    const displayHour = h > 12 ? h - 12 : h;
    slots.push({
      label: `${displayHour}:00 ${h < 12 ? 'AM' : 'PM'}`,
      value: `${hour}:00`,
    });
  }
  return slots;
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            stepStyles.dot,
            i <= current && stepStyles.dotActive,
            i < current && stepStyles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    backgroundColor: '#0891B2',
    width: 28,
    borderRadius: 5,
  },
  dotDone: {
    backgroundColor: '#0891B2',
  },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BookAppointmentScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string | null>(null); // HH:mm
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateAppointment();

  // Real API data
  const specialtiesQuery = useSpecialties();
  const doctorsQuery = useDoctors(specialty ?? undefined);

  // Generated date/time options
  const dayOptions = useMemo(() => getNextDays(14), []);
  const timeSlots = useMemo(() => getTimeSlots(), []);

  const canNext =
    (step === 0 && specialty) ||
    (step === 1 && doctorId) ||
    (step === 2 && selectedDate) ||
    (step === 3 && selectedTime);

  const handleNext = () => {
    if (!canNext) return;
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleConfirm();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const handleConfirm = async () => {
    if (!doctorId || !selectedDate || !selectedTime) return;
    setError(null);

    try {
      // Build a proper ISO date from selected date + time
      const [year, month, day] = selectedDate.split('-').map(Number);
      const [hour, minute] = selectedTime.split(':').map(Number);
      const dateObj = new Date(year, month - 1, day, hour, minute);

      const appointment = await createMutation.mutateAsync({
        doctorId,
        dateTime: dateObj.toISOString(),
        location: 'Consultorio por asignar',
        notes: 'Cita agendada desde la app.',
      });
      router.push(`/appointment/${appointment.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al crear la cita. Intentá de nuevo.');
      }
    }
  };

  const stepTitles = ['Especialidad', 'Doctor', 'Fecha', 'Horario'];

  return (
    <>
      <Stack.Screen
        options={{
          title: stepTitles[step],
          headerBackTitle: 'Volver',
        }}
      />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <StepIndicator current={step} total={4} />

        <Text style={styles.stepTitle}>{stepTitles[step]}</Text>
        <Text style={styles.stepSubtitle}>
          {step === 0 && 'Seleccioná una especialidad médica'}
          {step === 1 && 'Elegí el doctor de tu preferencia'}
          {step === 2 && 'Seleccioná la fecha para tu cita'}
          {step === 3 && 'Elegí el horario disponible'}
        </Text>

        {/* Step 0: Specialty */}
        {step === 0 && (
          <View style={styles.optionsGrid}>
            {specialtiesQuery.isLoading && (
              <ActivityIndicator size="large" color="#0891B2" style={styles.loader} />
            )}
            {specialtiesQuery.isError && (
              <Text style={styles.errorText}>
                Error al cargar especialidades. Verificá que el servidor esté corriendo.
              </Text>
            )}
            {specialtiesQuery.data?.map((s) => (
              <Pressable
                key={s}
                style={[styles.optionCard, specialty === s && styles.optionCardActive]}
                onPress={() => {
                  setSpecialty(s);
                  setDoctorId(null);
                }}
              >
                <Text style={[styles.optionText, specialty === s && styles.optionTextActive]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 1: Doctor */}
        {step === 1 && specialty && (
          <View style={styles.optionsList}>
            {doctorsQuery.isLoading && (
              <ActivityIndicator size="large" color="#0891B2" style={styles.loader} />
            )}
            {doctorsQuery.data?.map((d) => (
              <Pressable
                key={d.id}
                style={[styles.optionRow, doctorId === d.id && styles.optionRowActive]}
                onPress={() => setDoctorId(d.id)}
              >
                <View style={styles.optionAvatar}>
                  <Ionicons name="person" size={20} color="#0891B2" />
                </View>
                <Text style={[styles.optionRowText, doctorId === d.id && styles.optionTextActive]}>
                  {d.name}
                </Text>
                {doctorId === d.id && (
                  <Ionicons name="checkmark-circle" size={22} color="#0891B2" />
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 2: Date */}
        {step === 2 && (
          <View style={styles.optionsGrid}>
            {dayOptions.map((d) => (
              <Pressable
                key={d.value}
                style={[styles.optionCard, selectedDate === d.value && styles.optionCardActive]}
                onPress={() => setSelectedDate(d.value)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={selectedDate === d.value ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.optionText,
                    selectedDate === d.value && styles.optionTextActive,
                  ]}
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 3: Time */}
        {step === 3 && (
          <View style={styles.optionsGrid}>
            {timeSlots.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.optionCard, selectedTime === t.value && styles.optionCardActive]}
                onPress={() => setSelectedTime(t.value)}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={selectedTime === t.value ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.optionText,
                    selectedTime === t.value && styles.optionTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#64748B" />
            <Text style={styles.backText}>{step === 0 ? 'Cancelar' : 'Atrás'}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.nextButton,
              (!canNext || createMutation.isPending) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canNext || createMutation.isPending}
          >
            <Text style={styles.nextText}>{step === 3 ? 'Confirmar' : 'Siguiente'}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
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
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionCardActive: {
    backgroundColor: '#0891B2',
    borderColor: '#0891B2',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  optionsList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionRowActive: {
    borderColor: '#0891B2',
    backgroundColor: '#F0FDFA',
  },
  optionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0891B2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loader: {
    alignSelf: 'center',
    paddingVertical: 40,
  },
});
