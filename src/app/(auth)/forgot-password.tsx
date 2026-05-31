import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { forgotPassword } from '@/api/auth/endpoints';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormErrors {
  email?: string;
  general?: string;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  async function handleSubmit() {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch {
      setErrors({ general: 'Ocurrió un error al enviar el correo. Intenta de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Confirmation */}
          <View style={styles.confirmation}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={styles.confirmTitle}>Correo Enviado</Text>
            <Text style={styles.confirmText}>
              Se ha enviado un correo de recuperación a{' '}
              <Text style={styles.confirmEmail}>{email.trim()}</Text>.
              Revisa tu bandeja de entrada y sigue las instrucciones para
              restablecer tu contraseña.
            </Text>
          </View>

          {/* Back to login */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Volver a Iniciar Sesión</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo electrónico y te enviaremos las instrucciones
              para restablecer tu contraseña.
            </Text>
          </View>

          {/* General error */}
          {errors.general ? (
            <View style={styles.generalError}>
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="ej: usuario@correo.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!isSubmitting}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed ? styles.buttonPressed : null,
              isSubmitting ? styles.buttonDisabled : null,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Enviar Instrucciones</Text>
            )}
          </Pressable>

          {/* Back to login */}
          <View style={styles.links}>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>
                <Text style={styles.linkBold}>← Volver a Iniciar Sesión</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Header
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Confirmation
  confirmation: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 28,
    color: '#059669',
    fontWeight: '700',
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  confirmEmail: {
    fontWeight: '600',
    color: '#0891B2',
  },

  // General error
  generalError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },

  // Field
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 2,
  },

  // Button
  button: {
    backgroundColor: '#0891B2',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Links
  links: {
    marginTop: 32,
    alignItems: 'center',
  },
  link: {
    fontSize: 14,
    color: '#64748B',
  },
  linkBold: {
    color: '#0891B2',
    fontWeight: '600',
  },
});
