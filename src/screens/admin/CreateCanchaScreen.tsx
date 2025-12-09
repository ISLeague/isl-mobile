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
import { colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const CreateCanchaScreen = ({ navigation, route }: any) => {
  const { idLocal, nombreLocal } = route.params || {};
  
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string }>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre de la cancha es requerido';
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
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
      // const response = await mockApi.canchas.createCancha({
      //   nombre: nombre.trim(),
      //   id_local: idLocal,
      // });

      // Simulación de creación
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          '¡Éxito!',
          `Cancha "${nombre}" creada correctamente`,
          [
            {
              text: 'Crear Otra',
              onPress: () => {
                setNombre('');
                setErrors({});
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
      Alert.alert('Error', 'No se pudo crear la cancha. Intenta nuevamente.');
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

          <Input
            label="Nombre de la Cancha"
            placeholder="Ej: Cancha Principal A"
            value={nombre}
            onChangeText={setNombre}
            error={errors.nombre}
            leftIcon={<MaterialCommunityIcons name="soccer-field" size={20} color={colors.textLight} />}
          />

          <Button
            title="Crear Cancha"
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
  createButton: {
    marginTop: 8,
  },
});

export default CreateCanchaScreen;
