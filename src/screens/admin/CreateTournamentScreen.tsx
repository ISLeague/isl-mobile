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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { safeAsync, getUserFriendlyMessage } from '../../utils/errorHandling';
import api from '../../api';

export const CreateTournamentScreen = ({ navigation, route }: any) => {
  const { pais } = route.params;
  const { showSuccess, showError, showWarning } = useToast();
  const [nombre, setNombre] = useState('');
  const [edicion, setEdicion] = useState('2025');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    // Validaciones
    if (!nombre.trim()) {
      showWarning('El nombre del torneo es requerido', 'Campo requerido');
      return;
    }

    if (!edicion.trim()) {
      showWarning('La temporada/edición es requerida', 'Campo requerido');
      return;
    }

    setLoading(true);

    const result = await safeAsync(
      async () => {
       

        const response = await api.torneos.create({
          nombre: nombre.trim(),
          temporada: edicion.trim(),
          id_pais: pais.id_pais,
        });

        // console.log('✅ [CreateTournament] Torneo creado:', response);
        return response;
      },
      'createTournament',
      {
        severity: 'high',
        fallbackValue: null,
        onError: (error) => {
          // console.error('❌ [CreateTournament] Error:', error);
          showError(getUserFriendlyMessage(error), 'Error al crear torneo');
        }
      }
    );

    setLoading(false);

    if (result && result.success) {
      showSuccess(`Torneo "${nombre}" creado correctamente`, '¡Éxito!');

      const nuevoTorneo = result.data || null;

      // Notificar al padre (si pasó callback) y refrescar pantalla previa
      if (route.params?.onCreated) {
        route.params.onCreated(nuevoTorneo);
      }

      // Manda flag de refresco al stack anterior y vuelve inmediatamente
      navigation.navigate({
        name: 'TournamentDetails',
        params: { refresh: Date.now() },
        merge: true,
      });
      navigation.goBack();
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
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Crear Torneo</Text>

          <View style={styles.paisInfo}>
            <Text style={styles.paisName}>  {pais.nombre}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Nombre del Torneo *"
            placeholder="Ej: ISL Lima"
            value={nombre}
            onChangeText={setNombre}
            leftIcon={
              <MaterialCommunityIcons
                name="trophy"
                size={22}
                color={colors.primary}
              />
            }
          />

          <Input
            label="Edición/Temporada *"
            placeholder="Ej: 2025"
            value={edicion}
            onChangeText={setEdicion}
            keyboardType="numeric"
            leftIcon={
              <MaterialCommunityIcons
                name="calendar"
                size={22}
                color={colors.primary}
              />
            }
          />

          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={22}
              color={colors.info}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.infoText}>
              Después de crear el torneo, podrás agregar categorías (SUB16, SUB18,
              etc.) y configurar las fases del torneo.
            </Text>
          </View>

          <Button
            title="Crear Torneo"
            onPress={handleCreate}
            loading={loading}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  paisInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paisName: {
    fontSize: 16,
    color: colors.textSecondary,
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
  },
  createButton: {
    marginTop: 8,
  },
});

export default CreateTournamentScreen;