import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
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

export const TournamentDetailsScreen = ({ navigation, route }: any) => {
  const { torneo, pais } = route.params;
  const { isSuperAdmin, usuario } = useAuth();

  // Check if user can edit this tournament
  const canEditTournament =
    isSuperAdmin ||
    (usuario?.id_torneos && usuario.id_torneos.includes(torneo.id_torneo));

  // Check if user can create editions for this tournament
  const canCreateEdition = canEditTournament;

  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEdiciones();
  }, []);

  const loadEdiciones = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await api.ediciones.getByTournament(torneo.id_torneo);
      const edicionesArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setEdiciones(edicionesArray);
    } catch (error: any) {
      // Handle 404 gracefully - no editions yet
      if (error?.response?.status === 404) {
        setEdiciones([]);
      } else {
        console.error('Error loading editions:', error);
        // Don't show alert, just set empty array - screen will show empty state
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
    navigation.navigate('EditTournament', { torneo, pais });
  };

  const handleCreateEdition = () => {
    navigation.navigate('CreateEdition', { torneo, pais });
  };

  const handleEditionPress = (edicion: Edicion) => {
    navigation.navigate('TournamentCategories', { torneo, edicion, pais });
  };

  const renderEditionItem = ({ item: edicion }: { item: Edicion }) => (
    <TouchableOpacity
      style={styles.editionCard}
      onPress={() => handleEditionPress(edicion)}
      activeOpacity={0.7}
    >
      <View style={styles.editionInfo}>
        <View style={styles.editionHeader}>
          <Text style={styles.editionTitle}>
            Edición {edicion.numero}
          </Text>
          <View
            style={[
              styles.statusBadge,
              edicion.estado === 'en juego' && styles.statusBadgeActive,
              edicion.estado === 'cerrado' && styles.statusBadgeClosed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                edicion.estado === 'en juego' && styles.statusTextActive,
              ]}
            >
              {edicion.estado === 'en juego'
                ? 'En Juego'
                : edicion.estado === 'abierto'
                ? 'Abierto'
                : 'Cerrado'}
            </Text>
          </View>
        </View>
        {edicion.nombre && (
          <Text style={styles.editionName}>{edicion.nombre}</Text>
        )}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.primary}
      />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="calendar-blank"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No hay ediciones para este torneo</Text>
      <Text style={styles.emptySubtitle}>
        {canCreateEdition
          ? 'Presiona el botón + para crear la primera edición'
          : 'Pronto se agregarán ediciones a este torneo'}
      </Text>
      {canCreateEdition && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={handleCreateEdition}
        >
          <Text style={styles.createFirstButtonText}>
            Crear Primera Edición
          </Text>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>{torneo.nombre}</Text>
        </View>

        {canEditTournament ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditTournament}
          >
            <MaterialCommunityIcons
              name="pencil"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.editButton} />
        )}
      </View>

      {/* Tournament Info */}
      <View style={styles.tournamentInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText}>Temporada: {torneo.temporada}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="circle"
            size={12}
            color={torneo.activo ? colors.success : colors.textSecondary}
          />
          <Text style={styles.infoText}>
            {torneo.activo ? 'Activo' : 'Inactivo'}
          </Text>
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
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateEdition}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  editionInfo: {
    flex: 1,
    gap: 4,
  },
  editionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editionName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  statusBadgeActive: {
    backgroundColor: '#e8f5e9',
  },
  statusBadgeClosed: {
    backgroundColor: '#fce4ec',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusTextActive: {
    color: colors.success,
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
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
  },
});

export default TournamentDetailsScreen;
