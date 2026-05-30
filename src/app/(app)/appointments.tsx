import { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppointmentCard } from '@/components/AppointmentCard';
import { getAppointments } from '@/types/appointment';
import type { AppointmentStatus } from '@/types/appointment';

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

type FilterKey = 'upcoming' | 'past' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'upcoming', label: 'Próximas' },
  { key: 'past', label: 'Pasadas' },
  { key: 'cancelled', label: 'Canceladas' },
];

function filterAppointments(key: FilterKey) {
  const now = new Date();
  const all = getAppointments();

  switch (key) {
    case 'upcoming':
      return all.filter(
        (a) => a.status !== 'cancelled' && new Date(a.dateTime) >= now,
      );
    case 'past':
      return all.filter(
        (a) => a.status !== 'cancelled' && new Date(a.dateTime) < now,
      );
    case 'cancelled':
      return all.filter((a) => a.status === 'cancelled');
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AppointmentsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('upcoming');

  const appointments = useMemo(
    () => filterAppointments(activeFilter),
    [activeFilter],
  );

  const isEmpty = appointments.length === 0;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Citas</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/book-appointment')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List or empty state */}
      {isEmpty ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={
              activeFilter === 'cancelled'
                ? 'checkmark-circle-outline'
                : 'calendar-outline'
            }
            size={56}
            color="#CBD5E1"
          />
          <Text style={styles.emptyTitle}>
            {activeFilter === 'upcoming'
              ? 'No tienes citas próximas'
              : activeFilter === 'past'
                ? 'No tienes citas pasadas'
                : 'No hay citas canceladas'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter === 'upcoming'
              ? 'Reservá una nueva cita para comenzar.'
              : ''}
          </Text>
          {activeFilter === 'upcoming' && (
            <Pressable
              style={styles.emptyCta}
              onPress={() => router.push('/book-appointment')}
            >
              <Text style={styles.emptyCtaText}>Reservar Cita</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
        />
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0891B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#0891B2',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 12,
    backgroundColor: '#0891B2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
