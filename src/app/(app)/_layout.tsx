import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';

const TAB_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  '(patient)/home': 'home-outline',
  appointments: 'calendar-outline',
  profile: 'person-outline',
};

const TAB_ICON_ACTIVE_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  '(patient)/home': 'home',
  appointments: 'calendar',
  profile: 'person',
};

/**
 * App tab layout — bottom tabs for Home, Appointments, and Profile.
 * Each tab wraps its corresponding route.
 */
export default function AppLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0891B2',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500' as const,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused
            ? TAB_ICON_ACTIVE_MAP[route.name]
            : TAB_ICON_MAP[route.name];
          return (
            <Ionicons
              name={iconName ?? 'ellipse-outline'}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen
        name="(patient)/home"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Citas',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
        }}
      />
      {/* index.tsx just redirects — hide it from tabs */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
