import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { Ronda, Partido, Equipo } from '../../types';
import { mockRondas, mockPartidos, mockEquipos, mockGrupos, mockClasificacion } from '../../data/mockData';
import { SearchBar, FAB, Button } from '../../components/common';
import { useSearch } from '../../hooks';
import { formatDate } from '../../utils/formatters';
import { safeAsync, getUserFriendlyMessage } from '../../utils/errorHandling';

interface FixtureManagementScreenProps {
  navigation: any;
  route: any;
}

export const FixtureManagementScreen: React.FC<FixtureManagementScreenProps> = ({ navigation, route }) => {
  const { isAdmin = false, idEdicionCategoria } = route.params || {};
  const { showSuccess, showError, showInfo } = useToast();
  
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [expandedRondas, setExpandedRondas] = useState<{ [key: number]: boolean }>({});
  const [closestRondaId, setClosestRondaId] = useState<number | null>(null);
  
  const {
    searchQuery,
    setSearchQuery,
    filteredData: filteredEquipos,
    clearSearch,
  } = useSearch(mockEquipos, 'nombre');

  const loadData = useCallback(async () => {
    const result = await safeAsync(
      async () => {
        // Cargar rondas ordenadas por orden descendente
        const sortedRondas: Ronda[] = [...mockRondas].sort((a, b) => b.orden - a.orden);
        
        // Encontrar la ronda más cercana a la fecha actual
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
      setClosestRondaId(result.closestRondaId);
      
      if (result.closestRondaId !== null) {
        setExpandedRondas({ [result.closestRondaId]: true });
      }
      
      if (result.sortedRondas.length > 0) {
        showInfo(`${result.sortedRondas.length} rondas cargadas`);
      }
    }
  }, [showError, showInfo]);

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
      }))
      .sort((a, b) => {
        const dateA = new Date(`${a.fecha} ${a.hora || '00:00'}`);
        const dateB = new Date(`${b.fecha} ${b.hora || '00:00'}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [partidos, searchQuery, filteredEquipos]);

  const handleCreateRonda = useCallback(() => {
    console.log('Crear nueva ronda');
    navigation.navigate('CreateRonda', { idEdicionCategoria });
  }, [navigation, idEdicionCategoria]);

  const handleCreateRondaAmistosa = useCallback(() => {
    console.log('Crear ronda amistosa');
    navigation.navigate('CreateRondaAmistosa', { idEdicionCategoria });
  }, [navigation, idEdicionCategoria]);

  const handleGenerateFixture = () => {
    // Validar que todos los grupos tengan la misma cantidad de equipos
    const gruposConEquipos = mockGrupos.map(grupo => {
      const equiposEnGrupo = mockClasificacion.filter(c => c.id_grupo === grupo.id_grupo);
      return {
        grupo: grupo.nombre,
        cantidad: equiposEnGrupo.length,
      };
    });

    const cantidadPrimerGrupo = gruposConEquipos[0]?.cantidad || 0;
    const todosIguales = gruposConEquipos.every(g => g.cantidad === cantidadPrimerGrupo);

    if (!todosIguales || cantidadPrimerGrupo === 0) {
      const mensaje = gruposConEquipos
        .map(g => `${g.grupo}: ${g.cantidad} equipos`)
        .join('\n');
      
      Alert.alert(
        'Error',
        `Todos los grupos deben tener la misma cantidad de equipos para generar el fixture.\n\n${mensaje}`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Generar Fixture de Grupos',
      `Se generarán las rondas necesarias para que todos los equipos de cada grupo se enfrenten.\n\n¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: () => {
            console.log('Generando fixture automático...');
            // TODO: Llamar a la API para generar el fixture
            // await api.fixture.generateGroupFixture(idEdicionCategoria);
            Alert.alert('Éxito', 'Fixture generado exitosamente');
            loadData();
          },
        },
      ]
    );
  };

  const handleEditPartido = useCallback((partido: Partido) => {
    console.log('Editar partido:', partido);
    navigation.navigate('EditPartido', { partido });
  }, [navigation]);

  const handleLoadResult = useCallback((partido: Partido) => {
    console.log('Cargar resultado:', partido);
    navigation.navigate('LoadResults', { partido });
  }, [navigation]);

  const handleDeleteRonda = useCallback((ronda: Ronda) => {
    Alert.alert(
      'Eliminar Ronda',
      `¿Estás seguro de eliminar "${ronda.nombre}"? Esta acción eliminará también todos los partidos asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Llamar API para eliminar ronda
              console.log('Eliminar ronda:', ronda.id_ronda);
              setRondas(rondas.filter(r => r.id_ronda !== ronda.id_ronda));
              showSuccess('Ronda eliminada exitosamente');
            } catch (error) {
              showError('No se pudo eliminar la ronda');
            }
          },
        },
      ]
    );
  }, [rondas, showSuccess, showError]);

  const renderRightActions = (ronda: Ronda) => (
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
          styles.swipeDeleteButton,
          {
            opacity,
            transform: [{ translateX }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeDeleteButtonInner}
          onPress={() => handleDeleteRonda(ronda)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="delete" size={28} color={colors.white} />
          <Text style={styles.swipeDeleteText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Importar formatDate desde utils en lugar de duplicar
  // const formatDate = ... → usar formatDate desde import

  const renderPartido = (partido: Partido & { equipo_local: Equipo, equipo_visitante: Equipo }) => {
    const isFinished = partido.estado_partido === 'Finalizado';
    const isPending = partido.estado_partido === 'Pendiente';

    return (
      <View key={partido.id_partido} style={styles.partidoCard}>
        <View style={styles.partidoHeader}>
          <View style={styles.partidoDate}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={styles.partidoDateText}>
              {formatDate(partido.fecha)} {partido.hora && `- ${partido.hora}`}
            </Text>
          </View>
          
          {partido.id_cancha && (
            <View style={styles.canchaChip}>
              <MaterialCommunityIcons name="soccer-field" size={12} color={colors.white} />
              <Text style={styles.canchaText}>Cancha {partido.id_cancha}</Text>
            </View>
          )}
        </View>

        <View style={styles.partidoContent}>
          {/* Equipo Local */}
          <View style={styles.equipoContainer}>
            <Image
              source={partido.equipo_local.logo ? { uri: partido.equipo_local.logo } : require('../../assets/InterLOGO.png')}
              style={styles.equipoLogo}
              resizeMode="contain"
            />
            <Text style={styles.equipoNombre} numberOfLines={2}>
              {partido.equipo_local.nombre}
            </Text>
          </View>

          {/* Marcador o VS */}
          <View style={styles.marcadorContainer}>
            {isFinished ? (
              <>
                <Text style={styles.marcador}>{partido.marcador_local}</Text>
                <Text style={styles.marcadorSeparator}>-</Text>
                <Text style={styles.marcador}>{partido.marcador_visitante}</Text>
              </>
            ) : (
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
                <Text style={styles.estadoText}>{partido.estado_partido}</Text>
              </View>
            )}
          </View>

          {/* Equipo Visitante */}
          <View style={styles.equipoContainer}>
            <Image
              source={partido.equipo_visitante.logo ? { uri: partido.equipo_visitante.logo } : require('../../assets/InterLOGO.png')}
              style={styles.equipoLogo}
              resizeMode="contain"
            />
            <Text style={styles.equipoNombre} numberOfLines={2}>
              {partido.equipo_visitante.nombre}
            </Text>
          </View>
        </View>

        {/* Botones de acción (solo admin) */}
        {isAdmin && (
          <View style={styles.partidoActions}>
            {isPending && (
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditPartido(partido)}
              >
                <MaterialCommunityIcons name="pencil" size={16} color={colors.white} />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.resultButton]}
              onPress={() => handleLoadResult(partido)}
            >
              <MaterialCommunityIcons 
                name={isFinished ? "trophy" : "flag-checkered"} 
                size={16} 
                color={colors.white} 
              />
              <Text style={styles.actionButtonText}>
                {isFinished ? 'Ver Resultado' : 'Cargar Resultado'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderRonda = (ronda: Ronda) => {
    const isExpanded = expandedRondas[ronda.id_ronda];
    const isClosest = ronda.id_ronda === closestRondaId;
    const partidosRonda = getPartidosByRonda(ronda.id_ronda);

    if (partidosRonda.length === 0 && searchQuery) {
      return null; // No mostrar ronda si no tiene partidos que coincidan con la búsqueda
    }

    return (
      <View key={ronda.id_ronda} style={styles.rondaContainer}>
        <TouchableOpacity
          style={[styles.rondaHeader, isClosest && styles.rondaHeaderClosest]}
          onPress={() => toggleRonda(ronda.id_ronda)}
          activeOpacity={0.7}
        >
          <View style={styles.rondaHeaderLeft}>
            <MaterialCommunityIcons
              name={isExpanded ? 'chevron-down' : 'chevron-right'}
              size={24}
              color={isClosest ? colors.primary : colors.textPrimary}
            />
            <View style={styles.rondaInfo}>
              <View style={styles.rondaTitleRow}>
                <Text style={[styles.rondaNombre, isClosest && styles.rondaNombreClosest]}>
                  {ronda.nombre}
                </Text>
                {ronda.es_amistosa && (
                  <View style={styles.amistosaChip}>
                    <MaterialCommunityIcons name="handshake" size={12} color={colors.white} />
                    <Text style={styles.amistosaText}>Amistosa</Text>
                  </View>
                )}
                {isClosest && (
                  <View style={styles.closestChip}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color={colors.white} />
                    <Text style={styles.closestText}>Próxima</Text>
                  </View>
                )}
              </View>
              <Text style={styles.rondaFecha}>
                {formatDate(ronda.fecha_inicio)}
                {ronda.fecha_fin && ` - ${formatDate(ronda.fecha_fin)}`}
              </Text>
            </View>
          </View>

          <View style={styles.rondaActions}>
            <View style={styles.rondaBadge}>
              <Text style={styles.rondaBadgeText}>{partidosRonda.length}</Text>
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
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.rondaPartidos}>
            {partidosRonda.length === 0 ? (
              <View style={styles.emptyPartidos}>
                <MaterialCommunityIcons name="soccer" size={48} color={colors.textLight} />
                <Text style={styles.emptyText}>No hay partidos en esta ronda</Text>
              </View>
            ) : (
              partidosRonda.map((partido) => renderPartido(partido))
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Fixture</Text>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar equipo en fixture..."
          onClear={clearSearch}
        />
      </View>

      {/* Botones de Admin */}
      {isAdmin && (
        <View style={styles.adminButtons}>
          <Button
            title="Generar Fixture de Grupos"
            onPress={handleGenerateFixture}
            variant="primary"
            style={styles.generateButton}
          />
        </View>
      )}

      {/* Lista de Rondas */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {rondas.map(ronda => renderRonda(ronda))}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB para crear ronda (solo admin) */}
      {isAdmin && (
        <FAB
          onPress={handleCreateRonda}
          icon="add-circle"
          color={colors.success}
        />
      )}

      {/* Botón flotante para ronda amistosa */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.amistosaFAB}
          onPress={handleCreateRondaAmistosa}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="handshake" size={24} color={colors.white} />
        </TouchableOpacity>
      )}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
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
  searchSection: {
    backgroundColor: colors.white,
    paddingVertical: 12,
  },
  adminButtons: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  generateButton: {
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  rondaContainer: {
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rondaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
  },
  rondaHeaderClosest: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  rondaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rondaInfo: {
    marginLeft: 8,
    flex: 1,
  },
  rondaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  rondaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  rondaNombreClosest: {
    color: colors.primary,
  },
  rondaFecha: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amistosaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  amistosaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  closestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  closestText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  rondaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rondaBadge: {
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rondaBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rondaPartidos: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  partidoCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partidoDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partidoDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  canchaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  canchaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  partidoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipoContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  equipoLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  equipoNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  marcadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  marcador: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  marcadorSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  vsContainer: {
    alignItems: 'center',
    gap: 4,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  estadoText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
  },
  partidoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: colors.warning,
  },
  resultButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  emptyPartidos: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  amistosaFAB: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeDeleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 12,
    marginBottom: 16,
  },
  swipeDeleteButtonInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  swipeDeleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
