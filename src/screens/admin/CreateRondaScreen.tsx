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
import { Button } from '../../components/common';

interface CreateRondaScreenProps {
  navigation: any;
  route: any;
}

export const CreateRondaScreen: React.FC<CreateRondaScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria, tipo: tipoParam, subtipo_eliminatoria } = route.params || {};
  
  // Si viene con tipo en params (desde Knockout), úsalo y no permitas cambiarlo
  const tipoFijo = tipoParam || null;
  const esDesdeKnockout = tipoParam === 'eliminatorias';
  
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState<'fase_grupos' | 'eliminatorias' | 'amistosa'>(
    tipoParam || 'fase_grupos'
  );
  const [subtipoEliminatoria, setSubtipoEliminatoria] = useState<'oro' | 'plata' | 'bronce'>(
    subtipo_eliminatoria || 'oro'
  );
  const [aplicarFechaAutomatica, setAplicarFechaAutomatica] = useState(false);

  const handleCreate = () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la ronda es requerido');
      return;
    }

    // Validar formato de fecha solo si hay fecha (DD/MM/YYYY)
    if (fecha.trim()) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(fecha)) {
        Alert.alert('Error', 'El formato de la fecha debe ser DD/MM/YYYY (ej: 25/12/2025)');
        return;
      }
    }

    const rondaData = {
      nombre,
      fecha: fecha || undefined,
      tipo,
      subtipo_eliminatoria: tipo === 'eliminatorias' ? subtipoEliminatoria : undefined,
      aplicar_fecha_automatica: aplicarFechaAutomatica,
      id_fase: 1, // TODO: Obtener el ID de fase correcto
      id_edicion_categoria: idEdicionCategoria,
      es_amistosa: tipo === 'amistosa',
    };

    console.log('Crear ronda:', rondaData);
    
    // TODO: Llamar a la API para crear la ronda
    // await api.fixture.createRonda(rondaData);
    
    Alert.alert('Éxito', `Ronda "${nombre}" creada exitosamente. Ahora puedes agregar partidos.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
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
            console.log('Aplicar fecha a todos los partidos sin fecha:', fecha);
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
            {esDesdeKnockout && (
              <Text style={styles.helpText}>Tipo fijado desde sección Knockout (Eliminatorias)</Text>
            )}
            <View style={styles.tipoContainer}>
              {(['fase_grupos', 'eliminatorias', 'amistosa'] as const)
                .filter(tipoOption => {
                  // Si es desde Knockout, solo mostrar eliminatorias
                  if (esDesdeKnockout) return tipoOption === 'eliminatorias';
                  // Si NO es desde Knockout, NO mostrar eliminatorias
                  return tipoOption !== 'eliminatorias';
                })
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
            {!esDesdeKnockout && (
              <Text style={styles.helpText}>
                💡 Las rondas eliminatorias se crean desde la sección Knockout
              </Text>
            )}
          </View>

          {/* Subtipo de Eliminatoria (solo si tipo === 'eliminatorias') */}
          {tipo === 'eliminatorias' && (
            <View style={styles.inputGroup}>
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
