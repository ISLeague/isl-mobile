import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';

interface CreateRondaScreenProps {
  navigation: any;
  route: any;
}

export const CreateRondaScreen: React.FC<CreateRondaScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria, tipo: tipoParam, subtipo_eliminatoria } = route.params || {};

  // Si viene con tipo en params (desde Knockout), úsalo y no permitas cambiarlo
  const tipoFijo = tipoParam || null;
  const esDesdeKnockout = tipoParam === 'eliminatorias';

  const { showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState<'fase_grupos' | 'amistosa'>(
    (tipoParam === 'eliminatorias' ? 'fase_grupos' : tipoParam) || 'fase_grupos'
  );
  const [vecesEnfrentamiento, setVecesEnfrentamiento] = useState('1');
  const [aplicarFechaAutomatica, setAplicarFechaAutomatica] = useState(false);

  const handleCreate = async () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la ronda es requerido');
      return;
    }

    const rondaData = {
      nombre,
      fecha: tipo === 'amistosa' ? (fecha.trim() || undefined) : undefined,
      tipo,
      veces_enfrentamiento: tipo === 'fase_grupos' ? parseInt(vecesEnfrentamiento) : undefined,
      aplicar_fecha_automatica: aplicarFechaAutomatica,
      id_edicion_categoria: idEdicionCategoria,
      es_amistosa: tipo === 'amistosa',
      orden: 1, // Valor por defecto para rondas creadas individualmente
    };

    setLoading(true);

    const result = await safeAsync(
      async () => {
        // 1. Obtener la fase correcta
        const fasesResponse = await api.fases.list(idEdicionCategoria);
        const fase = fasesResponse.success && fasesResponse.data && fasesResponse.data.length > 0
          ? fasesResponse.data.find((f: any) => f.tipo === 'grupo') || fasesResponse.data[0]
          : null;

        if (!fase || !fase.id_fase) {
          throw new Error('No se encontró una fase válida');
        }

        // 2. Validar grupos si es fase de grupos
        if (tipo === 'fase_grupos') {
          const gruposResponse = await api.grupos.get(fase.id_fase);
          const grupos = gruposResponse.success && gruposResponse.data ? gruposResponse.data.grupos || [] : [];

          if (grupos.length === 0) {
            throw new Error('No hay grupos creados en esta fase');
          }

          const firstGroupSize = grupos[0].equipos?.length || 0;
          const allSameSize = grupos.every((g: any) => (g.equipos?.length || 0) === firstGroupSize);

          if (!allSameSize) {
            throw new Error('Todos los grupos deben tener la misma cantidad de equipos');
          }

          if (firstGroupSize === 0) {
            throw new Error('Los grupos no tienen equipos asignados');
          }
        }

        // 3. Crear la ronda
        const rondaFinalData = {
          ...rondaData,
          id_fase: fase.id_fase,
        };

        return await api.rondas.create(rondaFinalData);
      },
      'CreateRonda - handleCreate',
      {
        fallbackValue: null,
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'No se pudo crear la ronda');
        }
      }
    );

    if (result && result.success) {
      showSuccess(`Ronda "${nombre}" creada exitosamente`);
      navigation.goBack();
    }
    setLoading(false);
  };

  const getTipoIcon = (tipoRonda: string) => {
    switch (tipoRonda) {
      case 'fase_grupos':
        return 'group';
      case 'eliminatorias':
        return 'trophy-variant';
      case 'amistosa':
        return 'hand-heart';
      default:
        return 'calendar';
    }
  };

  const getTipoLabel = (tipoRonda: string) => {
    switch (tipoRonda) {
      case 'fase_grupos':
        return 'Fase de Grupos';
      case 'eliminatorias':
        return 'Eliminatorias';
      case 'amistosa':
        return 'Amistosa';
      default:
        return tipoRonda;
    }
  };

  const getSubtipoIcon = (subtipo: string) => {
    switch (subtipo) {
      case 'oro':
        return 'medal';
      case 'plata':
        return 'medal-outline';
      case 'bronce':
        return 'medal-outline';
      default:
        return 'medal';
    }
  };

  const getSubtipoLabel = (subtipo: string) => {
    switch (subtipo) {
      case 'oro':
        return 'Oro';
      case 'plata':
        return 'Plata';
      case 'bronce':
        return 'Bronce';
      default:
        return subtipo;
    }
  };

  const getSubtipoColors = (subtipo: string) => {
    switch (subtipo) {
      case 'oro':
        return ['#FFD700', '#FFA500', '#FF8C00']; // Dorado
      case 'plata':
        return ['#C0C0C0', '#A8A8A8', '#808080']; // Plateado
      case 'bronce':
        return ['#CD7F32', '#B8733C', '#9F6F3D']; // Bronce
      default:
        return [colors.primary, colors.primary, colors.primary];
    }
  };

  const handleApplyDateToAllMatches = () => {
    if (!fecha.trim()) {
      Alert.alert('Error', 'Debes ingresar una fecha primero');
      return;
    }

    Alert.alert(
      'Aplicar Fecha a Todos',
      `¿Deseas aplicar la fecha ${fecha} a todos los partidos de esta ronda que no tengan fecha asignada?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: () => {
            // TODO: Llamar a la API para aplicar fecha a todos los partidos sin fecha
            // await api.fixture.applyDateToMatches(rondaId, fecha);
            Alert.alert('Éxito', 'Fecha aplicada a todos los partidos sin fecha');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Ronda</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre de la Ronda */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la Ronda *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Jornada 1, Ronda 1, etc."
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Tipo de Ronda */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Ronda *</Text>
            <View style={styles.tipoContainer}>
              {(['fase_grupos', 'amistosa'] as const)
                .map((tipoOption) => (
                  <TouchableOpacity
                    key={tipoOption}
                    style={[
                      styles.tipoButton,
                      tipo === tipoOption && styles.tipoButtonSelected,
                    ]}
                    onPress={() => setTipo(tipoOption)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={getTipoIcon(tipoOption)}
                      size={24}
                      color={tipo === tipoOption ? colors.white : colors.primary}
                    />
                    <Text
                      style={[
                        styles.tipoButtonText,
                        tipo === tipoOption && styles.tipoButtonTextSelected,
                      ]}
                    >
                      {getTipoLabel(tipoOption)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.helpText}>
              💡 Las rondas eliminatorias se crean desde la sección Knockout
            </Text>
          </View>

          {/* Veces que se enfrentan (solo para Fase de Grupos) */}
          {tipo === 'fase_grupos' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Cuántas veces se enfrentan los equipos? *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 1 (Ida), 2 (Ida y Vuelta)"
                value={vecesEnfrentamiento}
                onChangeText={setVecesEnfrentamiento}
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.helpText}>
                Define cuántas veces jugará cada equipo contra sus rivales de grupo.
              </Text>
            </View>
          )}

          {/* Fecha (Opcional) - Solo para Amistosos */}
          {tipo === 'amistosa' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY (Ej: 25/12/2025)"
                value={fecha}
                onChangeText={setFecha}
                placeholderTextColor={colors.textLight}
                keyboardType="default"
              />
              {fecha && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setFecha('')}
                >
                  <Text style={styles.clearButtonText}>Limpiar fecha</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.helpText}>
                Formato: Día/Mes/Año (ej: 25/12/2025). La fecha es opcional.
              </Text>
            </View>
          )}

          {/* Fecha (Opcional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY (Ej: 25/12/2025)"
              value={fecha}
              onChangeText={setFecha}
              placeholderTextColor={colors.textLight}
              keyboardType="default"
            />
            {fecha && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFecha('')}
              >
                <Text style={styles.clearButtonText}>Limpiar fecha</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.helpText}>
              Formato: Día/Mes/Año (ej: 25/12/2025). La fecha es opcional.
            </Text>
          </View>

          {/* Switch: Aplicar fecha automáticamente */}
          {fecha.trim() && (
            <View style={styles.switchContainer}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Aplicar fecha automáticamente</Text>
                <Text style={styles.switchDescription}>
                  Los nuevos partidos heredarán la fecha de esta ronda
                </Text>
              </View>
              <Switch
                value={aplicarFechaAutomatica}
                onValueChange={setAplicarFechaAutomatica}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={aplicarFechaAutomatica ? colors.primary : colors.backgroundGray}
              />
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Una vez creada la ronda, podrás agregar partidos manualmente o usar la
              función de generación automática de fixture.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón Crear */}
      <View style={styles.footer}>
        <Button
          title="Crear Ronda"
          onPress={handleCreate}
          style={styles.createButton}
        />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.success,
  },
  applyDateButton: {
    marginBottom: 16,
    borderColor: colors.primary,
  },
  tipoContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  tipoButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    gap: 8,
  },
  tipoButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tipoButtonDisabled: {
    opacity: 0.4,
    backgroundColor: colors.backgroundGray,
    borderColor: colors.border,
  },
  tipoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  tipoButtonTextSelected: {
    color: colors.white,
  },
  tipoButtonTextDisabled: {
    color: colors.disabled,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginTop: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
