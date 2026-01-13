import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';
import { Torneo, Pais } from '../../api/types';
import { Edicion } from '../../api/types/ediciones.types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const TournamentDetailsScreen = ({ navigation, route }: any) => {
  const { torneo: initialTorneo, pais } = route.params;
  const { isSuperAdmin, usuario } = useAuth();
  const { showSuccess, showError } = useToast();
  const [currentTorneo, setCurrentTorneo] = useState<Torneo>(initialTorneo);

  // Check if user can edit this tournament
  const canEditTournament =
    isSuperAdmin ||
    (usuario?.id_torneos && usuario.id_torneos.includes(currentTorneo.id_torneo));

  // Check if user can create editions for this tournament
  const canCreateEdition = canEditTournament;

  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sincronizar estado si los params cambian (ej: al volver de editar)
  useEffect(() => {
    if (initialTorneo) {
      setCurrentTorneo(initialTorneo);
    }
  }, [initialTorneo]);

  useFocusEffect(
    useCallback(() => {
      loadTournamentDetails();
      loadEdiciones();
    }, [])
  );

  const loadTournamentDetails = async () => {
    try {
      // Intentamos cargar los detalles frescos del torneo
      // Como no hay un endpoint getById directo, usamos list filtrando por ID
      // Importante: pasar activo: undefined para traerlo aunque esté inactivo
      const response = await api.torneos.list({
        activo: undefined
      });

      if (response && response.data) {
        const found = response.data.find((t: Torneo) => t.id_torneo === initialTorneo.id_torneo);
        if (found) {
          setCurrentTorneo(found);
        }
      }
    } catch (error) {
      // console.error('Error refreshing tournament details:', error);
    }
  };

  const loadEdiciones = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await api.ediciones.list({ id_torneo: currentTorneo.id_torneo });
      setEdiciones(response.data || []);
    } catch (error: any) {
      // Handle 404 gracefully - no editions yet
      if (error?.response?.status === 404) {
        setEdiciones([]);
      } else {
        // console.error('Error loading editions:', error);
        setEdiciones([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadEdiciones(true);
  };

  const handleEditTournament = () => {
    navigation.navigate('EditTournament', { torneo: currentTorneo, pais });
  };

  const handleDeleteTournament = () => {
    Alert.alert(
      'Eliminar Torneo',
      `¿Estás seguro de que quieres eliminar el torneo "${currentTorneo.nombre}"? Esta acción eliminará también todas las ediciones y datos asociados y no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.torneos.delete(currentTorneo.id_torneo);
              if (response.success) {
                showSuccess('Torneo eliminado exitosamente');
                navigation.goBack();
              } else {
                showError(response.error || 'Error al eliminar el torneo');
              }
            } catch (error: any) {
              showError(error.message || 'Error al eliminar el torneo');
            }
          },
        },
      ]
    );
  };

  const handleCreateEdition = () => {
    navigation.navigate('CreateEdition', { torneo: currentTorneo, pais });
  };

  const handleEditionPress = (edicion: Edicion) => {
    navigation.navigate('TournamentCategories', { torneo: currentTorneo, edicion, pais });
  };

  const handleEditEdition = (edicion: Edicion) => {
    navigation.navigate('EditEdition', { edicion, torneo: currentTorneo, pais });
  };

  const handleDeleteEdition = (edicion: Edicion) => {
    Alert.alert(
      'Eliminar Edición',
      `¿Estás seguro de que quieres eliminar la edición ${edicion.numero} del torneo "${currentTorneo.nombre}"? Esta acción eliminará todas las categorías, equipos y partidos asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.ediciones.delete(edicion.id_edicion);
              if (response.success) {
                showSuccess('Edición eliminada exitosamente');
                loadEdiciones(true);
              } else {
                showError(response.error || 'Error al eliminar la edición');
              }
            } catch (error: any) {
              showError(error.message || 'Error al eliminar la edición');
            }
          },
        },
      ]
    );
  };

  const getEstadoBadgeStyle = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return { backgroundColor: '#e8f5e9', color: '#4caf50' };
      case 'en_curso':
        return { backgroundColor: '#e3f2fd', color: '#2196f3' };
      case 'cerrado':
        return { backgroundColor: '#fce4ec', color: '#f06292' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#9e9e9e' };
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return 'Abierto';
      case 'en_curso':
        return 'En Curso';
      case 'cerrado':
        return 'Cerrado';
      default:
        return estado;
    }
  };

  const renderEditionItem = ({ item: edicion }: { item: Edicion }) => {
    const estadoStyle = getEstadoBadgeStyle(edicion.estado);

    return (
      <View style={styles.editionCard}>
        <TouchableOpacity
          style={styles.editionCardContent}
          onPress={() => handleEditionPress(edicion)}
          activeOpacity={0.7}
        >
          <View style={styles.editionHeader}>
            <View style={styles.editionTitleContainer}>
              <Text style={styles.editionNumber}>Edición {edicion.numero}</Text>
              <View style={[styles.estadoBadge, { backgroundColor: estadoStyle.backgroundColor }]}>
                <Text style={[styles.estadoText, { color: estadoStyle.color }]}>
                  {getEstadoLabel(edicion.estado)}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
          </View>

          <Text style={styles.editionName}>{edicion.nombre}</Text>

          <View style={styles.editionFooter}>
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons name="calendar-start" size={16} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {new Date(edicion.fecha_inicio).toLocaleDateString('es-ES')}
              </Text>
            </View>
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons name="calendar-end" size={16} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {new Date(edicion.fecha_fin).toLocaleDateString('es-ES')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {canEditTournament && (
          <>
            <TouchableOpacity
              style={styles.editionEditButton}
              onPress={() => handleEditEdition(edicion)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editionEditButton}
              onPress={() => handleDeleteEdition(edicion)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="delete" size={18} color={colors.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="calendar-blank" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No hay ediciones para este torneo</Text>
      <Text style={styles.emptySubtitle}>
        {canCreateEdition
          ? 'Presiona el botón + para crear la primera edición'
          : 'Pronto se agregarán ediciones a este torneo'}
      </Text>
      {canCreateEdition && (
        <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateEdition}>
          <Text style={styles.createFirstButtonText}>Crear Primera Edición</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando ediciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>{currentTorneo.nombre}</Text>
        </View>

        {canEditTournament ? (
          <>
            <TouchableOpacity style={styles.editButton} onPress={handleEditTournament}>
              <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTournament}>
              <MaterialCommunityIcons name="delete" size={24} color={colors.error} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.editButton} />
        )}
      </View>

      {/* Tournament Info */}
      <View style={styles.tournamentInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>Temporada: {currentTorneo.temporada}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="circle"
            size={12}
            color={currentTorneo.activo ? colors.success : colors.textSecondary}
          />
          <Text style={styles.infoText}>{currentTorneo.activo ? 'Activo' : 'Inactivo'}</Text>
        </View>
      </View>

      {/* Editions List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>EDICIONES</Text>
      </View>

      <FlatList
        data={ediciones}
        renderItem={renderEditionItem}
        keyExtractor={(item) => item.id_edicion.toString()}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Only show if there are editions and user has permission */}
      {ediciones.length > 0 && canCreateEdition && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateEdition} activeOpacity={0.8}>
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
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentInfo: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: colors.backgroundGray,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  editionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editionCardContent: {
    flex: 1,
    padding: 16,
  },
  editionEditButton: {
    padding: 12,
    marginRight: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  editionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  editionName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  editionFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
  fabeditButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    position: 'absolute',
    right: 20,
    top: 110,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
  },
});

export default TournamentDetailsScreen;
