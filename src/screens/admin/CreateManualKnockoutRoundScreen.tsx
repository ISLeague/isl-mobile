import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { TipoCopa } from '../../api/types';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import api from '../../api';

interface CreateManualKnockoutRoundScreenProps {
  navigation: any;
  route: {
    params: {
      idEdicionCategoria: number;
      idFase: number;
      copa: TipoCopa;
    };
  };
}

type RondaEliminatoria = 'eliminatoria' | '16avos' | 'octavos' | 'cuartos' | 'semifinal' | 'final';

const RONDA_LABELS: Record<RondaEliminatoria, string> = {
  'eliminatoria': 'Eliminatoria',
  '16avos': '16avos de Final',
  'octavos': 'Octavos de Final',
  'cuartos': 'Cuartos de Final',
  'semifinal': 'Semifinales',
  'final': 'Final',
};

const getCopaGradient = (copa: TipoCopa): [string, string, string] => {
  switch (copa) {
    case 'oro':
      return ['#FFD700', '#FFA500', '#FF8C00'];
    case 'plata':
      return ['#C0C0C0', '#A8A8A8', '#909090'];
    case 'bronce':
      return ['#CD7F32', '#B8733C', '#A86832'];
    default:
      return ['#FFD700', '#FFA500', '#FF8C00'];
  }
};

const getOrdenRonda = (ronda: RondaEliminatoria): number => {
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

export const CreateManualKnockoutRoundScreen: React.FC<CreateManualKnockoutRoundScreenProps> = ({
  navigation,
  route,
}) => {
  const { idEdicionCategoria, idFase, copa } = route.params;
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [equiposDisponibles, setEquiposDisponibles] = useState<any[]>([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<Set<number>>(new Set());
  const [rondaDeterminada, setRondaDeterminada] = useState<RondaEliminatoria | null>(null);
  const [rondasExistentes, setRondasExistentes] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const gradientColors = getCopaGradient(copa);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    console.log('🔄 [CreateManualKnockout] Cargando datos iniciales...');
    setLoading(true);

    const result = await safeAsync(
      async () => {
        // PASO 1: Listar rondas existentes
        console.log('📋 [CreateManualKnockout] Obteniendo rondas existentes...');
        const rondasResponse = await api.rondas.list({
          id_fase: idFase,
          tipo_ronda: 'eliminatorias',
        });

        let rondas: any[] = [];
        if (rondasResponse.success && rondasResponse.data) {
          const todasLasRondas = Array.isArray(rondasResponse.data)
            ? rondasResponse.data
            : rondasResponse.data.rondas || [];
          rondas = todasLasRondas.filter((r: any) => r.subtipo_eliminatoria === copa);
        }

        console.log(`📋 [CreateManualKnockout] Rondas existentes: ${rondas.length}`);

        // PASO 2: Obtener equipos disponibles
        let equipos: any[] = [];

        if (rondas.length === 0) {
          // PRIMERA RONDA - Traer TODOS los equipos
          console.log('🔍 [CreateManualKnockout] Primera ronda, obteniendo todos los equipos...');
          const equiposResponse = await api.equipos.list(idEdicionCategoria);

          if (equiposResponse.success && equiposResponse.data) {
            equipos = equiposResponse.data;
            console.log(`👥 [CreateManualKnockout] Equipos totales: ${equipos.length}`);
          }
        } else {
          // RONDA SUBSECUENTE - Obtener ganadores de la ronda anterior
          console.log('🔍 [CreateManualKnockout] Ronda subsecuente, obteniendo ganadores...');

          const rondasOrdenadas = rondas.sort((a, b) => (b.orden || 0) - (a.orden || 0));
          const ultimaRonda = rondasOrdenadas[0];

          console.log('📌 [CreateManualKnockout] Última ronda:', ultimaRonda.nombre);

          const ganadoresResponse = await api.rondas.getGanadores(ultimaRonda.id_ronda);

          if (ganadoresResponse.success && ganadoresResponse.data) {
            if (!ganadoresResponse.data.todos_finalizados) {
              throw new Error(
                `No todos los partidos de "${ultimaRonda.nombre}" han finalizado. ` +
                `Pendientes: ${ganadoresResponse.data.partidos_pendientes}`
              );
            }

            equipos = ganadoresResponse.data.ganadores || [];
            console.log(`👥 [CreateManualKnockout] Ganadores disponibles: ${equipos.length}`);
          }
        }

        return {
          rondas,
          equipos,
        };
      },
      'loadInitialData',
      {
        severity: 'high',
        fallbackValue: null,
        onError: (error) => {
          console.error('❌ [CreateManualKnockout] Error:', error);
          showError(error.message || 'No se pudo cargar los datos necesarios');
        },
      }
    );

    if (result) {
      setRondasExistentes(result.rondas);
      setEquiposDisponibles(result.equipos);
    }

    setLoading(false);
  };

  const toggleEquipo = (idEquipo: number) => {
    const newSet = new Set(equiposSeleccionados);
    if (newSet.has(idEquipo)) {
      newSet.delete(idEquipo);
    } else {
      newSet.add(idEquipo);
    }
    setEquiposSeleccionados(newSet);

    // Determinar ronda según cantidad seleccionada
    const cantidadSeleccionados = newSet.size;
    const ronda = determinarRondaSegunEquipos(cantidadSeleccionados);
    setRondaDeterminada(ronda);
  };

  const determinarRondaSegunEquipos = (cantidad: number): RondaEliminatoria | null => {
    // Debe ser potencia de 2
    if (cantidad === 64) return '16avos'; // 64 equipos -> 32 partidos
    if (cantidad === 32) return '16avos';
    if (cantidad === 16) return 'octavos';
    if (cantidad === 8) return 'cuartos';
    if (cantidad === 4) return 'semifinal';
    if (cantidad === 2) return 'final';
    return null; // No es potencia de 2 válida
  };

  const esPotenciaDeDos = (n: number): boolean => {
    return n > 0 && (n & (n - 1)) === 0 && [2, 4, 8, 16, 32, 64].includes(n);
  };

  const handleConfirmarCrearRonda = () => {
    const cantidadSeleccionados = equiposSeleccionados.size;

    if (cantidadSeleccionados === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos 2 equipos');
      return;
    }

    if (!esPotenciaDeDos(cantidadSeleccionados)) {
      Alert.alert(
        'Cantidad inválida',
        `Has seleccionado ${cantidadSeleccionados} equipos. Debes seleccionar una cantidad que sea potencia de 2: 2, 4, 8, 16, 32 o 64 equipos.`
      );
      return;
    }

    if (!rondaDeterminada) {
      Alert.alert('Error', 'No se pudo determinar la ronda');
      return;
    }

    Alert.alert(
      'Confirmar creación',
      `¿Estás seguro de crear la ronda "${RONDA_LABELS[rondaDeterminada]}" con ${cantidadSeleccionados} equipos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: crearRonda },
      ]
    );
  };

  const crearRonda = async () => {
    if (!rondaDeterminada) return;

    setCreating(true);

    const result = await safeAsync(
      async () => {
        const nombreRonda = `${RONDA_LABELS[rondaDeterminada]} - Copa ${copa.charAt(0).toUpperCase() + copa.slice(1)}`;

        const rondaData = {
          nombre: nombreRonda,
          tipo: 'eliminatorias' as const,
          subtipo_eliminatoria: copa as 'oro' | 'plata' | 'bronce',
          stage_eliminatoria: rondaDeterminada,
          id_fase: idFase,
          id_edicion_categoria: idEdicionCategoria,
          orden: getOrdenRonda(rondaDeterminada),
          metodo_asignacion: 'manual' as const,
        };

        console.log('📤 [CreateManualKnockout] Creando ronda:', rondaData);
        const createResponse = await api.rondas.create(rondaData);

        if (!createResponse.success || !createResponse.data) {
          throw new Error('No se pudo crear la ronda');
        }

        return createResponse.data;
      },
      'crearRonda',
      {
        severity: 'high',
        fallbackValue: null,
        onError: (error) => {
          console.error('❌ [CreateManualKnockout] Error al crear ronda:', error);
          showError(error.message || 'No se pudo crear la ronda');
        },
      }
    );

    setCreating(false);

    if (result) {
      showSuccess('Ronda creada exitosamente');

      // Obtener equipos seleccionados con sus datos completos
      const equiposParaPartidos = equiposDisponibles.filter(eq =>
        equiposSeleccionados.has(eq.id_equipo)
      );

      // Navegar a la pantalla de emparejamiento
      navigation.navigate('CreateManualMatches', {
        idEdicionCategoria,
        idFase,
        idRonda: result.id_ronda,
        copa,
        ronda: rondaDeterminada,
        equipos: equiposParaPartidos,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando equipos disponibles...</Text>
      </View>
    );
  }

  if (equiposDisponibles.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar Equipos</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No hay equipos disponibles</Text>
          <Text style={styles.emptyText}>
            No hay equipos para crear la ronda eliminatoria.
          </Text>
          <TouchableOpacity style={styles.backButtonFull} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cantidadSeleccionados = equiposSeleccionados.size;
  const esValido = esPotenciaDeDos(cantidadSeleccionados);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seleccionar Equipos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Copa Header */}
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.copaHeader}
        >
          <MaterialCommunityIcons name="trophy" size={32} color={colors.white} />
          <View style={styles.copaHeaderText}>
            <Text style={styles.copaTitle}>Copa {copa.charAt(0).toUpperCase() + copa.slice(1)}</Text>
            <Text style={styles.copaSubtitle}>
              {cantidadSeleccionados} equipos seleccionados
              {rondaDeterminada && ` - ${RONDA_LABELS[rondaDeterminada]}`}
            </Text>
          </View>
        </LinearGradient>

        {/* Información */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Selecciona los equipos que participarán en la ronda. La cantidad debe ser potencia de 2 (2, 4, 8, 16, 32, 64).
          </Text>
        </View>

        {/* Lista de equipos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipos Disponibles ({equiposDisponibles.length})</Text>
          <View style={styles.equiposList}>
            {equiposDisponibles.map((equipo) => {
              const isSelected = equiposSeleccionados.has(equipo.id_equipo);

              return (
                <TouchableOpacity
                  key={equipo.id_equipo}
                  style={[styles.equipoItem, isSelected && styles.equipoItemSelected]}
                  onPress={() => toggleEquipo(equipo.id_equipo)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={18} color={colors.white} />
                    )}
                  </View>
                  <Text style={[styles.equipoNombre, isSelected && styles.equipoNombreSelected]}>
                    {equipo.nombre}
                  </Text>
                  {equipo.grupo && (
                    <Text style={styles.equipoGrupo}>{equipo.grupo}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mensaje de validación */}
        {cantidadSeleccionados > 0 && !esValido && (
          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="alert-outline" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              Has seleccionado {cantidadSeleccionados} equipos. Debes seleccionar una potencia de 2: 2, 4, 8, 16, 32 o 64.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer con botón */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, (!esValido || cantidadSeleccionados === 0 || creating) && styles.createButtonDisabled]}
          onPress={handleConfirmarCrearRonda}
          disabled={!esValido || cantidadSeleccionados === 0 || creating}
        >
          <LinearGradient
            colors={(!esValido || cantidadSeleccionados === 0)
              ? [colors.border, colors.border]
              : gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButtonGradient}
          >
            {creating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.white} />
                <Text style={styles.createButtonText}>
                  Confirmar crear ronda ({cantidadSeleccionados} equipos)
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
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
  },
  copaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  copaHeaderText: {
    flex: 1,
  },
  copaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  copaSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  equiposList: {
    gap: 8,
  },
  equipoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  equipoItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  equipoNombre: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  equipoNombreSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  equipoGrupo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    marginBottom: 0,
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
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButtonFull: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
