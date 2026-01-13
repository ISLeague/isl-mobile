import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';

export const CreateCanchaScreen = ({ navigation, route }: any) => {
  const { idLocal, nombreLocal, idEdicionCategoria, returnTo, returnParams } = route.params || {};
  const { showSuccess, showError } = useToast();

  // Form states
  const [nombre, setNombre] = useState('');
  const [tipoSuperficie, setTipoSuperficie] = useState('');
  const [dimensiones, setDimensiones] = useState('');
  const [capacidadEspectadores, setCapacidadEspectadores] = useState('');

  // Boolean switches
  const [tieneIluminacion, setTieneIluminacion] = useState(false);
  const [tieneGradas, setTieneGradas] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre de la cancha es requerido';
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar capacidad si se proporciona
    if (capacidadEspectadores.trim()) {
      const cap = parseInt(capacidadEspectadores);
      if (isNaN(cap) || cap < 0) {
        newErrors.capacidadEspectadores = 'Capacidad inválida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.canchas.create({
        nombre: nombre.trim(),
        id_local: idLocal,
        tipo_superficie: tipoSuperficie.trim() as any,
        dimensiones: dimensiones.trim() || undefined,
        capacidad_espectadores: capacidadEspectadores ? parseInt(capacidadEspectadores) : undefined,
        tiene_iluminacion: tieneIluminacion,
        tiene_gradas: tieneGradas,
      });

      if (response.success && response.data) {
        setShowSuccessModal(true);
        showSuccess(`Cancha "${nombre}" creada exitosamente`);
      } else {
        showError('No se pudo crear la cancha');
      }
    } catch (error: any) {
      showError(error.message || 'Error al crear la cancha');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = () => {
    setShowSuccessModal(false);

    // If coming from CreateRondaFlow, navigate back with return params
    if (returnTo && returnParams) {
      navigation.navigate(returnTo, returnParams);
    } else {
      // Otherwise, go back to the previous screen
      navigation.goBack();
    }
  };

  const handleCrearOtra = () => {
    setShowSuccessModal(false);
    // Limpiar el formulario para crear otra cancha
    setNombre('');
    setTipoSuperficie('');
    setDimensiones('');
    setCapacidadEspectadores('');
    setTieneIluminacion(false);
    setTieneGradas(false);
    setErrors({});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Crear Nueva Cancha</Text>

          {/* Local Info */}
          <View style={styles.localInfoCard}>
            <MaterialCommunityIcons name="stadium" size={24} color={colors.primary} />
            <View style={styles.localInfoText}>
              <Text style={styles.localLabel}>Local:</Text>
              <Text style={styles.localName}>{nombreLocal || 'Sin nombre'}</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              Cada cancha pertenece a un local específico. Puedes crear múltiples
              canchas para el mismo local.
            </Text>
          </View>

          {/* Información Básica */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>

            <Input
              label="Nombre de la Cancha *"
              placeholder="Ej: Cancha Principal A"
              value={nombre}
              onChangeText={setNombre}
              error={errors.nombre}
              leftIcon={<MaterialCommunityIcons name="soccer-field" size={20} color={colors.textLight} />}
            />

            {/* Tipo de Superficie Options */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Superficie</Text>
              <View style={styles.surfaceOptionsContainer}>
                {[
                  { id: 'cesped_natural', label: 'Césped Natural', icon: 'grass' },
                  { id: 'cesped_sintetico', label: 'Césped Sintético', icon: 'soccer' }, // using soccer as proxy for turf
                  { id: 'tierra', label: 'Tierra', icon: 'image-filter-hdr' }, // generic terrain
                  { id: 'concreto', label: 'Concreto', icon: 'wall' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.surfaceOption,
                      tipoSuperficie === option.id && styles.surfaceOptionSelected,
                    ]}
                    onPress={() => setTipoSuperficie(option.id)}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={20}
                      color={tipoSuperficie === option.id ? colors.white : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.surfaceOptionText,
                        tipoSuperficie === option.id && styles.surfaceOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.tipoSuperficie && (
                <Text style={styles.errorText}>{errors.tipoSuperficie}</Text>
              )}
            </View>

            <Input
              label="Dimensiones"
              placeholder="Ej: 50x30 metros"
              value={dimensiones}
              onChangeText={setDimensiones}
              error={errors.dimensiones}
              leftIcon={<MaterialCommunityIcons name="ruler" size={20} color={colors.textLight} />}
            />

            <Input
              label="Capacidad de Espectadores"
              placeholder="Ej: 200"
              value={capacidadEspectadores}
              onChangeText={setCapacidadEspectadores}
              error={errors.capacidadEspectadores}
              keyboardType="numeric"
              leftIcon={<MaterialCommunityIcons name="account-group" size={20} color={colors.textLight} />}
            />
          </View>

          {/* Servicios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios Disponibles</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <MaterialCommunityIcons name="lightbulb-on" size={24} color={colors.textPrimary} />
                <Text style={styles.switchText}>Tiene Iluminación</Text>
              </View>
              <Switch
                value={tieneIluminacion}
                onValueChange={setTieneIluminacion}
                trackColor={{ false: colors.borderLight, true: colors.success }}
                thumbColor={tieneIluminacion ? colors.white : colors.backgroundGray}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <MaterialCommunityIcons name="stairs" size={24} color={colors.textPrimary} />
                <Text style={styles.switchText}>Tiene Gradas</Text>
              </View>
              <Switch
                value={tieneGradas}
                onValueChange={setTieneGradas}
                trackColor={{ false: colors.borderLight, true: colors.success }}
                thumbColor={tieneGradas ? colors.white : colors.backgroundGray}
              />
            </View>
          </View>

          <Button
            title="Crear Cancha"
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
            style={styles.createButton}
          />
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
            </View>

            <Text style={styles.modalTitle}>¡Cancha Creada!</Text>
            <Text style={styles.modalMessage}>
              La cancha "{nombre}" se creó exitosamente.{'\n'}
              ¿Deseas crear otra cancha?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleFinalizar}
              >
                <Text style={styles.modalButtonTextSecondary}>Finalizar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCrearOtra}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color={colors.white} />
                <Text style={styles.modalButtonTextPrimary}>Crear Otra</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  localInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  localInfoText: {
    flex: 1,
  },
  localLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  localName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  createButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonSecondary: {
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  surfaceOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  surfaceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    marginBottom: 4,
  },
  surfaceOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  surfaceOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  surfaceOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
