import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { safeAsync } from '../../utils/errorHandling';
import { RondaConPartidos } from '../../api/types/rondas.types';
import api from '../../api';

interface RondasListScreenProps {
  navigation: any;
  route: any;
}

export const RondasListScreen: React.FC<RondasListScreenProps> = ({ navigation, route }) => {
  const { idFase, idEdicionCategoria } = route.params || {};
  const { showError } = useToast();
  const { isAdmin } = useAuth();

  const [rondas, setRondas] = useState<RondaConPartidos[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRondas();
  }, [idFase]);

  const loadRondas = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        const response = await api.rondas.list(idFase);
        return response.success && response.data ? response.data : [];
      },
      'RondasList - loadRondas',
      {
        fallbackValue: [],
        onError: () => showError('Error al cargar las rondas'),
      }
    );

    setRondas(result || []);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRondas();
    setRefreshing(false);
  };

  const handleRondaPress = (ronda: RondaConPartidos) => {
    navigation.navigate('RondaDetail', {
      ronda,
      idFase,
      idEdicionCategoria,
    });
  };

  const handleCreateRonda = () => {
    navigation.navigate('CreateRondaFlow', { idEdicionCategoria });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'fase_grupos':
        return 'group';
      case 'eliminatorias':
        return 'trophy-variant';
      case 'amistosa':
        return 'hand-heart';
      default:
        return 'soccer';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'fase_grupos':
        return 'Fase de Grupos';
      case 'eliminatorias':
        return 'Eliminatorias';
      case 'amistosa':
        return 'Amistosa';
      default:
        return tipo;
    }
  };

  const getSubtipoColor = (subtipo?: string) => {
    switch (subtipo) {
      case 'oro':
        return '#FFD700';
      case 'plata':
        return '#C0C0C0';
      case 'bronce':
        return '#CD7F32';
      default:
        return colors.primary;
    }
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

        <Text style={styles.title}>Jornadas</Text>

        {isAdmin && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateRonda}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando jornadas...</Text>
        </View>
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
          {rondas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={80} color={colors.textLight} />
              <Text style={styles.emptyText}>No hay jornadas creadas</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleCreateRonda}
                >
                  <MaterialCommunityIcons name="plus-circle" size={20} color={colors.white} />
                  <Text style={styles.emptyButtonText}>Crear Primera Jornada</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            rondas.map((ronda) => (
              <TouchableOpacity
                key={ronda.id_ronda}
                style={styles.rondaCard}
                onPress={() => handleRondaPress(ronda)}
                activeOpacity={0.7}
              >
                {/* Header */}
                <View style={styles.rondaHeader}>
                  <View style={styles.rondaHeaderLeft}>
                    <View
                      style={[
                        styles.rondaIcon,
                        { backgroundColor: ronda.subtipo_eliminatoria ? getSubtipoColor(ronda.subtipo_eliminatoria) : colors.primaryLight },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getTipoIcon(ronda.tipo)}
                        size={24}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.rondaTitleContainer}>
                      <Text style={styles.rondaNombre}>{ronda.nombre}</Text>
                      <Text style={styles.rondaTipo}>{getTipoLabel(ronda.tipo)}</Text>
                    </View>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
                </View>

                {/* Stats */}
                <View style={styles.rondaStats}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="soccer" size={18} color={colors.textSecondary} />
                    <Text style={styles.statText}>
                      {ronda.partidos_count} {ronda.partidos_count === 1 ? 'partido' : 'partidos'}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                    <Text style={styles.statText}>
                      {ronda.partidos_jugados} jugados
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={colors.warning} />
                    <Text style={styles.statText}>
                      {ronda.partidos_count - ronda.partidos_jugados} pendientes
                    </Text>
                  </View>
                </View>

                {/* Dates */}
                {ronda.fecha_inicio && (
                  <View style={styles.rondaDates}>
                    <MaterialCommunityIcons name="calendar-range" size={16} color={colors.textSecondary} />
                    <Text style={styles.rondaDatesText}>
                      {ronda.fecha_inicio}
                      {ronda.fecha_fin && ` - ${ronda.fecha_fin}`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    padding: 4,
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
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
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
  rondaCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rondaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rondaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rondaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rondaTitleContainer: {
    flex: 1,
  },
  rondaNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  rondaTipo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rondaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rondaDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  rondaDatesText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
