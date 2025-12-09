import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { GradientHeader, Input, Button } from '../../components/common';
import { colors } from '../../theme/colors';
import { Jugador } from '../../types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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

  const [nombreCompleto, setNombreCompleto] = useState(jugador?.nombre_completo || '');
  const [dni, setDni] = useState(jugador?.dni || '');
  const [numeroCamiseta, setNumeroCamiseta] = useState(jugador?.numero_camiseta?.toString() || '');
  const [esRefuerzo, setEsRefuerzo] = useState(false);
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

  const handleSave = () => {
    if (!validateForm()) return;

    const jugadorData = {
      id_jugador: mode === 'edit' ? jugador!.id_jugador : Date.now(),
      nombre_completo: nombreCompleto.trim(),
      dni: dni.trim(),
      numero_camiseta: numeroCamiseta ? parseInt(numeroCamiseta) : undefined,
      fecha_nacimiento: fechaNacimiento,
      estado: 'activo' as const,
    };

    // TODO: Llamar a la API para crear/editar jugador
    console.log(mode === 'edit' ? 'Editando jugador:' : 'Creando jugador:', jugadorData);

    Alert.alert(
      'Éxito',
      `Jugador ${mode === 'edit' ? 'actualizado' : 'creado'} correctamente`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
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
        />
      </ScrollView>
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
});
