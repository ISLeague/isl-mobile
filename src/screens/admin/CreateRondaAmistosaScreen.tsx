import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';

interface CreateRondaAmistosaScreenProps {
  navigation: any;
  route: any;
}

export const CreateRondaAmistosaScreen: React.FC<CreateRondaAmistosaScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria } = route.params || {};
  const { showSuccess, showError, showInfo } = useToast();

  const [nombre, setNombre] = useState('Amistosos - Fecha 1');
  const [fechaInicio, setFechaInicio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRonda = async () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la ronda es requerido');
      return;
    }

    if (!fechaInicio.trim()) {
      Alert.alert('Error', 'La fecha de inicio es requerida');
      return;
    }

    setLoading(true);

    // Get fase for this edicion
    const fasesResult = await safeAsync(
      async () => {
        const response = await api.fases.list(idEdicionCategoria);

        const fase = response.success && response.data && response.data.length > 0
          ? response.data.find((f: any) => f.tipo === 'grupo') || response.data[0]
          : null;

        return fase;
      },
      'CreateRondaAmistosaScreen - getFase',
      {
        fallbackValue: null,
        onError: (error) => {
          showError('Error al obtener la fase');
        },
      }
    );

    if (!fasesResult || !fasesResult.id_fase) {
      showError('No se encontró una fase válida para esta edición');
      setLoading(false);
      return;
    }

    const rondaData = {
      nombre: nombre.trim(),
      id_fase: fasesResult.id_fase,
      tipo: 'amistosa' as const,
      es_amistosa: true,
      fecha_inicio: fechaInicio.trim() || undefined,
      orden: 1,
    };

    const result = await safeAsync(
      async () => {
        const response = await api.rondas.create(rondaData);
        return response;
      },
      'CreateRondaAmistosaScreen - createRonda',
      {
        fallbackValue: null,
        onError: (error) => {
          showError('Error al crear la ronda');
        },
      }
    );

    setLoading(false);

    if (result && result.success && result.data) {
      const rondaId = result.data.id_ronda || result.data.id;
      showSuccess(`Ronda "${nombre}" creada exitosamente`);

      // Navegar a la pantalla de generación de fixture
      navigation.navigate('CreateRondaFlow', {
        idEdicionCategoria,
        step: 2,
        rondaData: {
          id_ronda: rondaId,
          id_fase: fasesResult.id_fase,
          nombre: nombre,
          tipo: 'amistosa',
          fecha_inicio: fechaInicio,
          fecha_fin: '',
          orden: 1,
        }
      });
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Ronda Amistosa</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la Ronda *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Amistosos - Fecha 1"
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Fecha de Inicio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha de Inicio * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 2025-12-25"
              value={fechaInicio}
              onChangeText={setFechaInicio}
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Info de Amistosos */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              En rondas amistosas, los equipos se enfrentan contra equipos de otros grupos.
              Los resultados no afectan la tabla de posiciones. Después de crear la ronda,
              podrás generar el fixture automáticamente.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón Crear */}
      <View style={styles.footer}>
        <Button
          title="Crear Ronda y Generar Fixture"
          onPress={handleCreateRonda}
          loading={loading}
          disabled={loading}
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
    marginBottom: 20,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    lineHeight: 18,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoGenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  autoGenButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  emptyPartidos: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  partidoCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  partidoInfo: {
    flex: 1,
  },
  partidoEquipos: {
    gap: 8,
  },
  equipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipoLogo: {
    width: 32,
    height: 32,
  },
  equipoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 4,
  },
  partidoDetalles: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  partidoDetalle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.info,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  teamSelector: {
    marginBottom: 24,
  },
  teamSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  selectedTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  selectedTeamLogo: {
    width: 40,
    height: 40,
  },
  selectedTeamName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  teamList: {
    maxHeight: 200,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginTop: 8,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamItemLogo: {
    width: 32,
    height: 32,
  },
  teamItemName: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  noTeamsText: {
    padding: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  modalButton: {
    marginTop: 8,
    backgroundColor: colors.success,
  },
});
