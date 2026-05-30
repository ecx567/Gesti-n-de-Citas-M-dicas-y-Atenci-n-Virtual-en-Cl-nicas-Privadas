import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addAppointment } from '@/types/appointment';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const SPECIALTIES = [
  'Medicina General',
  'Cardiología',
  'Pediatría',
  'Dermatología',
  'Oftalmología',
];

const DOCTORS: Record<string, { name: string; id: string }[]> = {
  'Medicina General': [
    { name: 'Dra. María García', id: 'd1' },
    { name: 'Dr. Juan Pérez', id: 'd2' },
  ],
  Cardiología: [
    { name: 'Dr. Carlos López', id: 'd3' },
    { name: 'Dra. Ana Martínez', id: 'd4' },
  ],
  Pediatría: [
    { name: 'Dra. Laura Sánchez', id: 'd5' },
    { name: 'Dr. Pedro Ramírez', id: 'd6' },
  ],
  Dermatología: [
    { name: 'Dra. Carmen Torres', id: 'd7' },
  ],
  Oftalmología: [
    { name: 'Dr. Andrés Vega', id: 'd8' },
  ],
};

const TIME_SLOTS = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
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
  const [doctor, setDoctor] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const canNext =
    (step === 0 && specialty) ||
    (step === 1 && doctor) ||
    (step === 2 && date) ||
    (step === 3 && time);

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

  const handleConfirm = () => {
    const newId = `mock-${Date.now()}`;
    addAppointment({
      id: newId,
      doctorName: doctor!,
      specialty: specialty!,
      date: date!,
      dateTime: `${date!}T${time!}`,
      time: time!,
      status: 'confirmed',
      location: 'Consultorio por asignar',
      notes: 'Cita agendada desde la app.',
    });
    setConfirmedId(newId);
  };

  // Confirmation screen
  if (confirmedId) {
    return (
      <>
        <Stack.Screen options={{ title: 'Cita Confirmada', headerBackButtonDisplayMode: 'minimal' }} />
        <View style={styles.confirmContainer}>
          <View style={styles.confirmIcon}>
            <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
          </View>
          <Text style={styles.confirmTitle}>¡Cita Confirmada!</Text>
          <Text style={styles.confirmSubtitle}>
            {doctor} - {specialty}
          </Text>
          <Text style={styles.confirmDetail}>
            {date} a las {time}
          </Text>
          <Pressable
            style={styles.confirmButton}
            onPress={() => router.push(`/appointment/${confirmedId}`)}
          >
            <Text style={styles.confirmButtonText}>Ver Detalle</Text>
          </Pressable>
          <Pressable
            style={styles.confirmSecondary}
            onPress={() => router.push('/appointments')}
          >
            <Text style={styles.confirmSecondaryText}>
              Volver a Mis Citas
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

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
            {SPECIALTIES.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.optionCard,
                  specialty === s && styles.optionCardActive,
                ]}
                onPress={() => setSpecialty(s)}
              >
                <Text
                  style={[
                    styles.optionText,
                    specialty === s && styles.optionTextActive,
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 1: Doctor */}
        {step === 1 && specialty && (
          <View style={styles.optionsList}>
            {DOCTORS[specialty]?.map((d) => (
              <Pressable
                key={d.id}
                style={[
                  styles.optionRow,
                  doctor === d.name && styles.optionRowActive,
                ]}
                onPress={() => setDoctor(d.name)}
              >
                <View style={styles.optionAvatar}>
                  <Ionicons name="person" size={20} color="#0891B2" />
                </View>
                <Text
                  style={[
                    styles.optionRowText,
                    doctor === d.name && styles.optionTextActive,
                  ]}
                >
                  {d.name}
                </Text>
                {doctor === d.name && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#0891B2"
                  />
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 2: Date */}
        {step === 2 && (
          <View style={styles.optionsGrid}>
            {['Lunes, 9 de junio', 'Martes, 10 de junio', 'Miércoles, 11 de junio', 'Jueves, 12 de junio'].map(
              (d) => (
                <Pressable
                  key={d}
                  style={[
                    styles.optionCard,
                    date === d && styles.optionCardActive,
                  ]}
                  onPress={() => setDate(d)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={date === d ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      date === d && styles.optionTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        )}

        {/* Step 3: Time */}
        {step === 3 && (
          <View style={styles.optionsGrid}>
            {TIME_SLOTS.map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.optionCard,
                  time === t && styles.optionCardActive,
                ]}
                onPress={() => setTime(t)}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={time === t ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.optionText,
                    time === t && styles.optionTextActive,
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#64748B" />
            <Text style={styles.backText}>
              {step === 0 ? 'Cancelar' : 'Atrás'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.nextButton, !canNext && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canNext}
          >
            <Text style={styles.nextText}>
              {step === 3 ? 'Confirmar' : 'Siguiente'}
            </Text>
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
  confirmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
    gap: 12,
  },
  confirmIcon: {
    marginBottom: 8,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  confirmSubtitle: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
  },
  confirmDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#0891B2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmSecondary: {
    paddingVertical: 10,
  },
  confirmSecondaryText: {
    color: '#0891B2',
    fontWeight: '500',
    fontSize: 14,
  },
});
