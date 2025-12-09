import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { mockTopScorers, mockTopAssists, mockLeastConceded, mockJugadores, mockEquipos } from '../../../data/mockData';
import { useAuth } from '../../../contexts/AuthContext';

interface TheBestEmbedProps {
  navigation: any;
}

export const TheBestEmbed: React.FC<TheBestEmbedProps> = ({ navigation }) => {
  const { isGuest } = useAuth();

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
  
  // Convertir los datos mock a la estructura esperada
  const topScorersData = mockTopScorers.map(scorer => {
    const jugador = mockJugadores.find(j => j.id_jugador === scorer.id_jugador);
    return {
      id_jugador: scorer.id_jugador,
      nombre: scorer.nombre,
      equipo_nombre: scorer.equipo,
      goles: scorer.goles,
      jugador,
    };
  });

  const topAssistsData = mockTopAssists.map(assist => {
    const jugador = mockJugadores.find(j => j.id_jugador === assist.id_jugador);
    return {
      id_jugador: assist.id_jugador,
      nombre: assist.nombre,
      equipo_nombre: assist.equipo,
      asistencias: assist.asistencias,
      jugador,
    };
  });

  const leastConcededData = mockLeastConceded.map(team => {
    const equipo = mockEquipos.find(e => e.id_equipo === team.id_equipo);
    return {
      id_equipo: team.id_equipo,
      nombre: team.nombre,
      logo: team.logo,
      goles_en_contra: team.goles_en_contra,
      equipo,
    };
  });

  const rankings = [
    {
      id: 'scorers',
      title: 'Goleadores',
      icon: 'soccer' as const,
      color: '#FF6B6B',
      data: topScorersData.slice(0, 5),
      statKey: 'goles',
      isTeam: false,
    },
    {
      id: 'assists',
      title: 'Asistencias',
      icon: 'account-arrow-right' as const,
      color: '#4ECDC4',
      data: topAssistsData.slice(0, 5),
      statKey: 'asistencias',
      isTeam: false,
    },
    {
      id: 'goalkeepers',
      title: 'Menos Goleados',
      icon: 'shield-check' as const,
      color: '#95E1D3',
      data: leastConcededData.slice(0, 5),
      statKey: 'goles_en_contra',
      isTeam: true,
    },
    {
      id: 'yellow_cards',
      title: 'Tarjetas Amarillas',
      icon: 'card' as const,
      color: '#FFD93D',
      data: topScorersData.slice(0, 5).map((s, i) => ({ ...s, tarjetas_amarillas: 8 - i })),
      statKey: 'tarjetas_amarillas',
      isTeam: false,
    },
    {
      id: 'red_cards',
      title: 'Tarjetas Rojas',
      icon: 'card' as const,
      color: '#FF5757',
      data: topScorersData.slice(0, 5).map((s, i) => ({ ...s, tarjetas_rojas: 3 - i })),
      statKey: 'tarjetas_rojas',
      isTeam: false,
    },
    {
      id: 'win_percentage',
      title: '% Partidos Ganados',
      icon: 'trophy' as const,
      color: '#F9CA24',
      data: mockEquipos.slice(0, 5).map((e, i) => ({ 
        ...e, 
        porcentaje_victorias: (85 - i * 10).toFixed(1) 
      })),
      statKey: 'porcentaje_victorias',
      isTeam: true,
    },
    {
      id: 'loss_percentage',
      title: '% Partidos Perdidos',
      icon: 'thumb-down' as const,
      color: '#EE5A6F',
      data: mockEquipos.slice(0, 5).map((e, i) => ({ 
        ...e, 
        porcentaje_derrotas: (10 + i * 5).toFixed(1) 
      })),
      statKey: 'porcentaje_derrotas',
      isTeam: true,
    },
    {
      id: 'avg_goals_scored',
      title: 'Promedio Goles por Partido',
      icon: 'soccer' as const,
      color: '#6C5CE7',
      data: mockEquipos.slice(0, 5).map((e, i) => ({ 
        ...e, 
        promedio_goles: (3.5 - i * 0.3).toFixed(2) 
      })),
      statKey: 'promedio_goles',
      isTeam: true,
    },
    {
      id: 'avg_goals_conceded',
      title: 'Promedio Goles Concedidos',
      icon: 'shield-alert' as const,
      color: '#FD79A8',
      data: mockEquipos.slice(0, 5).map((e, i) => ({ 
        ...e, 
        promedio_concedidos: (0.8 + i * 0.2).toFixed(2) 
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
