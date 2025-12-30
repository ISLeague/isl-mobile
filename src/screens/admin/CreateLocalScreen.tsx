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

export const CreateLocalScreen = ({ navigation, route }: any) => {
  const { idEdicionCategoria } = route.params || {};
  const { showSuccess, showError } = useToast();

  // Form states
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [capacidadTotal, setCapacidadTotal] = useState('');
  const [fotoPrincipal, setFotoPrincipal] = useState('');

  // Boolean switches
  const [tieneEstacionamiento, setTieneEstacionamiento] = useState(false);
  const [tieneVestuarios, setTieneVestuarios] = useState(false);
  const [tieneIluminacion, setTieneIluminacion] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdLocalId, setCreatedLocalId] = useState<number | null>(null);
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};

    // Campos requeridos
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre del local es requerido';
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    // Validar latitud
    if (!latitud.trim()) {
      newErrors.latitud = 'La latitud es requerida';
    } else {
      const lat = parseFloat(latitud);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitud = 'Latitud inválida (debe estar entre -90 y 90)';
      }
    }

    // Validar longitud
    if (!longitud.trim()) {
      newErrors.longitud = 'La longitud es requerida';
    } else {
      const lng = parseFloat(longitud);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitud = 'Longitud inválida (debe estar entre -180 y 180)';
      }
    }

    // Validar email si se proporciona
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Email inválido';
      }
    }

    // Validar capacidad si se proporciona
    if (capacidadTotal.trim()) {
      const cap = parseInt(capacidadTotal);
      if (isNaN(cap) || cap < 0) {
        newErrors.capacidadTotal = 'Capacidad inválida';
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
      const response = await api.locales.create({
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        capacidad_total: capacidadTotal ? parseInt(capacidadTotal) : undefined,
        tiene_estacionamiento: tieneEstacionamiento,
        tiene_vestuarios: tieneVestuarios,
        tiene_iluminacion: tieneIluminacion,
        foto_principal: fotoPrincipal.trim() || undefined,
        id_edicion_categoria: idEdicionCategoria,
      });

      if (response.success && response.data) {
        setCreatedLocalId(response.data.id_local);
        setShowSuccessModal(true);
        showSuccess(`Local "${nombre}" creado exitosamente`);
      } else {
        showError('No se pudo crear el local');
      }
    } catch (error: any) {
      console.error('Error creating local:', error);
      showError(error.message || 'Error al crear el local');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleCrearCanchas = () => {
    setShowSuccessModal(false);
    navigation.navigate('CreateCancha', {
      idLocal: createdLocalId,
      nombreLocal: nombre,
      idEdicionCategoria,
    });
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

          <Text style={styles.title}>Crear Nuevo Local</Text>
          <Text style={styles.subtitle}>
            Ingresa los datos del local donde se jugarán los partidos
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              Un local puede tener múltiples canchas. Después de crear el local,
              podrás agregar las canchas correspondientes.
            </Text>
          </View>

          {/* Información Básica */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>

            <Input
              label="Nombre del Local *"
              placeholder="Ej: Complejo Deportivo Villa El Salvador"
              value={nombre}
              onChangeText={setNombre}
              error={errors.nombre}
              leftIcon={<MaterialCommunityIcons name="stadium" size={20} color={colors.textLight} />}
            />

            <Input
              label="Dirección *"
              placeholder="Ej: Av. Universitaria 321"
              value={direccion}
              onChangeText={setDireccion}
              error={errors.direccion}
              leftIcon={<Ionicons name="location-outline" size={20} color={colors.textLight} />}
            />
          </View>

          {/* Coordenadas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación GPS</Text>

            <Input
              label="Latitud *"
              placeholder="Ej: -12.0300"
              value={latitud}
              onChangeText={setLatitud}
              error={errors.latitud}
              keyboardType="numeric"
              leftIcon={<Ionicons name="location" size={20} color={colors.textLight} />}
            />

            <Input
              label="Longitud *"
              placeholder="Ej: -77.0400"
              value={longitud}
              onChangeText={setLongitud}
              error={errors.longitud}
              keyboardType="numeric"
              leftIcon={<Ionicons name="navigate" size={20} color={colors.textLight} />}
            />

            <View style={styles.helpBox}>
              <Ionicons name="help-circle" size={20} color={colors.warning} />
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>¿Cómo obtener las coordenadas?</Text>
                <Text style={styles.helpText}>
                  1. Abre Google Maps{'\n'}
                  2. Busca la ubicación del local{'\n'}
                  3. Mantén presionado sobre el punto en el mapa{'\n'}
                  4. Copia las coordenadas que aparecen
                </Text>
              </View>
            </View>
          </View>

          {/* Contacto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de Contacto</Text>

            <Input
              label="Teléfono"
              placeholder="Ej: +51987654324"
              value={telefono}
              onChangeText={setTelefono}
              error={errors.telefono}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color={colors.textLight} />}
            />

            <Input
              label="Email"
              placeholder="Ej: contacto@estadio.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textLight} />}
            />
          </View>

          {/* Capacidad e Imagen */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles Adicionales</Text>

            <Input
              label="Capacidad Total"
              placeholder="Ej: 8000"
              value={capacidadTotal}
              onChangeText={setCapacidadTotal}
              error={errors.capacidadTotal}
              keyboardType="numeric"
              leftIcon={<MaterialCommunityIcons name="account-group" size={20} color={colors.textLight} />}
            />

            <Input
              label="URL de Foto Principal"
              placeholder="https://example.com/foto.jpg"
              value={fotoPrincipal}
              onChangeText={setFotoPrincipal}
              error={errors.fotoPrincipal}
              autoCapitalize="none"
              leftIcon={<Ionicons name="image-outline" size={20} color={colors.textLight} />}
            />
          </View>

          {/* Servicios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios Disponibles</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <MaterialCommunityIcons name="parking" size={24} color={colors.textPrimary} />
                <Text style={styles.switchText}>Tiene Estacionamiento</Text>
              </View>
              <Switch
                value={tieneEstacionamiento}
                onValueChange={setTieneEstacionamiento}
                trackColor={{ false: colors.borderLight, true: colors.success }}
                thumbColor={tieneEstacionamiento ? colors.white : colors.backgroundGray}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <MaterialCommunityIcons name="locker" size={24} color={colors.textPrimary} />
                <Text style={styles.switchText}>Tiene Vestuarios</Text>
              </View>
              <Switch
                value={tieneVestuarios}
                onValueChange={setTieneVestuarios}
                trackColor={{ false: colors.borderLight, true: colors.success }}
                thumbColor={tieneVestuarios ? colors.white : colors.backgroundGray}
              />
            </View>

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
          </View>

          <Button
            title="Crear Local"
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

            <Text style={styles.modalTitle}>¡Local Creado!</Text>
            <Text style={styles.modalMessage}>
              El local "{nombre}" se creó exitosamente.{'\n'}
              ¿Deseas agregar canchas ahora?
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
                onPress={handleCrearCanchas}
              >
                <MaterialCommunityIcons name="soccer-field" size={20} color={colors.white} />
                <Text style={styles.modalButtonTextPrimary}>Crear Canchas</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
  helpBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginTop: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#8B7500',
    lineHeight: 18,
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
});
