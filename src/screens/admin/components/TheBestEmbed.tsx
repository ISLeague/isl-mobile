import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../api';

interface TheBestEmbedProps {
  navigation: any;
  idEdicionCategoria?: number;
}

export const TheBestEmbed: React.FC<TheBestEmbedProps> = ({ navigation, idEdicionCategoria }) => {
  const { isGuest } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [goleadores, setGoleadores] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [estadisticasEquipos, setEstadisticasEquipos] = useState<any[]>([]);

  const loadEstadisticas = useCallback(async () => {
    if (!idEdicionCategoria) {
      showError('No se ha especificado la edición/categoría');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch top scorers
      const goleadoresResponse = await api.estadisticas.goleadores(idEdicionCategoria, 10);
      if (goleadoresResponse.success && goleadoresResponse.data) {
        setGoleadores(goleadoresResponse.data);
      }

      // Fetch top assists
      const asistenciasResponse = await api.estadisticas.asistencias(idEdicionCategoria, 10);
      if (asistenciasResponse.success && asistenciasResponse.data) {
        setAsistencias(asistenciasResponse.data);
      }

      // Fetch team statistics
      const equiposResponse = await api.estadisticas.equiposGlobal(idEdicionCategoria);
      if (equiposResponse.success && equiposResponse.data) {
        setEstadisticasEquipos(equiposResponse.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      showError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [idEdicionCategoria, showError]);

  useEffect(() => {
    loadEstadisticas();
  }, [loadEstadisticas]);

  // Formatear nombre: mostrar "Nombre A." (primera letra del apellido)
  const formatPlayerName = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length === 1) {
      return partes[0]; // Si solo hay una palabra, mostrarla completa
    }
    
    const nombre = partes[0];
    const apellidoInicial = partes[partes.length - 1].charAt(0).toUpperCase();
    return `${nombre} ${apellidoInicial}.`;
  };

  // Si es invitado, mostrar mensaje
  if (isGuest) {
    return (
      <View style={styles.guestContainer}>
        <MaterialCommunityIcons name="star-off-outline" size={80} color={colors.primary} />
        <Text style={styles.guestTitle}>Contenido no disponible</Text>
        <Text style={styles.guestText}>
          Debes iniciar sesión o crear una cuenta para ver las estadísticas y rankings completos
        </Text>
        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => {
            Alert.alert(
              'Iniciar Sesión',
              '¿Deseas ir a la pantalla de inicio de sesión?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') },
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="login" size={24} color={colors.white} />
          <Text style={styles.guestButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  // Prepare team data for least conceded (sort by least goals conceded)
  const leastConcededData = [...estadisticasEquipos]
    .sort((a, b) => a.goles_en_contra - b.goles_en_contra)
    .slice(0, 5);

  const rankings = [
    {
      id: 'scorers',
      title: 'Goleadores',
      icon: 'soccer' as const,
      color: '#FF6B6B',
      data: goleadores.slice(0, 5),
      statKey: 'goles',
      isTeam: false,
    },
    {
      id: 'assists',
      title: 'Asistencias',
      icon: 'account-arrow-right' as const,
      color: '#4ECDC4',
      data: asistencias.slice(0, 5),
      statKey: 'asistencias',
      isTeam: false,
    },
    {
      id: 'goalkeepers',
      title: 'Menos Goleados',
      icon: 'shield-check' as const,
      color: '#95E1D3',
      data: leastConcededData,
      statKey: 'goles_en_contra',
      isTeam: true,
    },
    {
      id: 'win_percentage',
      title: '% Partidos Ganados',
      icon: 'trophy' as const,
      color: '#F9CA24',
      data: [...estadisticasEquipos]
        .sort((a, b) => {
          const pctA = a.partidos_jugados > 0 ? (a.partidos_ganados / a.partidos_jugados) * 100 : 0;
          const pctB = b.partidos_jugados > 0 ? (b.partidos_ganados / b.partidos_jugados) * 100 : 0;
          return pctB - pctA;
        })
        .slice(0, 5)
        .map(e => ({
          ...e,
          porcentaje_victorias: e.partidos_jugados > 0
            ? ((e.partidos_ganados / e.partidos_jugados) * 100).toFixed(1)
            : '0.0'
        })),
      statKey: 'porcentaje_victorias',
      isTeam: true,
    },
    {
      id: 'avg_goals_scored',
      title: 'Promedio Goles por Partido',
      icon: 'soccer' as const,
      color: '#6C5CE7',
      data: [...estadisticasEquipos]
        .sort((a, b) => {
          const avgA = a.partidos_jugados > 0 ? a.goles_a_favor / a.partidos_jugados : 0;
          const avgB = b.partidos_jugados > 0 ? b.goles_a_favor / b.partidos_jugados : 0;
          return avgB - avgA;
        })
        .slice(0, 5)
        .map(e => ({
          ...e,
          promedio_goles: e.partidos_jugados > 0
            ? (e.goles_a_favor / e.partidos_jugados).toFixed(2)
            : '0.00'
        })),
      statKey: 'promedio_goles',
      isTeam: true,
    },
    {
      id: 'avg_goals_conceded',
      title: 'Promedio Goles Concedidos',
      icon: 'shield-alert' as const,
      color: '#FD79A8',
      data: [...estadisticasEquipos]
        .sort((a, b) => {
          const avgA = a.partidos_jugados > 0 ? a.goles_en_contra / a.partidos_jugados : 0;
          const avgB = b.partidos_jugados > 0 ? b.goles_en_contra / b.partidos_jugados : 0;
          return avgA - avgB; // Lower is better
        })
        .slice(0, 5)
        .map(e => ({
          ...e,
          promedio_concedidos: e.partidos_jugados > 0
            ? (e.goles_en_contra / e.partidos_jugados).toFixed(2)
            : '0.00'
        })),
      statKey: 'promedio_concedidos',
      isTeam: true,
    },
  ];

  const handlePlayerPress = (playerId: number) => {
    navigation.navigate('PlayerDetail', { playerId });
  };

  const handleTeamPress = (teamId: number) => {
    navigation.navigate('TeamDetail', { equipoId: teamId });
  };

  const handleViewAll = (rankingId: string, rankingTitle: string) => {
    // TODO: Navigate to full ranking screen
    console.log(`View all for ${rankingTitle}`);
  };

  const renderRankingCard = (ranking: any) => {
    return (
      <Card key={ranking.id} style={styles.rankingCard}>
        <View style={[styles.rankingHeader, { backgroundColor: ranking.color }]}>
          <View style={styles.rankingHeaderLeft}>
            <MaterialCommunityIcons name={ranking.icon} size={28} color={colors.white} />
            <Text style={styles.rankingTitle}>{ranking.title}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => handleViewAll(ranking.id, ranking.title)}
          >
            <Text style={styles.viewAllText}>Ver todos</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.rankingList}>
          {ranking.data.map((item: any, index: number) => (
            <TouchableOpacity
              key={ranking.isTeam ? item.id_equipo : item.id_jugador}
              style={styles.rankingItem}
              onPress={() => ranking.isTeam ? handleTeamPress(item.id_equipo) : handlePlayerPress(item.id_jugador)}
              activeOpacity={0.7}
            >
              <View style={styles.rankingPosition}>
                <Text style={[
                  styles.positionText,
                  index === 0 && styles.firstPosition,
                  index === 1 && styles.secondPosition,
                  index === 2 && styles.thirdPosition,
                ]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {ranking.isTeam ? item.nombre : formatPlayerName(item.nombre)}
                </Text>
                <Text style={styles.teamName}>{ranking.isTeam ? item.logo : item.equipo_nombre}</Text>
              </View>
              <Text style={[styles.statValue, { color: ranking.color }]}>
                {item[ranking.statKey]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {rankings.map((ranking) => renderRankingCard(ranking))}
      </View>
    </ScrollView>
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
    backgroundColor: colors.backgroundGray,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    padding: 16,
  },
  rankingCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rankingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  rankingList: {
    paddingVertical: 8,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankingPosition: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  firstPosition: {
    color: '#FFD700',
  },
  secondPosition: {
    color: '#C0C0C0',
  },
  thirdPosition: {
    color: '#CD7F32',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  teamName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.backgroundGray,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  guestButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
