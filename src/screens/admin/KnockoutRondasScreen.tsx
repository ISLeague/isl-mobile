import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { TipoCopa, Fase, Partido, Ronda } from '../../api/types';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync, getUserFriendlyMessage } from '../../utils/errorHandling';
import { formatDate } from '../../utils/formatters';
import api from '../../api';

interface KnockoutRondasScreenProps {
  navigation: any;
  route: {
    params: {
      fase: Fase;
      copa: TipoCopa;
      idEdicionCategoria: number;
    };
  };
}

const getSubtipoGradient = (copa: TipoCopa): [string, string, string] => {
  switch (copa) {
    case 'oro':
      return ['#FFD700', '#FFA500', '#FF8C00'];
    case 'plata':
      return ['#C0C0C0', '#A8A8A8', '#909090'];
    case 'bronce':
      return ['#CD7F32', '#B8733C', '#A86832'];
    default:
      return [colors.primary, colors.primary, colors.primary];
  }
};

const getCopaName = (copa: TipoCopa): string => {
  switch (copa) {
    case 'oro':
      return 'Copa Oro';
    case 'plata':
      return 'Copa Plata';
    case 'bronce':
      return 'Copa Bronce';
    default:
      return 'Copa';
  }
};

export const KnockoutRondasScreen: React.FC<KnockoutRondasScreenProps> = ({
  navigation,
  route,
}) => {
  const { fase, copa, idEdicionCategoria } = route.params;
  const { showError, showSuccess, showInfo } = useToast();

  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRondas, setExpandedRondas] = useState<{ [key: number]: boolean }>({});
  const [deletingRonda, setDeletingRonda] = useState<number | null>(null);

  const gradientColors = getSubtipoGradient(copa);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    console.log('🔄 [KnockoutRondas] Cargando datos para fase:', fase.id_fase);
    setLoading(true);

    const result = await safeAsync(
      async () => {
        // Cargar rondas de la fase
        const rondasResponse = await api.rondas.list({
          id_fase: fase.id_fase,
          tipo_ronda: 'eliminatorias',
        });

        let rondasData: Ronda[] = [];
        if (rondasResponse.success && rondasResponse.data) {
          const todasLasRondas = Array.isArray(rondasResponse.data)
            ? rondasResponse.data
            : rondasResponse.data.rondas || [];

          // Filtrar por copa (subtipo_eliminatoria)
          rondasData = todasLasRondas.filter(
            (r: Ronda) => r.subtipo_eliminatoria === copa
          );
          console.log(`📅 [KnockoutRondas] Rondas encontradas: ${rondasData.length}`);
        }

        // Cargar partidos de cada ronda
        console.log('⚽ [KnockoutRondas] Cargando partidos de cada ronda...');
        let partidosData: Partido[] = [];

        for (const ronda of rondasData) {
          console.log(`📋 [KnockoutRondas] Cargando partidos de ronda ${ronda.id_ronda}: ${ronda.nombre}`);
          const partidosResponse = await api.partidos.list({ id_ronda: ronda.id_ronda });

          if (partidosResponse.success && partidosResponse.data) {
            const partidosRonda = Array.isArray(partidosResponse.data)
              ? partidosResponse.data
              : [];
            console.log(`   ✓ ${partidosRonda.length} partidos encontrados`);
            partidosData.push(...partidosRonda);
          }
        }

        console.log(`⚽ [KnockoutRondas] Total partidos cargados: ${partidosData.length}`);

        return { rondas: rondasData, partidos: partidosData };
      },
      'loadKnockoutRondasData',
      {
        severity: 'high',
        fallbackValue: { rondas: [], partidos: [] },
        onError: (error) => {
          console.error('❌ [KnockoutRondas] Error:', error);
          showError(getUserFriendlyMessage(error), 'Error al cargar datos');
        },
      }
    );

    if (result) {
      setRondas(result.rondas.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
      setPartidos(result.partidos);
    }
    setLoading(false);
  };

  const toggleRonda = (idRonda: number) => {
    setExpandedRondas((prev) => ({
      ...prev,
      [idRonda]: !prev[idRonda],
    }));
  };

  const getPartidosByRonda = (idRonda: number): Partido[] => {
    return partidos.filter((p) => p.id_ronda === idRonda);
  };

  // ============================================
  // HANDLERS PARA CREAR RONDA
  // ============================================

  const handleCreateRondaManual = () => {
    console.log("Info de la fase:", fase);
    navigation.navigate('CreateManualKnockoutRound', {
      idEdicionCategoria,
      idFase: fase.id_fase,
      copa,
    });
  };

  const handleCreateRondaAutomatica = async () => {
    console.log('🤖 [KnockoutRondas] Generando fixture automático...');
    setLoading(true);

    const result = await safeAsync(
      async () => await api.rondas.generarKnockoutFixture(fase.id_fase),
      'generarKnockoutFixture',
      {
        fallbackValue: null,
        onError: (error) => {
          console.error('❌ [KnockoutRondas] Error al generar fixture:', error);
          showError(getUserFriendlyMessage(error), 'Error al generar fixture');
        },
      }
    );

    setLoading(false);

    if (result && result.success && result.data) {
      console.log('✅ [KnockoutRondas] Fixture generado:', result.data);

      // Navegar a pantalla de configuración con los encuentros sugeridos
      navigation.navigate('CreateAutomaticKnockoutRound', {
        idEdicionCategoria,
        idFase: fase.id_fase,
        copa,
        encuentros: result.data.emparejamientos_sugeridos || result.data.emparejamientos,
        rondaCreada: result.data.ronda_creada,
      });
    }
  };

  // ============================================
  // HANDLERS PARA ACCIONES DE RONDA
  // ============================================

  const handleEditRonda = (rondaObj: Ronda) => {
    navigation.navigate('EditRonda', {
      ronda: rondaObj,
      onRondaUpdated: loadData,
    });
  };

  const handleAddPartido = (rondaObj: Ronda) => {
    navigation.navigate('CreatePartido', {
      ronda: rondaObj,
      idEdicionCategoria,
      idFase: fase.id_fase,
      onPartidoCreated: loadData,
    });
  };

  const handleExportRonda = async (rondaObj: Ronda) => {
    try {
      const { Share } = await import('react-native');
      const rondaPartidos = getPartidosByRonda(rondaObj.id_ronda);
      const jsonString = JSON.stringify(rondaPartidos, null, 2);

      await Share.share({
        message: `Ronda: ${rondaObj.nombre}\n\n${jsonString}`,
        title: `Exportar ${rondaObj.nombre}`,
      });

      showInfo('Ronda exportada correctamente');
    } catch (error) {
      showError('Error al exportar la ronda');
    }
  };

  const handleDeleteRonda = (rondaObj: Ronda) => {
    Alert.alert(
      'Eliminar Ronda',
      `¿Estás seguro de eliminar la ronda "${rondaObj.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ [KnockoutRondas] Eliminando ronda:', rondaObj.id_ronda);
            setDeletingRonda(rondaObj.id_ronda);

            const result = await safeAsync(
              async () => await api.rondas.delete(rondaObj.id_ronda),
              'handleDeleteRonda',
              {
                fallbackValue: null,
                onError: (error) => {
                  console.error('❌ [KnockoutRondas] Error al eliminar:', error);
                  showError('Error al eliminar la ronda');
                },
              }
            );

            setDeletingRonda(null);

            if (result && result.success) {
              showSuccess('Ronda eliminada exitosamente');
            }

            // Siempre recargar datos después de intentar eliminar
            await loadData();
          },
        },
      ]
    );
  };

  // ============================================
  // HANDLERS PARA ACCIONES DE PARTIDO
  // ============================================

  const handleLoadResult = (partido: Partido) => {
    navigation.navigate('ResultPage', {
      partido,
      onResultLoaded: loadData,
    });
  };

  const handleEditPartido = (partido: Partido) => {
    navigation.navigate('EditPartido', {
      partido,
      onPartidoUpdated: loadData,
    });
  };

  const handleMatchLineup = (partido: Partido) => {
    navigation.navigate('MatchLineup', {
      partido,
      ronda: rondas.find((r) => r.id_ronda === partido.id_ronda),
    });
  };

  const handleMatchSubstitutions = (partido: Partido) => {
    navigation.navigate('MatchSubstitutions', {
      partido,
      ronda: rondas.find((r) => r.id_ronda === partido.id_ronda),
    });
  };

  // ============================================
  // RENDER PARTIDO
  // ============================================

  const renderPartido = (partido: Partido) => {
    if (!partido.equipo_local || !partido.equipo_visitante) {
      return null;
    }

    const hasResult =
      partido.marcador_local !== null &&
      partido.marcador_local !== undefined &&
      partido.marcador_visitante !== null &&
      partido.marcador_visitante !== undefined;

    const hayPenales =
      partido.fue_a_penales === true &&
      partido.penales_local !== null &&
      partido.penales_visitante !== null;

    let ganador: 'local' | 'visitante' | 'empate' | null = null;

    if (hasResult) {
      const golesLocal = partido.marcador_local!;
      const golesVisitante = partido.marcador_visitante!;

      if (hayPenales) {
        ganador =
          partido.penales_local! > partido.penales_visitante!
            ? 'local'
            : partido.penales_local! < partido.penales_visitante!
            ? 'visitante'
            : 'empate';
      } else {
        ganador =
          golesLocal > golesVisitante
            ? 'local'
            : golesLocal < golesVisitante
            ? 'visitante'
            : 'empate';
      }
    }

    return (
      <TouchableOpacity
        key={partido.id_partido}
        style={styles.partidoCard}
        onPress={() => handleEditPartido(partido)}
        activeOpacity={0.7}
      >
        <View style={styles.partidoHeader}>
          <View style={styles.partidoInfoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.fechaText}>
              {formatDate(partido.fecha || partido.fecha_hora || '')}
            </Text>
            {partido.hora && (
              <>
                <MaterialCommunityIcons
                  name="clock"
                  size={14}
                  color={colors.textSecondary}
                  style={{ marginLeft: 8 }}
                />
                <Text style={styles.fechaText}>{partido.hora}</Text>
              </>
            )}
          </View>
          {hasResult && (
            <View style={styles.estadoBadge}>
              <Text style={styles.estadoText}>Finalizado</Text>
            </View>
          )}
        </View>

        {partido.cancha && (
          <View style={styles.canchaContainer}>
            <MaterialCommunityIcons
              name="soccer-field"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.canchaText}>{partido.cancha.nombre}</Text>
          </View>
        )}

        <View style={styles.equiposContainer}>
          {/* Equipo Local */}
          <View style={styles.equipoRow}>
            <Image
              source={
                partido.equipo_local.logo
                  ? { uri: partido.equipo_local.logo }
                  : require('../../assets/InterLOGO.png')
              }
              style={styles.equipoLogo}
              resizeMode="cover"
            />
            <Text
              style={[
                styles.equipoNombre,
                ganador === 'local' && styles.equipoNombreGanador,
              ]}
              numberOfLines={1}
            >
              {partido.equipo_local.nombre}
            </Text>
            <View style={styles.scoreContainer}>
              {ganador === 'local' && <View style={styles.winnerIndicator} />}
              <Text
                style={[
                  styles.golesText,
                  ganador === 'local' && styles.golesTextGanador,
                  ganador === 'visitante' && styles.golesTextPerdedor,
                ]}
              >
                {partido.marcador_local ?? '-'}
              </Text>
              {hayPenales && (
                <Text style={styles.penalesTextSmall}>
                  {' '}
                  ({partido.penales_local})
                </Text>
              )}
            </View>
          </View>

          {/* Equipo Visitante */}
          <View style={styles.equipoRow}>
            <Image
              source={
                partido.equipo_visitante.logo
                  ? { uri: partido.equipo_visitante.logo }
                  : require('../../assets/InterLOGO.png')
              }
              style={styles.equipoLogo}
              resizeMode="cover"
            />
            <Text
              style={[
                styles.equipoNombre,
                ganador === 'visitante' && styles.equipoNombreGanador,
              ]}
              numberOfLines={1}
            >
              {partido.equipo_visitante.nombre}
            </Text>
            <View style={styles.scoreContainer}>
              {ganador === 'visitante' && <View style={styles.winnerIndicator} />}
              <Text
                style={[
                  styles.golesText,
                  ganador === 'visitante' && styles.golesTextGanador,
                  ganador === 'local' && styles.golesTextPerdedor,
                ]}
              >
                {partido.marcador_visitante ?? '-'}
              </Text>
              {hayPenales && (
                <Text style={styles.penalesTextSmall}>
                  {' '}
                  ({partido.penales_visitante})
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Botones de acciones */}
        <View style={styles.adminActionsRow}>
          <TouchableOpacity
            style={styles.adminActionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleMatchLineup(partido);
            }}
          >
            <MaterialCommunityIcons
              name="clipboard-check"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.adminActionText}>Lista</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminActionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleMatchSubstitutions(partido);
            }}
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.adminActionText}>Cambios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminActionButton, styles.adminActionButtonPrimary]}
            onPress={(e) => {
              e.stopPropagation();
              handleLoadResult(partido);
            }}
          >
            <MaterialCommunityIcons
              name="scoreboard"
              size={14}
              color={colors.white}
            />
            <Text style={[styles.adminActionText, styles.adminActionTextPrimary]}>
              Resultado
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================
  // RENDER RONDA
  // ============================================

  const renderRonda = (rondaObj: Ronda) => {
    const isExpanded = expandedRondas[rondaObj.id_ronda];
    const partidosRonda = getPartidosByRonda(rondaObj.id_ronda);

    return (
      <View key={rondaObj.id_ronda} style={styles.rondaContainer}>
        <TouchableOpacity
          style={styles.rondaHeader}
          onPress={() => toggleRonda(rondaObj.id_ronda)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rondaHeaderGradient}
          >
            <View style={styles.rondaInfo}>
              <Text style={styles.rondaNombre}>{rondaObj.nombre}</Text>
              {rondaObj.stage_eliminatoria && (
                <Text style={styles.rondaStage}>{rondaObj.stage_eliminatoria}</Text>
              )}
            </View>
            <View style={styles.rondaStatsActions}>
              <View style={styles.rondaStats}>
                <Text style={styles.partidosCount}>{partidosRonda.length}</Text>
                <Text style={styles.partidosLabel}>partidos</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButtonGradient}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteRonda(rondaObj);
                }}
                activeOpacity={0.7}
                disabled={deletingRonda === rondaObj.id_ronda}
              >
                {deletingRonda === rondaObj.id_ronda ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <MaterialCommunityIcons name="delete" size={20} color={colors.white} />
                )}
              </TouchableOpacity>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.white}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {isExpanded && (
          <>
            {/* Botones de acciones de ronda */}
            <View style={styles.rondaActions}>
              <TouchableOpacity
                style={styles.rondaActionButton}
                onPress={() => handleEditRonda(rondaObj)}
              >
                <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
                <Text style={styles.rondaActionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rondaActionButton}
                onPress={() => handleAddPartido(rondaObj)}
              >
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={18}
                  color={colors.success}
                />
                <Text style={styles.rondaActionText}>Agregar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rondaActionButton}
                onPress={() => handleExportRonda(rondaObj)}
              >
                <MaterialCommunityIcons name="export" size={18} color={colors.info} />
                <Text style={styles.rondaActionText}>Exportar</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de partidos */}
            <View style={styles.partidosList}>
              {partidosRonda.length === 0 ? (
                <View style={styles.emptyPartidos}>
                  <MaterialCommunityIcons
                    name="soccer"
                    size={48}
                    color={colors.textLight}
                  />
                  <Text style={styles.emptyText}>No hay partidos en esta ronda</Text>
                </View>
              ) : (
                partidosRonda.map((partido) => renderPartido(partido))
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando rondas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con nombre de copa */}
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{getCopaName(copa)}</Text>
          <Text style={styles.headerSubtitle}>
            {rondas.length} {rondas.length === 1 ? 'ronda' : 'rondas'} creadas
          </Text>
        </View>
        <MaterialCommunityIcons name="trophy" size={32} color={colors.white} />
      </LinearGradient>

      {/* Modal de eliminación */}
      <Modal
        visible={deletingRonda !== null}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.deletingOverlay}>
          <View style={styles.deletingCard}>
            <View style={styles.deletingIconContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.deletingText}>Eliminando ronda...</Text>
            <Text style={styles.deletingSubtext}>Por favor espera un momento</Text>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Botones para crear ronda */}
        <View style={styles.createButtonsContainer}>
          <Text style={styles.createButtonsTitle}>Crear nueva ronda</Text>
          <View style={styles.createButtonsRow}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateRondaManual}
              activeOpacity={0.8}
            >
              <View style={[styles.createButtonIcon, { backgroundColor: colors.info }]}>
                <MaterialCommunityIcons name="pencil-plus" size={24} color={colors.white} />
              </View>
              <Text style={styles.createButtonText}>Ronda Manual</Text>
              <Text style={styles.createButtonDescription}>
                Configura manualmente los partidos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateRondaAutomatica}
              activeOpacity={0.8}
            >
              <View style={[styles.createButtonIcon, { backgroundColor: colors.success }]}>
                <MaterialCommunityIcons name="auto-fix" size={24} color={colors.white} />
              </View>
              <Text style={styles.createButtonText}>Ronda Automática</Text>
              <Text style={styles.createButtonDescription}>
                Genera cruces automáticamente
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de rondas */}
        {rondas.length === 0 ? (
          <View style={styles.emptyRondasContainer}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={64}
              color={colors.textLight}
            />
            <Text style={styles.emptyRondasText}>No hay rondas creadas aún</Text>
            <Text style={styles.emptyRondasHint}>
              Usa los botones de arriba para crear tu primera ronda
            </Text>
          </View>
        ) : (
          <View style={styles.rondasList}>
            <Text style={styles.rondasListTitle}>Rondas existentes</Text>
            {rondas.map((ronda) => renderRonda(ronda))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
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
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  createButtonsContainer: {
    marginBottom: 24,
  },
  createButtonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  createButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  createButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  createButtonDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rondasList: {
    gap: 12,
  },
  rondasListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  rondaContainer: {
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  rondaHeader: {
    overflow: 'hidden',
  },
  rondaHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  rondaInfo: {
    flex: 1,
  },
  rondaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  rondaStage: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  rondaStatsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rondaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partidosCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  partidosLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.9,
  },
  deleteButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rondaActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: colors.backgroundGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rondaActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  rondaActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  partidosList: {
    backgroundColor: colors.white,
  },
  emptyPartidos: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  partidoCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partidoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fechaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  canchaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  canchaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  equiposContainer: {
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
    borderRadius: 16,
  },
  equipoNombre: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  equipoNombreGanador: {
    fontWeight: 'bold',
    color: colors.success,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  winnerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  golesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  golesTextGanador: {
    color: colors.success,
    fontWeight: 'bold',
  },
  golesTextPerdedor: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  penalesTextSmall: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  adminActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adminActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    gap: 4,
  },
  adminActionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  adminActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  adminActionTextPrimary: {
    color: colors.white,
  },
  emptyRondasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyRondasText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRondasHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  deletingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletingCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
    maxWidth: '80%',
  },
  deletingIconContainer: {
    marginBottom: 20,
  },
  deletingText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  deletingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default KnockoutRondasScreen;
