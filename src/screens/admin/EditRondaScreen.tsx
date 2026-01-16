import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button, Card, GradientHeader } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';

export const EditRondaScreen = ({ navigation, route }: any) => {
  const { ronda } = route.params;
  const { showSuccess, showError } = useToast();

  const [nombre, setNombre] = useState(ronda.nombre);
  const [fecha, setFecha] = useState(ronda.fecha_inicio || '');
  const [orden, setOrden] = useState(ronda.orden?.toString() || '1');
  const [tipo, setTipo] = useState<'fase_grupos' | 'eliminatorias' | 'amistosa'>(
    ronda.tipo || 'fase_grupos'
  );
  const [subtipoEliminatoria, setSubtipoEliminatoria] = useState<'oro' | 'plata' | 'bronce'>(
    ronda.subtipo_eliminatoria || 'oro'
  );
  const [aplicarFechaAutomatica, setAplicarFechaAutomatica] = useState(
    ronda.aplicar_fecha_automatica || false
  );
  const [loading, setLoading] = useState(false);

  const handleUpdate = () => {
    if (!nombre.trim()) {
      showError('El nombre de la ronda es obligatorio');
      return;
    }

    // Validar formato de fecha si no está vacía
    if (fecha.trim()) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(fecha)) {
        showError('El formato de la fecha debe ser DD/MM/YYYY (ej: 25/12/2025)');
        return;
      }
    }

    Alert.alert(
      'Confirmar Cambios',
      `¿Deseas actualizar la ronda "${ronda.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: async () => {
            setLoading(true);
            const result = await safeAsync(
              async () => {
                const response = await api.rondas.update(ronda.id_ronda, {
                  nombre,
                  fecha_inicio: fecha,
                  orden: parseInt(orden),
                  tipo,
                  subtipo_eliminatoria: tipo === 'eliminatorias' ? subtipoEliminatoria : undefined,
                });
                return response;
              },
              'EditRonda - handleUpdate',
              {
                fallbackValue: null,
                onError: (error) => {
                  showError('Error al actualizar la ronda');
                },
              }
            );

            setLoading(false);

            if (result && result.success) {
              showSuccess('Ronda actualizada exitosamente');
              navigation.goBack();
            }
          },
        },
      ]
    );
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

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Ronda',
      `¿Estás seguro de eliminar la ronda "${ronda.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await safeAsync(
              async () => {
                const response = await api.rondas.delete(ronda.id_ronda);
                return response;
              },
              'EditRonda - handleDelete',
              {
                fallbackValue: null,
                onError: (error) => {
                  showError('Error al eliminar la ronda');
                },
              }
            );

            setLoading(false);

            if (result && result.success) {
              showSuccess('Ronda eliminada exitosamente');
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleApplyDateToAllMatches = () => {
    if (!fecha.trim()) {
      showError('Debes ingresar una fecha primero');
      return;
    }

    // Validar formato de fecha
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(fecha)) {
      showError('El formato de la fecha debe ser DD/MM/YYYY (ej: 25/12/2025)');
      return;
    }

    // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para la base de datos
    const [day, month, year] = fecha.split('/');
    const fechaISO = `${year}-${month}-${day}`;

    Alert.alert(
      'Aplicar Fecha',
      `¿Deseas aplicar la fecha "${fecha}" a todos los partidos de esta ronda?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: async () => {
            setLoading(true);
            const result = await safeAsync(
              async () => {
                const response = await api.rondas.applyDateToMatches(ronda.id_ronda, fechaISO);
                return response;
              },
              'EditRonda - applyDateToMatches',
              {
                fallbackValue: null,
                onError: () => {
                  showError('Error al aplicar la fecha a los partidos');
                },
              }
            );
            setLoading(false);

            if (result && result.success) {
              showSuccess(`Fecha aplicada a ${result.data?.updated || 0} partidos`);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Editar Ronda"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Información de la Ronda</Text>

          {/* Nombre */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nombre de la Ronda *</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Jornada 1, Octavos de Final..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Tipo de Ronda */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Tipo de Ronda *</Text>
            <View style={styles.tipoContainer}>
              {(['fase_grupos', 'amistosa'] as const).map((tipoOption) => (
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
          </View>

          {/* Subtipo de Eliminatoria (solo si tipo === 'eliminatorias') */}
          {tipo === 'eliminatorias' && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Categoría de Eliminatoria *</Text>
              <View style={styles.tipoContainer}>
                {(['oro', 'plata', 'bronce'] as const).map((subtipoOption) => {
                  const subtipoColors = getSubtipoColors(subtipoOption);
                  return (
                    <TouchableOpacity
                      key={subtipoOption}
                      style={[
                        styles.tipoButton,
                        subtipoEliminatoria === subtipoOption && {
                          backgroundColor: subtipoColors[0],
                          borderColor: subtipoColors[1],
                        },
                      ]}
                      onPress={() => setSubtipoEliminatoria(subtipoOption)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={getSubtipoIcon(subtipoOption)}
                        size={24}
                        color={subtipoEliminatoria === subtipoOption ? colors.white : subtipoColors[1]}
                      />
                      <Text
                        style={[
                          styles.tipoButtonText,
                          subtipoEliminatoria === subtipoOption && styles.tipoButtonTextSelected,
                        ]}
                      >
                        {getSubtipoLabel(subtipoOption)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Fecha de la Ronda */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Fecha de la Ronda (opcional)</Text>
            <TextInput
              style={styles.input}
              value={fecha}
              onChangeText={setFecha}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              Formato: DD/MM/YYYY (ej: 25/12/2024). Puedes aplicar esta fecha a todos los partidos.
            </Text>
          </View>

          {/* Orden */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Orden</Text>
            <TextInput
              style={styles.input}
              value={orden}
              onChangeText={setOrden}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              Número que determina el orden de visualización
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

          {/* Botón: Aplicar fecha a todos los partidos */}
          {fecha.trim() && (
            <TouchableOpacity
              style={styles.applyDateButton}
              onPress={handleApplyDateToAllMatches}
            >
              <MaterialCommunityIcons name="calendar-check" size={20} color={colors.primary} />
              <Text style={styles.applyDateText}>
                Aplicar Fecha a Partidos sin Fecha
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <Button
            title="Actualizar Ronda"
            onPress={handleUpdate}
            loading={loading}
            disabled={loading}
            style={styles.updateButton}
          />

          <TouchableOpacity
            style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={loading}
          >
            <MaterialCommunityIcons name="delete" size={20} color={colors.white} />
            <Text style={styles.deleteButtonText}>Eliminar Ronda</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  applyDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 8,
  },
  applyDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  updateButton: {
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: colors.error,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
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
  tipoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  tipoButtonTextSelected: {
    color: colors.white,
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
