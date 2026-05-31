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
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

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
          color={danger ? colors.error : colors.primary}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.disabled} />
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
          <Ionicons name="person" size={40} color={colors.white} />
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
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  roleBadge: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  menuSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDanger: {
    backgroundColor: colors.errorBg,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  menuLabelDanger: {
    color: colors.error,
  },
  loggingOut: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },
});
