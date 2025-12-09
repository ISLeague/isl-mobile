import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../../theme/colors';
import { mockApi } from '../../api/mockApi';
import { Pais, Torneo, Edicion } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface TorneoConEstado extends Torneo {
  tieneEdicionActiva: boolean;
  edicionActiva?: Edicion;
}

export const AdminTournamentsScreen = ({ navigation, route }: any) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { pais } = route.params as { pais: Pais };
  const [torneos, setTorneos] = useState<TorneoConEstado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTorneos();
  }, []);

  const loadTorneos = async () => {
    try {
      const data = await mockApi.main.getTournamentsByCountry(pais.id_pais);
      
      // Para cada torneo, verificar si tiene una edición activa
      const torneosConEstado = await Promise.all(
        data.map(async (torneo) => {
          const ediciones = await mockApi.main.getEditionsByTournament(torneo.id_torneo);
          const edicionActiva = ediciones.find(e => e.estado === 'en juego');
          
          return {
            ...torneo,
            tieneEdicionActiva: !!edicionActiva,
            edicionActiva,
          };
        })
      );
      
      // Ordenar: activos primero, luego finalizados
      torneosConEstado.sort((a, b) => {
        if (a.tieneEdicionActiva && !b.tieneEdicionActiva) return -1;
        if (!a.tieneEdicionActiva && b.tieneEdicionActiva) return 1;
        return 0;
      });
      
      setTorneos(torneosConEstado);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = () => {
    navigation.navigate('CreateTournament', { pais });
  };

  const handleCreateTournamentAdmin = (torneo: TorneoConEstado) => {
    if (!torneo.edicionActiva) {
      Alert.alert('Error', 'El torneo debe tener una edición activa para asignar un admin');
      return;
    }
    
    navigation.navigate('CreateTournamentAdmin', { 
      torneo, 
      edicion: torneo.edicionActiva,
      pais 
    });
  };

  const handleTournamentPress = (torneo: Torneo) => {
    navigation.navigate('TournamentCategories', { torneo, pais });
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
              // await mockApi.tournaments.deleteTournament(torneo.id_torneo);
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
          <Text style={styles.loadingText}>Cargando torneos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Main')}
          >
            <MaterialCommunityIcons name="account-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Torneos List */}
        <View style={styles.torneosSection}>
          <Text style={styles.sectionTitle}>Torneos</Text>

          {torneos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>No hay torneos creados</Text>
            </View>
          ) : (
            torneos.map((torneo) => {
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
                      {torneo.tieneEdicionActiva ? (
                        <View style={styles.badgeActive}>
                          <MaterialCommunityIcons name="circle" size={8} color={colors.success} />
                          <Text style={styles.badgeText}>Activo</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeInactive}>
                          <MaterialCommunityIcons name="circle" size={8} color={colors.textSecondary} />
                          <Text style={styles.badgeTextInactive}>Finalizado</Text>
                        </View>
                      )}
                    </View>
                    {torneo.edicionActiva && (
                      <Text style={styles.torneoEdicion}>Edición {torneo.edicionActiva.numero}</Text>
                    )}
                  </View>
                  
                  <View style={styles.torneoActions}>
                    {/* Botón Crear Admin (solo si tiene edición activa Y usuario es SuperAdmin) */}
                    {torneo.tieneEdicionActiva && isSuperAdmin && (
                      <TouchableOpacity
                        style={styles.createAdminButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCreateTournamentAdmin(torneo);
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons 
                          name="account-plus" 
                          size={20} 
                          color={colors.primary} 
                        />
                      </TouchableOpacity>
                    )}
                    
                    <View style={styles.torneoArrow}>
                      <MaterialCommunityIcons 
                        name="chevron-right" 
                        size={24} 
                        color={torneo.tieneEdicionActiva ? colors.primary : colors.textSecondary} 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );

              if (isAdmin) {
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

              return <View key={torneo.id_torneo}>{content}</View>;
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  paisEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  torneosSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: colors.white,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  torneoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
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
