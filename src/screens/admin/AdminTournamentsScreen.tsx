import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../../theme/colors';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Pais, Edicion, Torneo } from '../../api/types';

interface TorneoConEstado extends Torneo {
  tieneEdicionActiva: boolean;
  edicionActiva?: Edicion;
}

export const AdminTournamentsScreen = ({ navigation, route }: any) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { pais } = route.params as { pais: Pais };
  const [torneos, setTorneos] = useState<TorneoConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<boolean | undefined>(true);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTorneos(true);
  }, []);

  // Recargar cuando cambian los filtros
  useEffect(() => {
    // Solo buscar si:
    // 1. No hay búsqueda (searchQuery vacío), O
    // 2. Búsqueda tiene al menos 3 caracteres
    const shouldSearch = searchQuery.trim().length === 0 || searchQuery.trim().length >= 3;

    if (!shouldSearch) {
      return; // No hacer nada si tiene 1-2 caracteres
    }

    const delaySearch = setTimeout(() => {
      loadTorneos(true);
    }, 800); // Debounce de 800ms para búsqueda

    return () => clearTimeout(delaySearch);
  }, [searchQuery, filtroActivo]);

  const loadTorneos = async (reset: boolean = false, isRefreshing: boolean = false) => {
    try {
      if (reset) {
        setCurrentPage(1);
        setHasMore(true);
        if (isRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      const pageToLoad = reset ? 1 : currentPage;

      const response = await api.torneos.getByCountry(pais.id_pais, {
        page: pageToLoad,
        limit: 10,
        activo: filtroActivo,
        q: searchQuery.trim() || undefined,
      });

      const { data, pagination } = response;

      // Validar que data sea un array
      if (!Array.isArray(data)) {
        console.warn('La respuesta de torneos no es un array:', data);
        if (reset) setTorneos([]);
        setHasMore(false);
        return;
      }

      // Para cada torneo, verificar si tiene una edición activa
      const torneosConEstado = await Promise.all(
        data.map(async (torneo) => {
          try {
            const ediciones = await api.ediciones.getByTournament(torneo.id_torneo);
            const edicionesArray = Array.isArray(ediciones) ? ediciones : [];
            const edicionActiva = edicionesArray.find(e => e.estado === 'en juego');

            return {
              ...torneo,
              tieneEdicionActiva: !!edicionActiva,
              edicionActiva,
            };
          } catch (error: any) {
            // 404 es normal cuando el torneo no tiene ediciones aún
            if (error?.response?.status === 404) {
              return {
                ...torneo,
                tieneEdicionActiva: false,
                edicionActiva: undefined,
              };
            }

            // Solo loguear errores que NO sean 404
            console.error(`Error loading editions for tournament ${torneo.id_torneo}:`, error);
            return {
              ...torneo,
              tieneEdicionActiva: false,
              edicionActiva: undefined,
            };
          }
        })
      );

      if (reset) {
        setTorneos(torneosConEstado);
      } else {
        setTorneos(prev => [...prev, ...torneosConEstado]);
      }

      setHasMore(pagination.hasNext);
      if (pagination.hasNext) {
        setCurrentPage(pageToLoad + 1);
      }

    } catch (error) {
      console.error('Error loading tournaments:', error);
      if (reset) {
        setTorneos([]);
      }
      Alert.alert('Error', 'No se pudieron cargar los torneos. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadTorneos(false);
    }
  }, [loadingMore, hasMore, loading]);

  const handleRefresh = useCallback(() => {
    loadTorneos(true, true);
  }, []);

  const handleCreateTournament = () => {
    navigation.navigate('CreateTournament', { pais });
  };

  const handleTournamentPress = (torneo: Torneo) => {
    navigation.navigate('TournamentDetails', { torneo, pais });
  };

  const handleEditTournament = (e: any, torneo: TorneoConEstado) => {
    e.stopPropagation();
    navigation.navigate('EditTournament', { torneo, pais });
  };

  const handleManageCategories = () => {
    navigation.navigate('ManageCategories', { pais });
  };

  const handleDeleteTournament = (torneo: TorneoConEstado) => {
    Alert.alert(
      'Eliminar Torneo',
      `¿Estás seguro de eliminar "${torneo.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Llamar API
              // await api.tournaments.deleteTournament(torneo.id_torneo);
              console.log('Eliminar torneo:', torneo.id_torneo);
              setTorneos(torneos.filter(t => t.id_torneo !== torneo.id_torneo));
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el torneo');
            }
          },
        },
      ]
    );
  };

  const renderHeader = useMemo(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.paisEmoji}>{pais.emoji}</Text>
          <Text style={styles.title}>{pais.nombre}</Text>
        </View>

        <View style={styles.headerActions}>
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleManageCategories}
            >
              <MaterialCommunityIcons name="shape" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Main')}
          >
            <MaterialCommunityIcons name="account-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Búsqueda y Filtros */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar torneos"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtro Activo/Inactivo */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filtroActivo === true && styles.filterButtonActive,
            ]}
            onPress={() => setFiltroActivo(true)}
          >
            <Text style={[
              styles.filterButtonText,
              filtroActivo === true && styles.filterButtonTextActive,
            ]}>
              Activos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filtroActivo === false && styles.filterButtonActive,
            ]}
            onPress={() => setFiltroActivo(false)}
          >
            <Text style={[
              styles.filterButtonText,
              filtroActivo === false && styles.filterButtonTextActive,
            ]}>
              Inactivos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filtroActivo === undefined && styles.filterButtonActive,
            ]}
            onPress={() => setFiltroActivo(undefined)}
          >
            <Text style={[
              styles.filterButtonText,
              filtroActivo === undefined && styles.filterButtonTextActive,
            ]}>
              Todos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Torneos</Text>
    </>
  ), [searchQuery, filtroActivo, pais.emoji, pais.nombre, navigation, isSuperAdmin, handleManageCategories]);

  const renderFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loadingMore]);

  const renderEmpty = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🏆</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No se encontraron torneos' : 'No hay torneos creados'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `No hay resultados para "${searchQuery}"`
          : isSuperAdmin
          ? 'Presiona el botón + para crear el primer torneo'
          : 'Aún no hay torneos disponibles para este país'}
      </Text>
    </View>
  ), [searchQuery, isSuperAdmin]);

  const renderTorneoItem = ({ item: torneo }: { item: TorneoConEstado }) => {
    const content = (
      <TouchableOpacity
        style={[
          styles.torneoCard,
          !torneo.tieneEdicionActiva && styles.torneoCardInactive,
        ]}
        onPress={() => handleTournamentPress(torneo)}
        activeOpacity={0.7}
      >
        <View style={styles.torneoInfo}>
          <View style={styles.torneoHeader}>
            <Text style={[
              styles.torneoName,
              !torneo.tieneEdicionActiva && styles.torneoNameInactive,
            ]}>
              {torneo.nombre}
            </Text>
            {torneo.activo ? (
              <View style={styles.badgeActive}>
                <MaterialCommunityIcons name="circle" size={8} color={colors.success} />
                <Text style={styles.badgeText}>Activo</Text>
              </View>
            ) : (
              <View style={styles.badgeInactive}>
                <MaterialCommunityIcons name="circle" size={8} color={colors.textSecondary} />
                <Text style={styles.badgeTextInactive}>Inactivo</Text>
              </View>
            )}
          </View>
          {torneo.edicionActiva && (
            <Text style={styles.torneoEdicion}>Edición {torneo.edicionActiva.numero}</Text>
          )}
          <Text style={styles.torneoTemporada}>Temporada {torneo.temporada}</Text>
        </View>

        <View style={styles.torneoActions}>
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => handleEditTournament(e, torneo)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}

          <View style={styles.torneoArrow}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={torneo.activo ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>
      </TouchableOpacity>
    );

    if (isAdmin || isSuperAdmin) {
      return (
        <Swipeable
          key={torneo.id_torneo}
          renderRightActions={renderRightActions(torneo)}
          rightThreshold={40}
          overshootRight={false}
          friction={1.5}
          overshootFriction={8}
          enableTrackpadTwoFingerGesture
        >
          {content}
        </Swipeable>
      );
    }

    return content;
  };

  const renderRightActions = (torneo: TorneoConEstado) => (
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
          onPress={() => handleDeleteTournament(torneo)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="delete" size={28} color={colors.white} />
          <Text style={styles.swipeDeleteText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando torneos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FlatList
          data={torneos}
          renderItem={renderTorneoItem}
          keyExtractor={(item) => item.id_torneo.toString()}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={!loading ? renderEmpty : null}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />
      </GestureHandlerRootView>

      {/* Floating Add Button - Solo para SuperAdmins */}
      {isSuperAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateTournament}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  flatListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 1,

  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paisEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.backgroundGray,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  torneoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  torneoCardInactive: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  torneoInfo: {
    flex: 1,
  },
  torneoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  torneoName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  torneoNameInactive: {
    color: colors.textSecondary,
  },
  torneoEdicion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  torneoTemporada: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  badgeInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeTextInactive: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  torneoArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  torneoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createAdminButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
  },
  swipeDeleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: 75,
    borderRadius: 10,
  },
  swipeDeleteButtonInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
});

export default AdminTournamentsScreen;
