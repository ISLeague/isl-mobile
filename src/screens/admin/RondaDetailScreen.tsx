import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Input, Button } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { safeAsync } from '../../utils/errorHandling';
import { RondaConPartidos, FixtureSinPartido } from '../../api/types/rondas.types';
import { Cancha } from '../../api/types';
import api from '../../api';

interface RondaDetailScreenProps {
  navigation: any;
  route: any;
}

export const RondaDetailScreen: React.FC<RondaDetailScreenProps> = ({ navigation, route }) => {
  const { ronda, idFase, idEdicionCategoria }: { ronda: RondaConPartidos; idFase: number; idEdicionCategoria: number } = route.params || {};
  const { showSuccess, showError, showInfo } = useToast();
  const { isAdmin } = useAuth();

  const [fixturesSinPartido, setFixturesSinPartido] = useState<FixtureSinPartido[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingPartidos, setCreatingPartidos] = useState(false);

  // State for fixture details
  const [fixtureDetails, setFixtureDetails] = useState<{
    [fixtureId: number]: {
      fecha: string;
      hora: string;
      id_cancha: number | null;
    };
  }>({});

  useEffect(() => {
    loadData();
  }, [ronda.id_ronda]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadFixturesSinPartido(),
      loadPartidos(),
      loadCanchas(),
    ]);
    setLoading(false);
  };

  const loadFixturesSinPartido = async () => {
    if (!isAdmin) return;

    const result = await safeAsync(
      async () => {
        const response = await api.rondas.fixturesSinPartido(ronda.id_ronda);
        if (response.success && response.data) {
          // Flatten fixtures from all jornadas
          const allFixtures: FixtureSinPartido[] = [];
          response.data.jornadas.forEach((jornada) => {
            allFixtures.push(...jornada.fixtures);
          });
          return allFixtures;
        }
        return [];
      },
      'RondaDetail - loadFixturesSinPartido',
      {
        fallbackValue: [],
        onError: () => showError('Error al cargar fixtures sin partido'),
      }
    );

    setFixturesSinPartido(result || []);

    // Initialize fixture details
    const initialDetails: typeof fixtureDetails = {};
    (result || []).forEach((fixture) => {
      initialDetails[fixture.id_fixture] = {
        fecha: '',
        hora: '',
        id_cancha: null,
      };
    });
    setFixtureDetails(initialDetails);
  };

  const loadPartidos = async () => {
    const result = await safeAsync(
      async () => {
        const response = await api.partidos.list(ronda.id_ronda);
        return response.success && response.data ? response.data : [];
      },
      'RondaDetail - loadPartidos',
      {
        fallbackValue: [],
        onError: () => showError('Error al cargar partidos'),
      }
    );

    setPartidos(result || []);
  };

  const loadCanchas = async () => {
    if (!isAdmin) return;

    const result = await safeAsync(
      async () => {
        // Get locales for this edicion
        const localesResponse = await api.locales.list(idEdicionCategoria);
        if (!localesResponse.success || !localesResponse.data?.locales) {
          return [];
        }

        // Get all canchas for each local
        const allCanchas: Cancha[] = [];
        for (const local of localesResponse.data.locales) {
          const canchasResponse = await api.canchas.list(local.id_local);
          if (canchasResponse.success && canchasResponse.data?.canchas) {
            allCanchas.push(...canchasResponse.data.canchas);
          }
        }

        return allCanchas;
      },
      'RondaDetail - loadCanchas',
      {
        fallbackValue: [],
        onError: () => showError('Error al cargar canchas'),
      }
    );

    setCanchas(result || []);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreatePartidos = async () => {

    // Validate all fixtures have required data (fecha y hora obligatorios, cancha opcional)
    const missingData = fixturesSinPartido.some((fixture) => {
      const details = fixtureDetails[fixture.id_fixture];
      return !details || !details.fecha || !details.hora;
    });

    if (missingData) {
      Alert.alert('Error', 'Por favor asigna fecha y hora a todos los partidos. La cancha es opcional.');
      return;
    }

    setCreatingPartidos(true);

    let createdCount = 0;
    let errorCount = 0;

    // Create partidos one by one
    for (const fixture of fixturesSinPartido) {
      const details = fixtureDetails[fixture.id_fixture];

      const tipoPartido: 'clasificacion' | 'eliminatoria' | 'amistoso' =
        ronda.tipo === 'amistosa' ? 'amistoso' : ronda.tipo === 'eliminatorias' ? 'eliminatoria' : 'clasificacion';

      const partidoData = {
        id_fixture: fixture.id_fixture,
        id_equipo_local: fixture.id_equipo_local,
        id_equipo_visitante: fixture.id_equipo_visitante,
        id_ronda: ronda.id_ronda,
        id_fase: idFase,
        id_cancha: details.id_cancha || null, // Cancha es opcional
        fecha: details.fecha,
        hora: details.hora,
        tipo_partido: tipoPartido,
        afecta_clasificacion: ronda.tipo !== 'amistosa',
        observaciones: fixture.nombre_grupo
          ? `Partido de ${ronda.tipo === 'amistosa' ? 'amistoso' : 'clasificación'} - Grupo ${fixture.nombre_grupo}`
          : `Partido de ${ronda.tipo === 'amistosa' ? 'amistoso' : ronda.tipo}`,
      };


      const result = await safeAsync(
        async () => {
          const response = await api.partidos.createFromFixture(partidoData);
          return response;
        },
        'RondaDetail - createPartido',
        {
          fallbackValue: null,
          onError: (error) => {
            // console.error('❌ [RondaDetail] Error al crear partido:', error);
            errorCount++;
          },
        }
      );

      if (result && result.success) {
        createdCount++;
      }
    }

    setCreatingPartidos(false);

    if (errorCount > 0) {
      showError(`Se crearon ${createdCount} partidos con ${errorCount} errores`);
    } else {
      showSuccess(`${createdCount} partidos creados exitosamente`);
      // Reload data
      await loadData();
    }
  };

  const handleGoToCreateFixtures = () => {
    navigation.navigate('CreateRondaFlow', {
      idEdicionCategoria,
      existingRondaId: ronda.id_ronda,
      skipToStep2: true,
    });
  };

  const [deletingPartidoId, setDeletingPartidoId] = useState<number | null>(null);

  const handleDeletePartido = (partido: any) => {
    const isFinalizado = partido.estado_partido === 'Finalizado';
    
    Alert.alert(
      'Eliminar Partido',
      isFinalizado 
        ? 'Este partido está finalizado. ¿Estás seguro de que quieres eliminarlo? Se perderán todas las estadísticas y resultados.'
        : `¿Estás seguro de que quieres eliminar el partido ${partido.equipo_local?.nombre || 'Local'} vs ${partido.equipo_visitante?.nombre || 'Visitante'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingPartidoId(partido.id_partido);
              
              // Show loading message
              showInfo('Eliminando partido...');
              
              // Si está finalizado, primero resetear resultado
              if (isFinalizado) {
                const resetResult = await api.partidos.resetResultado(partido.id_partido);
                if (!resetResult.success) {
                  showError('Error al resetear el resultado');
                  return;
                }
              }
              
              const response = await api.partidos.delete(partido.id_partido);
              if (response.success) {
                showSuccess('Partido eliminado exitosamente');
                // Reload partidos
                await loadPartidos();
              } else {
                showError(response.error || 'Error al eliminar el partido');
              }
            } catch (error: any) {
              showError(error.message || 'Error al eliminar el partido');
            } finally {
              setDeletingPartidoId(null);
            }
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="calendar-blank" size={80} color={colors.textLight} />
      <Text style={styles.emptyTitle}>No hay partidos programados</Text>
      <Text style={styles.emptySubtitle}>
        Esta jornada aún no tiene fixtures ni partidos creados
      </Text>
      {isAdmin && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleGoToCreateFixtures}
        >
          <MaterialCommunityIcons name="plus-circle" size={20} color={colors.white} />
          <Text style={styles.emptyButtonText}>Generar Fixtures y Crear Partidos</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFixtureSinPartido = (fixture: FixtureSinPartido, index: number) => {
    const details = fixtureDetails[fixture.id_fixture] || { fecha: '', hora: '', id_cancha: null };

    return (
      <View key={fixture.id_fixture} style={styles.fixtureCard}>
        {/* Header */}
        <View style={styles.fixtureHeader}>
          <View style={styles.fixtureHeaderLeft}>
            <MaterialCommunityIcons name="soccer" size={20} color={colors.primary} />
            <Text style={styles.fixtureTitle}>Partido {index + 1}</Text>
          </View>
          {fixture.nombre_grupo && (
            <View style={styles.groupBadge}>
              <Text style={styles.groupBadgeText}>Grupo {fixture.nombre_grupo}</Text>
            </View>
          )}
        </View>

        {/* Teams */}
        <View style={styles.fixtureTeams}>
          <Text style={styles.teamName}>{fixture.local}</Text>
          <Text style={styles.vsText}>VS</Text>
          <Text style={styles.teamName}>{fixture.visitante}</Text>
        </View>

        {/* Inputs */}
        <View style={styles.fixtureInputs}>
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Fecha *</Text>
              <Input
                placeholder="YYYY-MM-DD"
                value={details.fecha}
                onChangeText={(text) => {
                  setFixtureDetails({
                    ...fixtureDetails,
                    [fixture.id_fixture]: {
                      ...details,
                      fecha: text,
                    },
                  });
                }}
                leftIcon={<MaterialCommunityIcons name="calendar" size={18} color={colors.textLight} />}
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Hora *</Text>
              <Input
                placeholder="HH:MM"
                value={details.hora}
                onChangeText={(text) => {
                  setFixtureDetails({
                    ...fixtureDetails,
                    [fixture.id_fixture]: {
                      ...details,
                      hora: text,
                    },
                  });
                }}
                leftIcon={<MaterialCommunityIcons name="clock-outline" size={18} color={colors.textLight} />}
              />
            </View>
          </View>

          {/* Cancha Selector */}
          <View style={styles.canchaSelector}>
            <Text style={styles.inputLabel}>Cancha (opcional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.canchaScrollView}
            >
              {/* Opción para "Sin cancha asignada" */}
              <TouchableOpacity
                style={[
                  styles.canchaChip,
                  !details.id_cancha && styles.canchaChipSelected,
                ]}
                onPress={() => {
                  setFixtureDetails({
                    ...fixtureDetails,
                    [fixture.id_fixture]: {
                      ...details,
                      id_cancha: null,
                    },
                  });
                }}
              >
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={16}
                  color={!details.id_cancha ? colors.white : colors.textLight}
                />
                <Text
                  style={[
                    styles.canchaChipText,
                    !details.id_cancha && styles.canchaChipTextSelected,
                  ]}
                >
                  Por definir
                </Text>
              </TouchableOpacity>
              {canchas.map((cancha) => (
                <TouchableOpacity
                  key={cancha.id_cancha}
                  style={[
                    styles.canchaChip,
                    details.id_cancha === cancha.id_cancha && styles.canchaChipSelected,
                  ]}
                  onPress={() => {
                    setFixtureDetails({
                      ...fixtureDetails,
                      [fixture.id_fixture]: {
                        ...details,
                        id_cancha: cancha.id_cancha,
                      },
                    });
                  }}
                >
                  <MaterialCommunityIcons
                    name="soccer-field"
                    size={16}
                    color={details.id_cancha === cancha.id_cancha ? colors.white : colors.primary}
                  />
                  <Text
                    style={[
                      styles.canchaChipText,
                      details.id_cancha === cancha.id_cancha && styles.canchaChipTextSelected,
                    ]}
                  >
                    {cancha.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Status indicator - solo requiere fecha y hora */}
          {details.fecha && details.hora && (
            <View style={styles.completeIndicator}>
              <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
              <Text style={styles.completeText}>
                {details.id_cancha ? 'Completo' : 'Listo (sin cancha)'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPartido = (partido: any) => {
    const marcadorLocal = partido.marcador_local ?? 0;
    const marcadorVisitante = partido.marcador_visitante ?? 0;
    const isPendiente = partido.estado_partido === 'Pendiente' || partido.estado_partido === 'pendiente';

    const equipoLocal = partido.equipo_local || partido.id_equipo_local;
    const equipoVisitante = partido.equipo_visitante || partido.id_equipo_visitante;

    return (
      <View key={partido.id_partido} style={styles.partidoCardContainer}>
        <TouchableOpacity
          style={styles.partidoCard}
          onPress={() => navigation.navigate('PartidoDetail', { partido })}
          activeOpacity={0.7}
        >
          {/* Teams and Score */}
          <View style={styles.partidoTeams}>
            <View style={styles.partidoTeam}>
              <Text style={styles.partidoTeamName}>{partido.equipo_local?.nombre || 'Equipo Local'}</Text>
              <View style={[styles.scoreBox, !isPendiente && styles.scoreBoxActive]}>
                <Text style={[styles.scoreText, !isPendiente && styles.scoreTextActive]}>
                  {isPendiente ? '-' : marcadorLocal}
                </Text>
              </View>
            </View>

            <View style={styles.partidoVs}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.partidoTeam}>
              <View style={[styles.scoreBox, !isPendiente && styles.scoreBoxActive]}>
                <Text style={[styles.scoreText, !isPendiente && styles.scoreTextActive]}>
                  {isPendiente ? '-' : marcadorVisitante}
                </Text>
              </View>
              <Text style={styles.partidoTeamName}>{partido.equipo_visitante?.nombre || 'Equipo Visitante'}</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.partidoInfo}>
            <View style={styles.partidoInfoItem}>
              <MaterialCommunityIcons name="calendar" size={14} color={partido.fecha ? colors.textSecondary : colors.warning} />
              <Text style={[styles.partidoInfoText, !partido.fecha && styles.pendienteText]}>
                {partido.fecha || 'Fecha Pendiente'}
              </Text>
            </View>

            <View style={styles.partidoInfoItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={partido.hora ? colors.textSecondary : colors.warning} />
              <Text style={[styles.partidoInfoText, !partido.hora && styles.pendienteText]}>
                {partido.hora || 'Hora Pendiente'}
              </Text>
            </View>

            <View style={styles.partidoInfoItem}>
              <MaterialCommunityIcons name="soccer-field" size={14} color={partido.cancha ? colors.textSecondary : colors.warning} />
              <Text style={[styles.partidoInfoText, !partido.cancha && styles.pendienteText]}>
                {partido.cancha?.nombre || 'Campo Pendiente'}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.partidoStatus}>
            <View style={[
              styles.statusBadge,
              isPendiente ? styles.statusBadgePending : styles.statusBadgeCompleted
            ]}>
              <Text style={[
                styles.statusBadgeText,
                isPendiente ? styles.statusBadgeTextPending : styles.statusBadgeTextCompleted
              ]}>
                {partido.estado_partido}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Admin Actions */}
        {isAdmin && (
          <View style={styles.partidoActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('PreMatchValidation', {
                partido,
                ronda,
                equipoLocal,
                equipoVisitante,
              })}
            >
              <MaterialCommunityIcons name="clipboard-check" size={16} color={colors.primary} />
              <Text style={styles.actionButtonText}>Lista</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MatchSubstitutions', {
                partido,
                ronda,
                equipoLocal,
                equipoVisitante,
              })}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primary} />
              <Text style={styles.actionButtonText}>Cambios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => navigation.navigate('ResultPage', {
                partido,
                ronda,
              })}
            >
              <MaterialCommunityIcons name="scoreboard" size={16} color={colors.white} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>Resultado</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => handleDeletePartido(partido)}
              disabled={deletingPartidoId === partido.id_partido}
            >
              {deletingPartidoId === partido.id_partido ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <MaterialCommunityIcons name="delete" size={16} color={colors.error} />
              )}
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                {deletingPartidoId === partido.id_partido ? 'Borrando...' : 'Eliminar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={styles.title}>{ronda.nombre}</Text>
          <Text style={styles.subtitle}>
            {ronda.partidos_count} {ronda.partidos_count === 1 ? 'partido' : 'partidos'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : partidos.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {/* Partidos Section */}
          {partidos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="soccer" size={24} color={colors.primary} />
                <Text style={styles.sectionTitle}>
                  Partidos ({partidos.length})
                </Text>
              </View>

              {partidos.map((partido) => renderPartido(partido))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  headerTitle: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  fixtureCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fixtureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fixtureHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixtureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  groupBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.white,
  },
  fixtureTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textLight,
    paddingHorizontal: 8,
  },
  fixtureInputs: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  canchaSelector: {
    marginTop: 4,
  },
  canchaScrollView: {
    marginTop: 8,
  },
  canchaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    marginRight: 8,
  },
  canchaChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  canchaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  canchaChipTextSelected: {
    color: colors.white,
  },
  completeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  completeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  createButton: {
    marginTop: 16,
  },
  partidoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partidoTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partidoTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partidoTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  partidoVs: {
    paddingHorizontal: 12,
  },
  scoreBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBoxActive: {
    backgroundColor: colors.primary,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  scoreTextActive: {
    color: colors.white,
  },
  partidoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 12,
  },
  partidoInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partidoInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pendienteText: {
    color: colors.warning,
    fontStyle: 'italic',
  },
  partidoStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: '#FFF3CD',
  },
  statusBadgeCompleted: {
    backgroundColor: '#D1F2EB',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeTextPending: {
    color: '#856404',
  },
  statusBadgeTextCompleted: {
    color: '#0F5132',
  },
  partidoCardContainer: {
    marginBottom: 12,
  },
  partidoActions: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -12,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonDanger: {
    backgroundColor: colors.white,
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionButtonTextPrimary: {
    color: colors.white,
  },
  actionButtonTextDanger: {
    color: colors.error,
  },
});
