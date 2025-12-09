import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { mockUsuarios } from '../../data/mockData';

export const ChangePasswordScreen = ({ navigation, route }: any) => {
  const { usuario } = useAuth();
  const { showSuccess, showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma la nueva contraseña';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // TODO: Validar contraseña actual con hash en API
      // Por ahora asumimos que la validación es correcta
      
      // Actualizar el usuario
      const userToUpdate = mockUsuarios.find(u => u.id_usuario === usuario?.id_usuario);
      if (userToUpdate) {
        // TODO: Guardar el hash de la nueva contraseña en la API
        userToUpdate.debe_cambiar_password = false;
        
        showSuccess(
          'Contraseña actualizada correctamente. Ahora puedes acceder a tu cuenta.',
          '¡Éxito!'
        );

        // Navegar al dashboard del admin de torneo
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'TournamentAdminDashboard' }],
          });
        }, 1500);
      }
    } catch (error) {
      showError('No se pudo cambiar la contraseña', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="shield-lock"
              size={80}
              color={colors.primary}
            />
            <Text style={styles.title}>Cambiar Contraseña</Text>
            <Text style={styles.subtitle}>
              Por seguridad, debes cambiar tu contraseña antes de continuar
            </Text>
          </View>

          {/* Información importante */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="information" size={24} color={colors.info} />
              <Text style={styles.infoTitle}>Requisitos de Seguridad</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              <Text style={styles.infoText}>Mínimo 6 caracteres</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              <Text style={styles.infoText}>Diferente a la contraseña temporal</Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Input
              label="Contraseña Actual (Temporal)"
              placeholder="Ingresa tu contraseña temporal"
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setErrors({ ...errors, currentPassword: undefined });
              }}
              error={errors.currentPassword}
              secureTextEntry
              autoCapitalize="none"
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Input
              label="Nueva Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setErrors({ ...errors, newPassword: undefined });
              }}
              error={errors.newPassword}
              secureTextEntry
              autoCapitalize="none"
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-plus"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Input
              label="Confirmar Nueva Contraseña"
              placeholder="Repite tu nueva contraseña"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: undefined });
              }}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              leftIcon={
                <MaterialCommunityIcons
                  name="lock-check"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Button
              title="Cambiar Contraseña"
              onPress={handleChangePassword}
              loading={loading}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Una vez cambiada tu contraseña, podrás acceder a todas las funciones de administración del torneo.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: `${colors.info}15`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${colors.info}30`,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.info,
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  form: {
    gap: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
