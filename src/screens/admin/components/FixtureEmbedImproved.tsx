import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../../../theme/colors';
import { useToast } from '../../../contexts/ToastContext';
import { Ronda, Partido, Equipo } from '../../../types';
import { mockRondas, mockPartidos, mockEquipos, mockCanchas, mockLocales } from '../../../data/mockData';
import { SearchBar, FAB } from '../../../components/common';
import { useSearch } from '../../../hooks';
import { formatDate } from '../../../utils/formatters';
import { safeAsync, getUserFriendlyMessage } from '../../../utils/errorHandling';

interface FixtureEmbedImprovedProps {
  navigation: any;
  isAdmin?: boolean;
  idEdicionCategoria?: number;
}

export const FixtureEmbedImproved: React.FC<FixtureEmbedImprovedProps> = ({ 
  navigation, 
  isAdmin = false, 
  idEdicionCategoria 
}) => {
  const { showError, showInfo } = useToast();
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [expandedRondas, setExpandedRondas] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);

  const {
    searchQuery,
    setSearchQuery,
    filteredData: filteredEquipos,
    clearSearch,
  } = useSearch(mockEquipos, 'nombre');

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        // Filtrar solo rondas de fase_grupos y amistosa (sin eliminatorias)
        const sortedRondas: Ronda[] = [...mockRondas]
          .filter((r: Ronda) => r.tipo === 'fase_grupos' || r.tipo === 'amistosa')
          .sort((a, b) => b.orden - a.orden); // Rondas en orden descendente
        
        const today = new Date();
        let closestRondaId: number | null = null;
        let minDiff = Infinity;
        
        sortedRondas.forEach((ronda: Ronda) => {
          const rondaDate = new Date(ronda.fecha_inicio);
          const diff = Math.abs(rondaDate.getTime() - today.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestRondaId = ronda.id_ronda;
          }
        });
        
        return { sortedRondas, closestRondaId, partidos: mockPartidos };
      },
      'loadFixtureData',
      {
        severity: 'high',
        fallbackValue: { sortedRondas: [], closestRondaId: null, partidos: [] },
        onError: (error) => {
          showError(getUserFriendlyMessage(error), 'Error al cargar fixture');
        }
      }
    );
    
    if (result) {
      setRondas(result.sortedRondas);
      setPartidos(result.partidos);
      
      if (result.closestRondaId !== null) {
        setExpandedRondas({ [result.closestRondaId]: true });
      }
    }
    setLoading(false);
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleRonda = useCallback((rondaId: number) => {
    setExpandedRondas(prev => ({
      ...prev,
      [rondaId]: !prev[rondaId],
    }));
  }, []);

  const getPartidosByRonda = useCallback((rondaId: number): (Partido & { equipo_local: Equipo, equipo_visitante: Equipo })[] => {
    return partidos
      .filter(p => {
        if (p.id_ronda !== rondaId) return false;
        
        if (!searchQuery) return true;
        
        const equipoLocal = mockEquipos.find(e => e.id_equipo === p.id_equipo_local);
        const equipoVisitante = mockEquipos.find(e => e.id_equipo === p.id_equipo_visitante);
        
        return filteredEquipos.some(fe => 
          fe.id_equipo === equipoLocal?.id_equipo || 
          fe.id_equipo === equipoVisitante?.id_equipo
        );
      })
      .map(p => ({
        ...p,
        equipo_local: mockEquipos.find(e => e.id_equipo === p.id_equipo_local)!,
        equipo_visitante: mockEquipos.find(e => e.id_equipo === p.id_equipo_visitante)!,
        cancha: mockCanchas.find(c => c.id_cancha === p.id_cancha),
      }))
      .sort((a, b) => {
        const dateA = new Date(`${a.fecha} ${a.hora || '00:00'}`);
        const dateB = new Date(`${b.fecha} ${b.hora || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
      });
  }, [partidos, searchQuery, filteredEquipos]);

  const handleEditPartido = (partido: Partido) => {
    navigation.navigate('EditPartido', { partido });
  };

  const handleLoadResult = (partido: Partido) => {
    navigation.navigate('LoadResults', { partido });
  };

  const renderPartido = (partido: Partido & { equipo_local: Equipo, equipo_visitante: Equipo }) => {
    // Determinar ganador considerando penales
    const hasResult = partido.marcador_local !== null && partido.marcador_local !== undefined && 
                      partido.marcador_visitante !== null && partido.marcador_visitante !== undefined;
    
    const hayPenales = partido.penales_local !== null && partido.penales_local !== undefined && 
                       partido.penales_visitante !== null && partido.penales_visitante !== undefined;
    
    let ganador: 'local' | 'visitante' | 'empate' | null = null;
    
    if (hasResult) {
      const golesLocal = partido.marcador_local!;
      const golesVisitante = partido.marcador_visitante!;
      const penalesLocal = partido.penales_local;
      const penalesVisitante = partido.penales_visitante;
      
      // Si hay penales, determinar ganador por penales
      if (hayPenales) {
        ganador = penalesLocal! > penalesVisitante! ? 'local' : penalesLocal! < penalesVisitante! ? 'visitante' : 'empate';
      } else {
        // Determinar ganador por resultado normal
        ganador = golesLocal > golesVisitante ? 'local' : golesLocal < golesVisitante ? 'visitante' : 'empate';
      }
    }

    return (
      <TouchableOpacity
        key={partido.id_partido}
        style={styles.partidoCard}
        onPress={() => isAdmin ? handleEditPartido(partido) : navigation.navigate('MatchDetail', { partidoId: partido.id_partido })}
        activeOpacity={0.7}
      >
        <View style={styles.partidoHeader}>
          <View style={styles.partidoInfo}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={styles.fechaText}>{formatDate(partido.fecha)}</Text>
            {partido.hora && (
              <>
                <MaterialCommunityIcons name="clock" size={14} color={colors.textSecondary} style={{ marginLeft: 8 }} />
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
            <MaterialCommunityIcons name="soccer-field" size={14} color={colors.textSecondary} />
            <View style={styles.canchaTextContainer}>
              <Text style={styles.canchaLocalText}>
                {mockLocales.find(l => l.id_local === partido.cancha!.id_local)?.nombre || 'Local'}
              </Text>
              <Text style={styles.canchaText}>{partido.cancha.nombre}</Text>
            </View>
          </View>
        )}

        <View style={styles.equiposContainer}>
          <View style={styles.equipoRow}>
            <Image 
              source={partido.equipo_local.logo ? { uri: partido.equipo_local.logo } : require('../../../assets/InterLOGO.png')} 
              style={styles.equipoLogo} 
              resizeMode="cover" 
            />
            <Text style={[
              styles.equipoNombre,
              ganador === 'local' && styles.equipoNombreGanador,
            ]} numberOfLines={1}>
              {partido.equipo_local.nombre}
            </Text>
            <View style={styles.scoreContainer}>
              {ganador === 'local' && <View style={styles.winnerIndicator} />}
              <View style={styles.scoreRow}>
                <Text style={[
                  styles.golesText,
                  ganador === 'local' && styles.golesTextGanador,
                  ganador === 'visitante' && styles.golesTextPerdedor
                ]}>
                  {partido.marcador_local !== null && partido.marcador_local !== undefined ? partido.marcador_local : '-'}
                </Text>
                {hayPenales && (
                  <Text style={[
                    styles.penalesTextSmall,
                    ganador === 'local' && styles.golesTextGanador,
                    ganador === 'visitante' && styles.golesTextPerdedor
                  ]}>
                    {' '}({partido.penales_local})
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.equipoRow}>
            <Image 
              source={partido.equipo_visitante.logo ? { uri: partido.equipo_visitante.logo } : require('../../../assets/InterLOGO.png')} 
              style={styles.equipoLogo} 
              resizeMode="cover" 
            />
            <Text style={[
              styles.equipoNombre,
              ganador === 'visitante' && styles.equipoNombreGanador,
            ]} numberOfLines={1}>
              {partido.equipo_visitante.nombre}
            </Text>
            <View style={styles.scoreContainer}>
              {ganador === 'visitante' && <View style={styles.winnerIndicator} />}
              <View style={styles.scoreRow}>
                <Text style={[
                  styles.golesText,
                  ganador === 'visitante' && styles.golesTextGanador,
                  ganador === 'local' && styles.golesTextPerdedor
                ]}>
                  {partido.marcador_visitante !== null && partido.marcador_visitante !== undefined ? partido.marcador_visitante : '-'}
                </Text>
                {hayPenales && (
                  <Text style={[
                    styles.penalesTextSmall,
                    ganador === 'visitante' && styles.golesTextGanador,
                    ganador === 'local' && styles.golesTextPerdedor
                  ]}>
                    {' '}({partido.penales_visitante})
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={styles.loadResultButton}
            onPress={(e) => {
              e.stopPropagation();
              handleLoadResult(partido);
            }}
          >
            <MaterialCommunityIcons name="scoreboard" size={16} color={colors.primary} />
            <Text style={styles.loadResultText}>Cargar Resultado</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const handleEditRonda = (e: any, ronda: Ronda) => {
    e.stopPropagation();
    navigation.navigate('EditRonda', { ronda });
  };

  const handleAddPartido = (e: any, ronda: Ronda) => {
    e.stopPropagation();
    navigation.navigate('CreatePartido', { ronda });
  };

  const handleGenerateFixture = (e: any, ronda: Ronda) => {
    e.stopPropagation();
    Alert.alert(
      'Generar Partidos',
      '¿Deseas generar automáticamente los partidos para esta ronda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            try {
              // TODO: Llamar API para generar fixture automático
              // await api.rounds.generateFixture(ronda.id_ronda);
              console.log('Generar fixture para ronda:', ronda.id_ronda);
              showInfo('Partidos generados automáticamente');
              loadData();
            } catch (error) {
              showError('Error al generar los partidos');
            }
          },
        },
      ]
    );
  };

  const handleExportRonda = async (e: any, ronda: Ronda) => {
    e.stopPropagation();
    try {
      const partidosRonda = getPartidosByRonda(ronda.id_ronda);
      const exportData = {
        ronda: {
          nombre: ronda.nombre,
          tipo: ronda.tipo,
          subtipo_eliminatoria: ronda.subtipo_eliminatoria,
          fecha_inicio: ronda.fecha_inicio,
          fecha_fin: ronda.fecha_fin,
        },
        partidos: partidosRonda.map(p => ({
          equipo_local: p.equipo_local.nombre,
          equipo_visitante: p.equipo_visitante.nombre,
          fecha: p.fecha,
          hora: p.hora,
          marcador_local: p.marcador_local,
          marcador_visitante: p.marcador_visitante,
          estado_partido: p.estado_partido,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: `Ronda: ${ronda.nombre}\n\n${jsonString}`,
        title: `Exportar ${ronda.nombre}`,
      });
      
      showInfo('Ronda exportada correctamente');
    } catch (error) {
      console.error('Error al exportar ronda:', error);
      showError('Error al exportar la ronda');
    }
  };

  const renderRonda = ({ item: ronda }: { item: Ronda }) => {
    const partidosRonda = getPartidosByRonda(ronda.id_ronda);
    const isExpanded = expandedRondas[ronda.id_ronda];
    const gradientColors = ronda.tipo === 'eliminatorias' && ronda.subtipo_eliminatoria
      ? getSubtipoGradient(ronda.subtipo_eliminatoria) as [string, string, ...string[]]
      : null;

    return (
      <View key={ronda.id_ronda} style={styles.rondaContainer}>
        <TouchableOpacity
          style={[styles.rondaHeader, !gradientColors && { backgroundColor: colors.white }]}
          onPress={() => toggleRonda(ronda.id_ronda)}
          activeOpacity={0.7}
        >
          {gradientColors ? (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
              <View style={styles.rondaInfo}>
                <Text style={[styles.rondaNombre, { color: colors.white }]}>{ronda.nombre}</Text>
                <Text style={[styles.rondaFecha, { color: colors.white }]}>
                  {formatDate(ronda.fecha_inicio)}{ronda.fecha_fin ? ` - ${formatDate(ronda.fecha_fin)}` : ''}
                </Text>
              </View>
              <View style={styles.rondaStatsActions}>
                <View style={styles.rondaStats}>
                  <Text style={[styles.partidosCount, { color: colors.white }]}>{partidosRonda.length} partidos</Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.white}
                  />
                </View>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.deleteButtonGradient}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteRonda(ronda);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.rondaInfo}>
                <Text style={styles.rondaNombre}>{ronda.nombre}</Text>
                <Text style={styles.rondaFecha}>
                  {formatDate(ronda.fecha_inicio)}{ronda.fecha_fin ? ` - ${formatDate(ronda.fecha_fin)}` : ''}
                </Text>
              </View>
              <View style={styles.rondaStatsActions}>
                <View style={styles.rondaStats}>
                  <Text style={styles.partidosCount}>{partidosRonda.length} partidos</Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </View>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteRonda(ronda);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <>
            {/* Botones de admin para la ronda */}
            {isAdmin && (
              <View style={styles.rondaActions}>
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleEditRonda(e, ronda)}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
                  <Text style={styles.rondaActionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleAddPartido(e, ronda)}
                >
                  <MaterialCommunityIcons name="plus-circle" size={18} color={colors.success} />
                  <Text style={styles.rondaActionText}>Agregar </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleExportRonda(e, ronda)}
                >
                  <MaterialCommunityIcons name="export" size={18} color={colors.info} />
                  <Text style={styles.rondaActionText}>Exportar</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.partidosList}>
              {partidosRonda.length === 0 ? (
                <Text style={styles.emptyText}>No hay partidos en esta ronda</Text>
              ) : (
                partidosRonda.map((partido) => renderPartido(partido))
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  const handleCreateRonda = () => {
    navigation.navigate('CreateRonda', { idEdicionCategoria });
  };

  const handleCreateRondaAmistosa = () => {
    Alert.alert(
      'Crear Ronda Amistosa',
      '¿Deseas crear una ronda amistosa automáticamente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async () => {
            try {
              // TODO: Llamar API para crear ronda amistosa automática
              // await api.rounds.createFriendlyRound(idEdicionCategoria);
              console.log('Crear ronda amistosa automática');
              showInfo('Ronda amistosa creada automáticamente');
              loadData();
            } catch (error) {
              showError('Error al crear la ronda amistosa');
            }
          },
        },
      ]
    );
  };

  const handleGenerateGroupStageFixture = () => {
    Alert.alert(
      'Generar Rondas de Fase de Grupos',
      '¿Deseas generar automáticamente todas las rondas necesarias para que cada equipo del grupo se enfrente una vez?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            try {
              // TODO: Llamar API para generar todas las rondas de fase de grupos (todos vs todos)
              // await api.rounds.generateAllGroupStageRounds(idEdicionCategoria);
              console.log('Generar todas las rondas de fase de grupos automáticamente');
              showInfo('Rondas de fase de grupos generadas exitosamente');
              loadData();
            } catch (error) {
              showError('Error al generar las rondas');
            }
          },
        },
      ]
    );
  };

  const handleDeleteRonda = (ronda: Ronda) => {
    Alert.alert(
      'Eliminar Ronda',
      `¿Estás seguro de eliminar la ronda "${ronda.nombre}"? Esta acción eliminará todos los partidos asociados y no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Llamar API para eliminar ronda
              // await api.rounds.deleteRound(ronda.id_ronda);
              console.log('Eliminar ronda:', ronda.id_ronda);
              showInfo('Ronda eliminada exitosamente');
              loadData();
            } catch (error) {
              showError('Error al eliminar la ronda');
            }
          },
        },
      ]
    );
  };

  const renderRondaRightActions = (ronda: Ronda) => (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -20, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });

    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteContainer,
          {
            opacity,
            transform: [{ translateX }, { scale }],
            height: '100%',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeDeleteButton}
          onPress={() => handleDeleteRonda(ronda)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="delete" size={28} color={colors.white} />
          <Text style={styles.swipeDeleteText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getSubtipoGradient = (subtipo?: string): string[] => {
    switch (subtipo) {
      case 'oro':
        return ['#FFD700', '#FFA500', '#FF8C00']; // Dorado
      case 'plata':
        return ['#C0C0C0', '#A8A8A8', '#808080']; // Plateado
      case 'bronce':
        return ['#CD7F32', '#B8733C', '#9F6F3D']; // Bronce
      default:
        return [colors.white, colors.white, colors.white];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando fixture...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar equipo..."
        onClear={clearSearch}
      />

      <FlatList
        data={rondas}
        renderItem={renderRonda}
        keyExtractor={(item) => item.id_ronda.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-remove" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No hay rondas creadas</Text>
            {isAdmin && (
              <Text style={styles.emptySubtitle}>Crea la primera ronda para comenzar</Text>
            )}
          </View>
        }
      />

      {isAdmin && (
        <>
          {/* FAB Principal: Crear Ronda */}
          <FAB
            icon="add-circle"
            onPress={handleCreateRonda}
            color={colors.primary}
          />
          
          {/* FAB Secundario: Crear Ronda Amistosa */}
          <TouchableOpacity
            style={styles.fabSecondary}
            onPress={handleCreateRondaAmistosa}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="hand-heart" size={24} color={colors.white} />
          </TouchableOpacity>

          {/* FAB Terciario: Generar Todos vs Todos */}
          <TouchableOpacity
            style={styles.fabTertiary}
            onPress={handleGenerateGroupStageFixture}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="group" size={24} color={colors.white} />
          </TouchableOpacity>
        </>
      )}
    </GestureHandlerRootView>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  rondaContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rondaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
  },
  rondaInfo: {
    flex: 1,
  },
  rondaNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  rondaFecha: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rondaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rondaStatsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partidosCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexWrap: 'nowrap',
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
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  rondaActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
  partidosList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  partidoCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partidoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fechaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  canchaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: 8,
  },
  canchaTextContainer: {
    flexDirection: 'column',
  },
  canchaLocalText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  canchaText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  estadoBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
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
    width: 20,
    height: 20,
    borderRadius: 8,
  },
  equipoLogoEmoji: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipoLogoEmojiText: {
    fontSize: 20,
  },
  equipoNombre: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  equipoNombreGanador: {
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  winnerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  golesText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  golesTextGanador: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  golesTextPerdedor: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  penalesTextSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadResultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
  },
  loadResultText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  fabSecondary: {
    position: 'absolute',
    right: 24,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabTertiary: {
    position: 'absolute',
    right: 24,
    bottom: 160,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  swipeDeleteContainer: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  swipeDeleteButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
