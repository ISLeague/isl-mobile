import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { Local } from '../../api/types';

export const EditLocalScreen = ({ navigation, route }: any) => {
  const { local } = route.params as { local: Local };

  const [nombre, setNombre] = useState(local.nombre);
  const [latitud, setLatitud] = useState(local.latitud.toString());
  const [longitud, setLongitud] = useState(local.longitud.toString());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    latitud?: string;
    longitud?: string;
  }>({});

  const validateForm = () => {
    const newErrors: any = {};

    // Validar nombre
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar latitud
    const lat = parseFloat(latitud);
    if (isNaN(lat)) {
      newErrors.latitud = 'La latitud debe ser un número';
    } else if (lat < -90 || lat > 90) {
      newErrors.latitud = 'La latitud debe estar entre -90 y 90';
    }

    // Validar longitud
    const lng = parseFloat(longitud);
    if (isNaN(lng)) {
      newErrors.longitud = 'La longitud debe ser un número';
    } else if (lng < -180 || lng > 180) {
      newErrors.longitud = 'La longitud debe estar entre -180 y 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulación de actualización en API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setLoading(false);
      Alert.alert(
        '¡Éxito!',
        `Local "${nombre}" actualizado correctamente`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo actualizar el local');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Editar Local</Text>
          <View style={styles.localInfoCard}>
            <MaterialCommunityIcons name="stadium" size={24} color={colors.primary} />
            <View style={styles.localInfoText}>
              <Text style={styles.localLabel}>Local actual</Text>
              <Text style={styles.localName}>{local.nombre}</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              Actualiza la información del local. Todos los campos son obligatorios.
            </Text>
          </View>

          <Input
            label="Nombre del Local *"
            placeholder="Ej: Complejo Deportivo Villa El Salvador"
            value={nombre}
            onChangeText={setNombre}
            error={errors.nombre}
            leftIcon={<Ionicons name="business" size={20} color={colors.textLight} />}
          />

          <Input
            label="Latitud *"
            placeholder="Ej: -12.2167"
            value={latitud}
            onChangeText={setLatitud}
            error={errors.latitud}
            keyboardType="default"
            leftIcon={<Ionicons name="navigate" size={20} color={colors.textLight} />}
          />

          <Input
            label="Longitud *"
            placeholder="Ej: -76.9333"
            value={longitud}
            onChangeText={setLongitud}
            error={errors.longitud}
            keyboardType="default"
            leftIcon={<Ionicons name="location" size={20} color={colors.textLight} />}
          />

          <View style={styles.helpBox}>
            <Ionicons name="help-circle" size={24} color={colors.warning} />
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>¿Cómo obtener coordenadas?</Text>
              <Text style={styles.helpText}>
                1. Abre Google Maps{'\n'}
                2. Busca el local{'\n'}
                3. Haz clic derecho en el mapa{'\n'}
                4. Selecciona las coordenadas que aparecen
              </Text>
            </View>
          </View>

          <Button
            title="Guardar Cambios"
            onPress={handleUpdate}
            loading={loading}
            variant="primary"
            style={styles.updateButton}
          />
        </View>
      </ScrollView>
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
    fontWeight: '600',
    marginLeft: 8,
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
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  localInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  localLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  localName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  form: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 12,
  },
  helpBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  helpTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  updateButton: {
    marginTop: 8,
  },
});

export default EditLocalScreen;
