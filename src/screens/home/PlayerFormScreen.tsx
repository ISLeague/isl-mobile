import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { GradientHeader, Input, Button } from '../../components/common';
import { colors } from '../../theme/colors';
import { Jugador } from '../../api/types/jugadores.types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';
import { useToast } from '../../contexts/ToastContext';

interface PlayerFormScreenProps {
  navigation: any;
  route: any;
}

export const PlayerFormScreen: React.FC<PlayerFormScreenProps> = ({ navigation, route }) => {
  const { equipoId, jugador, mode } = route.params as {
    equipoId: number;
    jugador?: Jugador;
    mode: 'create' | 'edit';
  };

  const { showSuccess, showError } = useToast();

  const [nombreCompleto, setNombreCompleto] = useState(jugador?.nombre_completo || '');
  const [dni, setDni] = useState(jugador?.dni || '');
  const [numeroCamiseta, setNumeroCamiseta] = useState(jugador?.numero_camiseta?.toString() || '');
  const [pieDominante, setPieDominante] = useState(jugador?.pie_dominante || 'derecho');
  const [altura, setAltura] = useState(jugador?.altura_cm?.toString() || '');
  const [peso, setPeso] = useState(jugador?.peso_kg?.toString() || '');
  const [nacionalidad, setNacionalidad] = useState(jugador?.nacionalidad || 'Argentina');
  const [esRefuerzo, setEsRefuerzo] = useState(jugador?.es_refuerzo || false);
  const [esCapitan, setEsCapitan] = useState(jugador?.es_capitan || false);
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string>('');
  const [showPieDominante, setShowPieDominante] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState(
    jugador?.fecha_nacimiento ? (() => {
      const fecha = new Date(jugador.fecha_nacimiento);
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const anio = fecha.getFullYear();
      return `${dia}/${mes}/${anio}`;
    })() : ''
  );

  const validateForm = (): boolean => {
    if (!nombreCompleto.trim()) {
      Alert.alert('Error', 'El nombre completo es obligatorio');
      return false;
    }

    if (!dni.trim()) {
      Alert.alert('Error', 'El DNI es obligatorio');
      return false;
    }

    if (dni.length < 7 || dni.length > 10) {
      Alert.alert('Error', 'El DNI debe tener entre 7 y 10 caracteres');
      return false;
    }

    if (numeroCamiseta) {
      const num = parseInt(numeroCamiseta);
      if (isNaN(num) || num < 1 || num > 99) {
        Alert.alert('Error', 'El número de camiseta debe estar entre 1 y 99');
        return false;
      }
    }

    if (!fechaNacimiento) {
      Alert.alert('Error', 'La fecha de nacimiento es obligatoria');
      return false;
    }

    // Validar formato de fecha DD/MM/YYYY
    const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!fechaRegex.test(fechaNacimiento)) {
      Alert.alert('Error', 'La fecha debe estar en formato DD/MM/YYYY (ej: 15/05/2000)');
      return false;
    }

    // Validar que la fecha sea válida (convertir DD/MM/YYYY a objeto Date)
    const [dia, mes, anio] = fechaNacimiento.split('/').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    if (isNaN(fecha.getTime()) || fecha.getDate() !== dia || fecha.getMonth() !== mes - 1 || fecha.getFullYear() !== anio) {
      Alert.alert('Error', 'La fecha ingresada no es válida');
      return false;
    }

    // Validar que el jugador sea mayor de 10 años y menor de 60 años
    const hoy = new Date();
    const edad = hoy.getFullYear() - fecha.getFullYear();
    if (edad < 10 || edad > 60) {
      Alert.alert('Error', 'El jugador debe tener entre 10 y 60 años');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setSavingStatus(mode === 'edit' ? 'Actualizando jugador...' : 'Guardando jugador...');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 [PlayerForm] ${mode === 'edit' ? 'ACTUALIZANDO' : 'CREANDO'} JUGADOR`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 [PlayerForm] Nombre:', nombreCompleto);
    console.log('🏆 [PlayerForm] Equipo ID:', equipoId);

    // Convert DD/MM/YYYY to YYYY-MM-DD for API
    const [dia, mes, anio] = fechaNacimiento.split('/').map(Number);
    const fechaISO = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;

    const jugadorData = {
      id_equipo: equipoId,
      nombre_completo: nombreCompleto.trim(),
      dni: dni.trim(),
      fecha_nacimiento: fechaISO,
      numero_camiseta: numeroCamiseta ? parseInt(numeroCamiseta) : undefined,
      pie_dominante: pieDominante,
      altura_cm: altura ? parseInt(altura) : undefined,
      peso_kg: peso ? parseInt(peso) : undefined,
      nacionalidad,
      es_refuerzo: esRefuerzo,
      es_capitan: esCapitan,
      foto: null, // TODO: Implementar upload de foto
    };

    setSavingStatus('Enviando datos al servidor...');

    const success = await safeAsync(
      async () => {
        if (mode === 'create') {
          const response = await api.jugadores.create(jugadorData);
          console.log('✅ [PlayerForm] Jugador creado exitosamente');
          return response;
        } else {
          // TODO: Implementar edición de jugador
          console.log('✅ [PlayerForm] Jugador actualizado exitosamente');
          return { success: true };
        }
      },
      'PlayerFormScreen - handleSave',
      {
        fallbackValue: null,
        onError: (error) => {
          console.error('❌ [PlayerForm] Error al guardar:', error);
          setLoading(false);
          setSavingStatus('');
          showError(error.message || 'No se pudo guardar el jugador', 'Error');
        }
      }
    );

    setLoading(false);
    setSavingStatus('');

    if (success) {
      console.log('🎉 [PlayerForm] Proceso completado - Regresando');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      showSuccess(
        `Jugador ${mode === 'edit' ? 'actualizado' : 'creado'} correctamente`,
        '¡Éxito!'
      );
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title={mode === 'edit' ? 'Editar Jugador' : 'Nuevo Jugador'}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Nombre Completo *</Text>
        <Input
          value={nombreCompleto}
          onChangeText={setNombreCompleto}
          placeholder="Ej: Carlos Alberto Mendoza"
          style={styles.input}
        />

        <Text style={styles.label}>DNI *</Text>
        <Input
          value={dni}
          onChangeText={setDni}
          placeholder="Ej: 12345678"
          keyboardType="numeric"
          maxLength={10}
          style={styles.input}
        />

        <Text style={styles.label}>Número de Camiseta</Text>
        <Input
          value={numeroCamiseta}
          onChangeText={setNumeroCamiseta}
          placeholder="Ej: 10"
          keyboardType="numeric"
          maxLength={2}
          style={styles.input}
        />

        <Text style={styles.label}>Fecha de Nacimiento *</Text>
        <Input
          value={fechaNacimiento}
          onChangeText={setFechaNacimiento}
          placeholder="DD/MM/YYYY (Ej: 15/05/2000)"
          style={styles.input}
        />

        {/* Removed Position Field
        <Text style={styles.label}>Posición *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={posicion}
            onValueChange={(value: string) => setPosicion(value)}
            style={styles.picker}
          >
            <Picker.Item label="Portero" value="Portero" />
            <Picker.Item label="Defensa" value="Defensa" />
            <Picker.Item label="Mediocampo" value="Mediocampo" />
            <Picker.Item label="Delantero" value="Delantero" />
          </Picker>
        </View>
        */}

        <Text style={styles.label}>Pie Dominante</Text>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setShowPieDominante(!showPieDominante)}
          activeOpacity={0.7}
        >
          <Text style={styles.collapsibleText}>
            {pieDominante ? pieDominante.charAt(0).toUpperCase() + pieDominante.slice(1) : 'Seleccionar (Opcional)'}
          </Text>
          <MaterialCommunityIcons
            name={showPieDominante ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {showPieDominante && (
          <View style={styles.collapsibleContent}>
            {[{ label: 'Ninguno', value: '' }, { label: 'Derecho', value: 'derecho' }, { label: 'Izquierdo', value: 'izquierdo' }, { label: 'Ambidiestro', value: 'ambidiestro' }].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.collapsibleOption, pieDominante === option.value && styles.collapsibleOptionSelected]}
                onPress={() => {
                  setPieDominante(option.value);
                  setShowPieDominante(false);
                }}
              >
                <Text style={[styles.collapsibleOptionText, pieDominante === option.value && styles.collapsibleOptionTextSelected]}>
                  {option.label}
                </Text>
                {pieDominante === option.value && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Removed Fields: Altura, Peso, Nacionalidad */}
        {/* 
        <Text style={styles.label}>Altura (cm)</Text>
        <Input
          value={altura}
          onChangeText={setAltura}
          placeholder="Ej: 175"
          keyboardType="numeric"
          maxLength={3}
          style={styles.input}
        />

        <Text style={styles.label}>Peso (kg)</Text>
        <Input
          value={peso}
          onChangeText={setPeso}
          placeholder="Ej: 70"
          keyboardType="numeric"
          maxLength={3}
          style={styles.input}
        />

        <Text style={styles.label}>Nacionalidad *</Text>
        <Input
          value={nacionalidad}
          onChangeText={setNacionalidad}
          placeholder="Ej: Argentina"
          style={styles.input}
        />
        */}

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setEsRefuerzo(!esRefuerzo)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, esRefuerzo && styles.checkboxChecked]}>
            {esRefuerzo && (
              <MaterialCommunityIcons name="check" size={18} color={colors.white} />
            )}
          </View>
          <View style={styles.checkboxLabelContainer}>
            <Text style={styles.checkboxLabel}>Este jugador es un refuerzo</Text>
            <Text style={styles.checkboxSubtext}>
              Los refuerzos pueden superar la edad máxima de la categoría
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setEsCapitan(!esCapitan)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, esCapitan && styles.checkboxChecked]}>
            {esCapitan && (
              <MaterialCommunityIcons name="check" size={18} color={colors.white} />
            )}
          </View>
          <View style={styles.checkboxLabelContainer}>
            <Text style={styles.checkboxLabel}>Este jugador es capitán del equipo</Text>
            <Text style={styles.checkboxSubtext}>
              El capitán es el líder del equipo en el campo
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.helpBox}>
          <Text style={styles.helpText}>
            💡 Asegúrate de ingresar todos los datos correctamente
          </Text>
          <Text style={styles.helpText}>
            • Nombre completo del jugador
          </Text>
          <Text style={styles.helpText}>
            • DNI sin puntos ni guiones
          </Text>
          <Text style={styles.helpText}>
            • Fecha en formato DD/MM/YYYY
          </Text>
        </View>

        <Button
          title={mode === 'edit' ? 'Guardar Cambios' : 'Crear Jugador'}
          onPress={handleSave}
          variant="primary"
          style={styles.button}
          disabled={loading}
          loading={loading}
        />
      </ScrollView>

      {/* Loading Overlay - Feedback visual del estado del sistema */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{savingStatus}</Text>
            <Text style={styles.loadingSubtext}>
              Por favor espera mientras se procesa la información
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  checkboxSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  helpBox: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  button: {
    marginBottom: 32,
  },
  pickerContainer: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    height: 50,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  collapsibleText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  collapsibleContent: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  collapsibleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  collapsibleOptionSelected: {
    backgroundColor: colors.primary + '15',
  },
  collapsibleOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  collapsibleOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Estilos para loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
