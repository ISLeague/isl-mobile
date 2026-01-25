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

const RONDA_CAPACITIES: Record<RondaEliminatoria, number> = {
  'eliminatoria': 64,
  '16avos': 32,
  'octavos': 16,
  'cuartos': 8,
  'semifinal': 4,
  'final': 2,
};

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
  }
};

export const CreateManualKnockoutRoundScreen: React.FC<CreateManualKnockoutRoundScreenProps> = ({
  navigation,
  route,
}) => {
  const { idEdicionCategoria, idFase, copa } = route.params;
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [equiposDisponibles, setEquiposDisponibles] = useState<any[]>([]);
  const [rondaSugerida, setRondaSugerida] = useState<RondaEliminatoria | null>(null);
  const [rondasExistentes, setRondasExistentes] = useState<any[]>([]);

  const gradientColors = getCopaGradient(copa);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    console.log('🔄 [CreateManualKnockout] Cargando datos iniciales...');
    setLoading(true);

    const result = await safeAsync(
      async () => {
        // 1. Obtener rondas existentes para esta fase
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

        // 2. Determinar qué ronda sugerir
        let rondaASugerir: RondaEliminatoria | null = null;
        let equipos: any[] = [];

        if (rondas.length === 0) {
          // No hay rondas, buscar equipos clasificados desde grupos
          console.log('🔍 [CreateManualKnockout] No hay rondas, buscando equipos clasificados...');

          // Obtener equipos clasificados de la fase de grupos
          const clasificadosResponse = await api.fases.obtenerClasificados(idFase, copa);

          if (clasificadosResponse.success && clasificadosResponse.data) {
            equipos = clasificadosResponse.data.equipos_clasificados || [];
            console.log(`👥 [CreateManualKnockout] Equipos clasificados: ${equipos.length}`);
          }

          // Determinar ronda según cantidad de equipos
          rondaASugerir = determinarRondaSegunEquipos(equipos.length);
        } else {
          // Ya hay rondas, sugerir la siguiente
          const ultimaRonda = rondas.sort((a, b) => (b.orden || 0) - (a.orden || 0))[0];
          const siguienteRonda = obtenerSiguienteRonda(ultimaRonda.stage_eliminatoria);

          if (siguienteRonda) {
            rondaASugerir = siguienteRonda;

            // Obtener equipos disponibles para esta ronda
            const equiposResponse = await api.eliminatorias.getEquiposDisponibles(
              idEdicionCategoria,
              copa,
              rondaASugerir
            );

            if (equiposResponse.success && equiposResponse.data) {
              equipos = equiposResponse.data.equipos || [];
            }
          }
        }

        return {
          rondas,
          rondaSugerida: rondaASugerir,
          equipos,
        };
      },
      'loadInitialData',
      {
        severity: 'high',
        fallbackValue: null,
        onError: (error) => {
          console.error('❌ [CreateManualKnockout] Error:', error);
          showError('No se pudo cargar los datos necesarios');
        },
      }
    );

    if (result) {
      setRondasExistentes(result.rondas);
      setRondaSugerida(result.rondaSugerida);
      setEquiposDisponibles(result.equipos);
    }

    setLoading(false);
  };

  const determinarRondaSegunEquipos = (cantidadEquipos: number): RondaEliminatoria => {
    if (cantidadEquipos >= 32) return '16avos';
    if (cantidadEquipos >= 16) return 'octavos';
    if (cantidadEquipos >= 8) return 'cuartos';
    if (cantidadEquipos >= 4) return 'semifinal';
    return 'final';
  };

  const obtenerSiguienteRonda = (rondaActual: RondaEliminatoria): RondaEliminatoria | null => {
    const orden: RondaEliminatoria[] = ['eliminatoria', '16avos', 'octavos', 'cuartos', 'semifinal', 'final'];
    const index = orden.indexOf(rondaActual);
    if (index >= 0 && index < orden.length - 1) {
      return orden[index + 1];
    }
    return null;
  };

  const handleCreateRonda = () => {
    if (!rondaSugerida) {
      Alert.alert('Error', 'No se pudo determinar qué ronda crear');
      return;
    }

    navigation.navigate('CreateManualMatches', {
      idEdicionCategoria,
      idFase,
      copa,
      ronda: rondaSugerida,
      equiposDisponibles,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analizando equipos disponibles...</Text>
      </View>
    );
  }

  if (!rondaSugerida) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Ronda Manual</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No se puede crear ronda</Text>
          <Text style={styles.emptyText}>
            No hay equipos disponibles o ya se completó el torneo.
          </Text>
          <TouchableOpacity style={styles.backButtonFull} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cantidadPartidos = equiposDisponibles.length / 2;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Ronda Manual</Text>
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
          <Text style={styles.copaTitle}>Copa {copa.charAt(0).toUpperCase() + copa.slice(1)}</Text>
        </LinearGradient>

        {/* Ronda sugerida */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Ronda a Crear</Text>
          </View>
          <View style={styles.rondaCard}>
            <Text style={styles.rondaNombre}>{RONDA_LABELS[rondaSugerida]}</Text>
            <View style={styles.rondaStats}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
                <Text style={styles.statValue}>{equiposDisponibles.length}</Text>
                <Text style={styles.statLabel}>Equipos</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="soccer" size={20} color={colors.primary} />
                <Text style={styles.statValue}>{cantidadPartidos}</Text>
                <Text style={styles.statLabel}>Partidos</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Equipos disponibles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-multiple" size={24} color={colors.success} />
            <Text style={styles.sectionTitle}>Equipos Disponibles</Text>
          </View>
          <View style={styles.equiposList}>
            {equiposDisponibles.map((equipo, index) => (
              <View key={equipo.id_equipo || index} style={styles.equipoItem}>
                <View style={styles.equipoNumber}>
                  <Text style={styles.equipoNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.equipoNombre}>{equipo.nombre}</Text>
                {equipo.origen && (
                  <Text style={styles.equipoOrigen}>{equipo.origen}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Información */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            En el siguiente paso podrás crear los {cantidadPartidos} partidos de esta ronda,
            seleccionando los enfrentamientos, cancha, fecha y hora para cada uno.
          </Text>
        </View>
      </ScrollView>

      {/* Footer con botón */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateRonda}>
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButtonGradient}
          >
            <MaterialCommunityIcons name="arrow-right-circle" size={24} color={colors.white} />
            <Text style={styles.createButtonText}>Continuar a Crear Partidos</Text>
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
  copaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rondaCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rondaNombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  rondaStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  equiposList: {
    gap: 8,
  },
  equipoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  equipoNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipoNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  equipoNombre: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  equipoOrigen: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
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
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
