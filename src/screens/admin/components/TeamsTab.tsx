import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import api from '../../../api';
import { Equipo } from '../../../api/types/equipos.types';
import { useAuth } from '../../../contexts/AuthContext';

interface TeamsTabProps {
  idEdicionCategoria: number;
  maxEquipos?: number;
  onCreateTeam?: () => void;
  onBulkCreateTeams?: () => void;
  onTeamPress?: (equipo: Equipo) => void;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({
  idEdicionCategoria,
  maxEquipos,
  onCreateTeam,
  onBulkCreateTeams,
  onTeamPress,
}) => {
  const { isAdmin } = useAuth();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEquipos();
  }, [idEdicionCategoria]);

  const loadEquipos = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.equipos.list(idEdicionCategoria);
      const equiposArray = Array.isArray(response.data) ? response.data : [];
      setEquipos(equiposArray);
    } catch (error: any) {
      console.error('Error loading teams:', error);
      if (error?.response?.status === 404) {
        setEquipos([]);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los equipos');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadEquipos(true);
  };

  // Verificar si se alcanzó el máximo de equipos
  const maxEquiposAlcanzado = maxEquipos ? equipos.length >= maxEquipos : false;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="shield-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No hay equipos registrados</Text>
      <Text style={styles.emptySubtitle}>
        {maxEquiposAlcanzado
          ? `Se alcanzó el máximo de ${maxEquipos} equipos permitidos`
          : 'Crea equipos individualmente o importa múltiples equipos desde un archivo CSV'}
      </Text>
      {isAdmin && !maxEquiposAlcanzado && (
        <View style={styles.emptyActions}>
          {onCreateTeam && (
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={onCreateTeam}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.white} />
              <Text style={styles.emptyActionButtonText}>Crear Equipo</Text>
            </TouchableOpacity>
          )}
          {onBulkCreateTeams && (
            <TouchableOpacity
              style={[styles.emptyActionButton, styles.emptyActionButtonSecondary]}
              onPress={onBulkCreateTeams}
            >
              <MaterialCommunityIcons name="file-upload" size={24} color={colors.primary} />
              <Text style={[styles.emptyActionButtonText, styles.emptyActionButtonSecondaryText]}>
                Importar CSV
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando equipos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Botones de acción - Solo para admins */}
      {isAdmin && equipos.length > 0 && !maxEquiposAlcanzado && (
        <View style={styles.actionButtonsContainer}>
          {onCreateTeam && (
            <TouchableOpacity style={styles.createButton} onPress={onCreateTeam}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.white} />
              <Text style={styles.createButtonText}>Crear Equipo</Text>
            </TouchableOpacity>
          )}
          {onBulkCreateTeams && (
            <TouchableOpacity
              style={[styles.createButton, styles.bulkButton]}
              onPress={onBulkCreateTeams}
            >
              <MaterialCommunityIcons name="file-upload" size={24} color={colors.white} />
              <Text style={styles.createButtonText}>Importar CSV</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Mensaje cuando se alcanza el máximo */}
      {isAdmin && equipos.length > 0 && maxEquiposAlcanzado && (
        <View style={styles.maxReachedContainer}>
          <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
          <Text style={styles.maxReachedText}>
            Se alcanzó el máximo de {maxEquipos} equipos permitidos
          </Text>
        </View>
      )}

      {/* Lista de equipos */}
      {equipos.length === 0 ? (
        renderEmpty()
      ) : (
        <View style={styles.teamsGrid}>
          {equipos.map((equipo) => (
            <TouchableOpacity
              key={equipo.id_equipo}
              style={styles.teamCard}
              onPress={() => onTeamPress?.(equipo)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.teamCardHeader,
                  { backgroundColor: colors.primary },
                ]}
              >
                {equipo.logo ? (
                  <Image
                    source={{ uri: equipo.logo }}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="shield"
                    size={48}
                    color={colors.white}
                  />
                )}
              </View>
              <View style={styles.teamCardBody}>
                <Text style={styles.teamName} numberOfLines={2}>
                  {equipo.nombre}
                </Text>
                <Text style={styles.teamShortName} numberOfLines={1}>
                  {equipo.nombre_corto || equipo.nombre}
                </Text>
                {equipo.nombre_delegado && (
                  <View style={styles.delegadoInfo}>
                    <MaterialCommunityIcons
                      name="account"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.delegadoText} numberOfLines={1}>
                      {equipo.nombre_delegado}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.teamCardFooter}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )
      }
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  tabContentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundGray,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bulkButton: {
    backgroundColor: '#1976D2',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  teamCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  teamCardHeader: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  teamLogo: {
    width: '80%',
    height: '80%',
  },
  teamCardBody: {
    padding: 12,
    minHeight: 90,
  },
  teamName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  teamShortName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  delegadoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  delegadoText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  teamCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  emptyActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  emptyActionButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emptyActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  emptyActionButtonSecondaryText: {
    color: colors.primary,
  },
  maxReachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  maxReachedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
