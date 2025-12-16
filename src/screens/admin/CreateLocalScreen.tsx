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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const CreateLocalScreen = ({ navigation, route }: any) => {
  const { idEdicionCategoria } = route.params || {};
  
  const [nombre, setNombre] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
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
      newErrors.nombre = 'El nombre del local es requerido';
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Integrar con la API real
      // const response = await api.locales.createLocal({
      //   nombre: nombre.trim(),
      //   latitud: parseFloat(latitud),
      //   longitud: parseFloat(longitud),
      // });

      // Simulación de creación
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          '¡Éxito!',
          `Local "${nombre}" creado correctamente`,
          [
            {
              text: 'Crear Canchas',
              onPress: () => {
                // Navegar a crear canchas para este local
                navigation.navigate('CreateCancha', {
                  idLocal: 999, // ID simulado
                  nombreLocal: nombre,
                });
              },
            },
            {
              text: 'Finalizar',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
          ]
        );
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo crear el local. Intenta nuevamente.');
    }
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

          <Input
            label="Nombre del Local"
            placeholder="Ej: Complejo Deportivo Villa El Salvador"
            value={nombre}
            onChangeText={setNombre}
            error={errors.nombre}
            leftIcon={<Ionicons name="business" size={20} color={colors.textLight} />}
          />

          <Input
            label="Latitud"
            placeholder="Ej: -12.2167"
            value={latitud}
            onChangeText={setLatitud}
            error={errors.latitud}
            keyboardType="numeric"
            leftIcon={<Ionicons name="location" size={20} color={colors.textLight} />}
          />

          <Input
            label="Longitud"
            placeholder="Ej: -76.9333"
            value={longitud}
            onChangeText={setLongitud}
            error={errors.longitud}
            keyboardType="numeric"
            leftIcon={<Ionicons name="navigate" size={20} color={colors.textLight} />}
          />

          {/* Ayuda para obtener coordenadas */}
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

          <Button
            title="Crear Local"
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
            style={styles.createButton}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
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
  createButton: {
    marginTop: 8,
  },
});

export default CreateLocalScreen;
