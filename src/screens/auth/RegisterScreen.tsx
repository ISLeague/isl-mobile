import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { authService } from '../../api/services/auth.service';

export const RegisterScreen = ({ navigation }: any) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    apellido?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: any = {};

    // Validar nombre
    if (!nombre) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar apellido
    if (!apellido) {
      newErrors.apellido = 'El apellido es requerido';
    } else if (apellido.length < 2) {
      newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
    }

    // Validar email
    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar password
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación de password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    if (!acceptTerms || !acceptPrivacy) {
      Alert.alert('Atención', 'Debes aceptar los términos y la política de privacidad');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        nombre,
        apellido,
        email,
        password,
        rol: 'fan',
        acepto_terminos: acceptTerms,
        acepto_privacidad: acceptPrivacy,
      });

      setLoading(false);
      Alert.alert(
        '¡Registro Exitoso!',
        '📧 Hemos enviado un correo de confirmación a:\n\n' + email + '\n\nEs necesario que confirmes tu correo electrónico antes de poder iniciar sesión. Revisa tu bandeja de entrada (y spam).',
        [
          {
            text: 'Entendido, ir al Login',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || 'No se pudo crear la cuenta';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.replace('Login');
                }
              }}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Únete a la comunidad de ISL
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Nombre"
              placeholder="Juan"
              value={nombre}
              onChangeText={(text) => {
                setNombre(text);
                setErrors({ ...errors, nombre: undefined });
              }}
              error={errors.nombre}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              leftIcon={
                <MaterialCommunityIcons
                  name="account"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Input
              label="Apellido"
              placeholder="Pérez"
              value={apellido}
              onChangeText={(text) => {
                setApellido(text);
                setErrors({ ...errors, apellido: undefined });
              }}
              error={errors.apellido}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              leftIcon={
                <MaterialCommunityIcons
                  name="account-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Input
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              leftIcon={
                <MaterialCommunityIcons
                  name="email-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Input
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              isPassword
              autoComplete="new-password"
              textContentType="newPassword"
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Input
              label="Confirmar Contraseña"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: undefined });
              }}
              error={errors.confirmPassword}
              isPassword
              autoComplete="new-password"
              textContentType="newPassword"
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            {/* Checkbox Términos */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && (
                  <MaterialCommunityIcons name="check" size={18} color={colors.white} />
                )}
              </View>
              <Text style={styles.checkboxText}>
                Acepto los{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL('https://www.interleagueonline.com/terminos-y-condiciones-isl/')}
                >
                  Términos y Condiciones
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Checkbox Privacidad */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptPrivacy(!acceptPrivacy)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptPrivacy && styles.checkboxChecked]}>
                {acceptPrivacy && (
                  <MaterialCommunityIcons name="check" size={18} color={colors.white} />
                )}
              </View>
              <Text style={styles.checkboxText}>
                Acepto la{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL('https://www.interleagueonline.com/politica-de-privacidad-isl/')}
                >
                  Política de Privacidad
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={loading}
              disabled={!acceptTerms || !acceptPrivacy}
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  registerButton: {
    marginBottom: 16,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});