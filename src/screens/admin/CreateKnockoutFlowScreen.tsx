import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';
import { TipoCopa } from '../../api/types';

interface CreateKnockoutFlowScreenProps {
  navigation: any;
  route: any;
}

type RondaEliminatoria = 'eliminatoria' | '16avos' | 'octavos' | 'cuartos' | 'semifinal' | 'final';

export const CreateKnockoutFlowScreen: React.FC<CreateKnockoutFlowScreenProps> = ({
  navigation,
  route,
}) => {
  const { idEdicionCategoria } = route.params || {};
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [selectedCopa, setSelectedCopa] = useState<TipoCopa>('oro');
  const [selectedRonda, setSelectedRonda] = useState<RondaEliminatoria>('octavos');
  const [nombre, setNombre] = useState('');
  const [creationMode, setCreationMode] = useState<'manual' | 'automatic'>('manual');

  // Opciones de copa
  const copas: TipoCopa[] = ['oro', 'plata', 'bronce'];

  // Opciones de ronda
  const rondas: { value: RondaEliminatoria; label: string }[] = [
    { value: 'eliminatoria', label: 'Eliminatoria' },
    { value: '16avos', label: '16avos de Final' },
    { value: 'octavos', label: 'Octavos de Final' },
    { value: 'cuartos', label: 'Cuartos de Final' },
    { value: 'semifinal', label: 'Semifinales' },
    { value: 'final', label: 'Final' },
  ];

  /* Helper para orden */
  const getRondaOrden = (ronda: RondaEliminatoria): number => {
    const ordenMap: Record<RondaEliminatoria, number> = {
      'eliminatoria': 0,
      '16avos': 1,
      'octavos': 2,
      'cuartos': 3,
      'semifinal': 4,
      'final': 5,
    };
    return ordenMap[ronda] || 0;
  };

  const getPreviousRondaLabel = (currentRonda: RondaEliminatoria): string => {
    const currentOrder = getRondaOrden(currentRonda);
    if (currentOrder === 0) return 'Clasificación / Grupos';

    const prevOrder = currentOrder - 1;
    const prevRonda = rondas.find(r => getRondaOrden(r.value) === prevOrder);
    return prevRonda ? prevRonda.label : 'Ronda Anterior';
  };

  // Actualizar nombre cuando cambie la ronda
  useEffect(() => {
    const rondaLabel = rondas.find(r => r.value === selectedRonda)?.label || '';
    const copaLabel = selectedCopa.charAt(0).toUpperCase() + selectedCopa.slice(1);
    setNombre(`${rondaLabel} - Copa ${copaLabel}`);
  }, [selectedRonda, selectedCopa]);

  const handleCreate = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la ronda es requerido');
      return;
    }

    console.log('🎯 [CreateKnockout] ========================================');
    console.log('🎯 [CreateKnockout] Iniciando creación de ronda knockout');
    console.log('Modo:', creationMode);
    console.log('📋 [CreateKnockout] Copa seleccionada:', selectedCopa);
    console.log('📋 [CreateKnockout] Ronda seleccionada:', selectedRonda);
    console.log('📋 [CreateKnockout] Nombre:', nombre);
    console.log('📋 [CreateKnockout] ID Edición Categoría:', idEdicionCategoria);

    setLoading(true);

    const result = await safeAsync(
      async () => {
        // 1. Obtener la fase knockout para esta copa
        console.log('🔍 [CreateKnockout] Buscando fase knockout para copa:', selectedCopa);
        const fasesResponse = await api.fases.list(idEdicionCategoria);
        console.log('🔍 [CreateKnockout] Fases encontradas:', fasesResponse.data?.length || 0);

        const fase = fasesResponse.success && fasesResponse.data && fasesResponse.data.length > 0
          ? fasesResponse.data.find((f: any) => f.tipo === 'knockout' && f.copa === selectedCopa)
          : null;

        if (!fase || !fase.id_fase) {
          console.log('❌ [CreateKnockout] No se encontró fase knockout para copa:', selectedCopa);
          throw new Error(`No se encontró la fase knockout para Copa ${selectedCopa.toUpperCase()}`);
        }

        console.log('✅ [CreateKnockout] Fase encontrada:', fase.nombre, '| ID:', fase.id_fase);

        // 2. Crear la ronda
        const rondaData: any = {
          nombre,
          tipo: 'eliminatorias' as const,
          subtipo_eliminatoria: selectedCopa, // Copa a la que pertenece (oro/plata/bronce)
          stage_eliminatoria: selectedRonda, // Tipo de ronda (eliminatoria/16avos/octavos/etc)
          id_fase: fase.id_fase,
          id_edicion_categoria: idEdicionCategoria,
          orden: getRondaOrden(selectedRonda),
          // Enviamos el modo de creación para que el backend sepa si debe generar llaves auto
          metodo_asignacion: creationMode === 'automatic' ? ('automatico_llaves' as const) : ('manual' as const)
        };

        console.log('📤 [CreateKnockout] Datos de ronda a crear:');
        console.log('   - nombre:', rondaData.nombre);
        console.log('   - tipo:', rondaData.tipo);
        console.log('   - subtipo_eliminatoria (COPA):', rondaData.subtipo_eliminatoria);
        console.log('   - stage_eliminatoria (STAGE):', rondaData.stage_eliminatoria);
        console.log('   - id_fase:', rondaData.id_fase);
        console.log('   - id_edicion_categoria:', rondaData.id_edicion_categoria);
        console.log('   - orden:', rondaData.orden);
        console.log('   - metodo_asignacion:', rondaData.metodo_asignacion);


        const createResponse = await api.rondas.create(rondaData);
        console.log('✅ [CreateKnockout] Respuesta de creación:', createResponse);

        return createResponse;
      },
      'CreateKnockout - handleCreate',
      {
        fallbackValue: null,
        onError: (error: any) => {
          showError(error.message || 'No se pudo crear la ronda');
        }
      }
    );

    if (result && result.success) {
      showSuccess(`Ronda "${nombre}" creada exitosamente`);
      navigation.goBack();
    }

    setLoading(false);
  };

  const getCopaGradient = (copa: TipoCopa) => {
    switch (copa) {
      case 'oro':
        return ['#FFD700', '#FFA500'];
      case 'plata':
        return ['#C0C0C0', '#A8A8A8'];
      case 'bronce':
        return ['#CD7F32', '#B8733C'];
    }
  };

  const getCopaLabel = (copa: TipoCopa) => {
    return copa.charAt(0).toUpperCase() + copa.slice(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Ronda Knockout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selector de Copa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Copa</Text>
          <View style={styles.copaButtons}>
            {copas.map((copa) => (
              <TouchableOpacity
                key={copa}
                style={[
                  styles.copaButton,
                  selectedCopa === copa && styles.copaButtonActive,
                ]}
                onPress={() => setSelectedCopa(copa)}
              >
                <MaterialCommunityIcons
                  name="trophy"
                  size={24}
                  color={selectedCopa === copa ? colors.white : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.copaButtonText,
                    selectedCopa === copa && styles.copaButtonTextActive,
                  ]}
                >
                  {getCopaLabel(copa)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selector de Ronda */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Ronda</Text>
          <View style={styles.rondasList}>
            {rondas.map((ronda) => (
              <TouchableOpacity
                key={ronda.value}
                style={[
                  styles.rondaItem,
                  selectedRonda === ronda.value && styles.rondaItemActive,
                ]}
                onPress={() => setSelectedRonda(ronda.value)}
              >
                <View style={styles.rondaInfo}>
                  <MaterialCommunityIcons
                    name="tournament"
                    size={20}
                    color={
                      selectedRonda === ronda.value ? colors.primary : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.rondaLabel,
                      selectedRonda === ronda.value && styles.rondaLabelActive,
                    ]}
                  >
                    {ronda.label}
                  </Text>
                </View>
                {selectedRonda === ronda.value && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nombre de la Ronda */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nombre de la Ronda</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Octavos de Final - Copa Oro"
            placeholderTextColor={colors.textLight}
          />
        </View>

        {/* Método de Creación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Creación</Text>
          <View style={styles.modeContainer}>
            {/* Opción Manual */}
            <TouchableOpacity
              style={[
                styles.modeCard,
                creationMode === 'manual' && styles.modeCardActive
              ]}
              onPress={() => setCreationMode('manual')}
            >
              <View style={styles.modeIconContainer}>
                <MaterialCommunityIcons
                  name="playlist-plus"
                  size={24}
                  color={creationMode === 'manual' ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={[
                  styles.modeTitle,
                  creationMode === 'manual' && styles.modeTitleActive
                ]}>
                  Ronda Vacía
                </Text>
                <Text style={styles.modeDescription}>
                  Crear una ronda sin partidos. Agregarás los cruces manualmente.
                </Text>
              </View>
              {creationMode === 'manual' && (
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Opción Automática */}
            <TouchableOpacity
              style={[
                styles.modeCard,
                creationMode === 'automatic' && styles.modeCardActive
              ]}
              onPress={() => setCreationMode('automatic')}
            >
              <View style={styles.modeIconContainer}>
                <MaterialCommunityIcons
                  name="file-tree"
                  size={24}
                  color={creationMode === 'automatic' ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={[
                  styles.modeTitle,
                  creationMode === 'automatic' && styles.modeTitleActive
                ]}>
                  Basado en Lógica Previa
                </Text>
                <Text style={styles.modeDescription}>
                  {getRondaOrden(selectedRonda) === 0
                    ? 'Generar cruces según las reglas de clasificación / grupos.'
                    : `Generar cruces basados en los ganadores de: ${getPreviousRondaLabel(selectedRonda)}.`}
                </Text>
              </View>
              {creationMode === 'automatic' && (
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, creationMode === 'automatic' && styles.infoBoxWarning]}>
          <MaterialCommunityIcons
            name={creationMode === 'automatic' ? "alert-circle-outline" : "information-outline"}
            size={20}
            color={creationMode === 'automatic' ? colors.warning : colors.info}
          />
          <Text style={[styles.infoText, creationMode === 'automatic' && styles.infoTextWarning]}>
            {creationMode === 'manual'
              ? 'Se creará una ronda vacía. Podrás agregar partidos manualmente con CUALQUIER equipo de la edición, sin restricciones de grupo o clasificación.'
              : getRondaOrden(selectedRonda) === 0
                ? 'Se generarán automáticamente los cruces basados en las REGLAS DE CLASIFICACIÓN de la fase de grupos o torneo anterior.'
                : `Se generarán automáticamente los cruces basados en los GANADORES de: ${getPreviousRondaLabel(selectedRonda)}.`}
          </Text>
        </View>
      </ScrollView>

      {/* Footer con botón */}
      <View style={styles.footer}>
        <Button
          title="Crear Ronda"
          onPress={handleCreate}
          loading={loading}
          disabled={loading || !nombre.trim()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  copaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  copaButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  copaButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  copaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  copaButtonTextActive: {
    color: colors.white,
  },
  rondasList: {
    gap: 8,
  },
  rondaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  rondaItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rondaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rondaLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  rondaLabelActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.info,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modeContainer: {
    gap: 12,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 12,
  },
  modeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  modeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTextContainer: {
    flex: 1,
    gap: 4,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modeTitleActive: {
    color: colors.primary,
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  infoBoxWarning: {
    backgroundColor: '#FFF3E0',
  },
  infoTextWarning: {
    color: colors.warning,
  },
});
