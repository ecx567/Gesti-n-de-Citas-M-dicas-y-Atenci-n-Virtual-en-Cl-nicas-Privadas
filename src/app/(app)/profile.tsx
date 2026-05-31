import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/ctx';

// ---------------------------------------------------------------------------
// Menu item
// ---------------------------------------------------------------------------

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  path?: string;
  action?: () => void;
  danger?: boolean;
}

function MenuRow({ icon, label, path, action, danger }: MenuItem) {
  const router = useRouter();

  const handlePress = () => {
    if (action) {
      action();
    } else if (path) {
      router.push(path as any);
    }
  };

  return (
    <Pressable style={styles.menuRow} onPress={handlePress}>
      <View
        style={[styles.menuIcon, danger && styles.menuIconDanger]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? '#DC2626' : '#0891B2'}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            router.replace('/');
          },
        },
      ],
    );
  };

  const menuItems: MenuItem[][] = [
    [
      {
        icon: 'create-outline',
        label: 'Editar Perfil',
        path: '/edit-profile',
      },
      {
        icon: 'settings-outline',
        label: 'Configuración',
        path: '/settings',
      },
      {
        icon: 'information-circle-outline',
        label: 'Acerca de',
        path: '/about',
      },
    ],
    [
      {
        icon: 'log-out-outline',
        label: 'Cerrar Sesión',
        action: handleLogout,
        danger: true,
      },
    ],
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Avatar & info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>{user?.name ?? ''}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        {user?.role ? <Text style={styles.roleBadge}>{user.role}</Text> : null}
      </View>

      {/* Menu sections */}
      {menuItems.map((section, si) => (
        <View key={si} style={styles.menuSection}>
          {section.map((item, mi) => (
            <MenuRow key={mi} {...item} />
          ))}
        </View>
      ))}

      {/* Logging out indicator */}
      {loggingOut && (
        <Text style={styles.loggingOut}>Cerrando sesión...</Text>
      )}
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
  content: {
    padding: 20,
    gap: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0891B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  email: {
    fontSize: 14,
    color: '#64748B',
  },
  roleBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0891B2',
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDanger: {
    backgroundColor: '#FEF2F2',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  menuLabelDanger: {
    color: '#DC2626',
  },
  loggingOut: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
