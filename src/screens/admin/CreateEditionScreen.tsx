import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';
import { Torneo, Pais } from '../../api/types';
import { EstadoEdicion } from '../../api/types/ediciones.types';
import { useAuth } from '../../contexts/AuthContext';

const ESTADOS: { value: EstadoEdicion; label: string; color: string }[] = [
  { value: 'abierto', label: 'Abierto', color: '#4caf50' },
  { value: 'en juego', label: 'En Juego', color: '#2196f3' },
  { value: 'cerrado', label: 'Cerrado', color: '#9e9e9e' },
];

export const CreateEditionScreen = ({ navigation, route }: any) => {
  const { torneo, pais } = route.params;
  const { isSuperAdmin, usuario } = useAuth();

  // Check if user has permission to create editions for this tournament
  const canCreateEdition =
    isSuperAdmin ||
    (usuario?.id_torneos && usuario.id_torneos.includes(torneo.id_torneo));

  useEffect(() => {
    if (!canCreateEdition) {
      Alert.alert(
        'Acceso Denegado',
        'No tienes permisos para crear ediciones en este torneo',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [canCreateEdition]);

  const [numero, setNumero] = useState('');
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState<EstadoEdicion>('abierto');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    // Validation
    if (!numero.trim()) {
      Alert.alert('Error', 'El número de edición es obligatorio');
      return;
    }

    const numeroValue = parseInt(numero.trim());
    if (isNaN(numeroValue) || numeroValue <= 0) {
      Alert.alert('Error', 'El número de edición debe ser un número válido');
      return;
    }

    try {
      setIsCreating(true);

      await api.ediciones.create({
        numero: numeroValue,
        nombre: nombre.trim() || null,
        estado,
        id_torneo: torneo.id_torneo,
        fecha_inicio: fechaInicio.trim() || null,
        fecha_fin: fechaFin.trim() || null,
      });

      Alert.alert('Éxito', 'Edición creada correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating edition:', error);
      const errorMessage = error?.response?.data?.message || 'No se pudo crear la edición';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>Nueva Edición</Text>
          <Text style={styles.subtitle}>{torneo.nombre}</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoBannerText}>
            Una edición representa un año o temporada del torneo (ej: 2024, 2025)
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN DE LA EDICIÓN</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Número de Edición <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={numero}
              onChangeText={setNumero}
              placeholder="Ej: 2024, 2025"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
            <Text style={styles.helperText}>
              Usa el año o un número secuencial
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Torneo Verano, Copa Invierno"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              Dale un nombre especial a esta edición
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Estado <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.estadosContainer}>
              {ESTADOS.map((est) => (
                <TouchableOpacity
                  key={est.value}
                  style={[
                    styles.estadoChip,
                    estado === est.value && styles.estadoChipActive,
                    estado === est.value && { borderColor: est.color },
                  ]}
                  onPress={() => setEstado(est.value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.estadoDot,
                      { backgroundColor: estado === est.value ? est.color : colors.border },
                    ]}
                  />
                  <Text
                    style={[
                      styles.estadoText,
                      estado === est.value && styles.estadoTextActive,
                    ]}
                  >
                    {est.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>
              {estado === 'abierto' && 'Inscripciones abiertas para equipos'}
              {estado === 'en juego' && 'Torneo en curso, partidos activos'}
              {estado === 'cerrado' && 'Torneo finalizado'}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha de Inicio (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={fechaInicio}
              onChangeText={setFechaInicio}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              Formato: AAAA-MM-DD (ej: 2024-01-15)
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha de Fin (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={fechaFin}
              onChangeText={setFechaFin}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              Formato: AAAA-MM-DD (ej: 2024-06-30)
            </Text>
          </View>
        </View>

        {/* Next Steps Info */}
        <View style={styles.nextStepsCard}>
          <View style={styles.nextStepsHeader}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.nextStepsTitle}>Próximos pasos</Text>
          </View>
          <Text style={styles.nextStepsText}>
            Después de crear la edición, podrás:
          </Text>
          <View style={styles.nextStepsList}>
            <View style={styles.nextStepItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={colors.success}
              />
              <Text style={styles.nextStepText}>
                Asignar categorías (SUB16, SUB18, Libre, etc.)
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={colors.success}
              />
              <Text style={styles.nextStepText}>
                Agregar equipos y jugadores
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={colors.success}
              />
              <Text style={styles.nextStepText}>
                Configurar fases y grupos
              </Text>
            </View>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isCreating}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="plus-circle"
                size={20}
                color={colors.white}
              />
              <Text style={styles.createButtonText}>Crear Edición</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  estadosContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  estadoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundGray,
  },
  estadoChipActive: {
    backgroundColor: colors.white,
  },
  estadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  estadoTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  nextStepsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  nextStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  nextStepsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  nextStepsList: {
    gap: 8,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  nextStepText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default CreateEditionScreen;
