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

export const RegisterScreen = ({ navigation }: any) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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

    setLoading(true);

    try {
      // TODO: Aquí irá la llamada a tu API con los campos de términos
      // const response = await registerAPI({ 
      //   nombre, 
      //   email, 
      //   password, 
      //   id_pais: 1,
      //   acepto_terminos: acceptTerms,
      //   acepto_privacidad: acceptTerms,
      //   fecha_aceptacion_terminos: new Date().toISOString()
      // });

     

      // Simulación de registro exitoso
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          '¡Éxito!',
          'Cuenta creada correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
      }, 1500);

    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo crear la cuenta');
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
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            {/* Casilla de Términos y Condiciones */}
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
                {' '}y la{' '}
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
              disabled={!acceptTerms}
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