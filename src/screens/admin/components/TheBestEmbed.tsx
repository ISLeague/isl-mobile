import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../api';
import { getLogoUri } from '../../../utils/imageUtils';

interface TheBestEmbedProps {
  navigation: any;
  idEdicionCategoria?: number;
}

export const TheBestEmbed: React.FC<TheBestEmbedProps> = ({ navigation, idEdicionCategoria }) => {
  const { isGuest } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goleadores, setGoleadores] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [mvps, setMvps] = useState<any[]>([]);
  const [tarjetasRojas, setTarjetasRojas] = useState<any[]>([]);
  const [tarjetasAmarillas, setTarjetasAmarillas] = useState<any[]>([]);

  const loadEstadisticas = useCallback(async (isRefreshing = false) => {
    const targetId = idEdicionCategoria || 8;

    try {
      if (!isRefreshing) setLoading(true);
      const response = await api.estadisticas.global(targetId, 5);

      if (response.success && response.data) {
        setGoleadores(response.data.goleadores || []);
        setAsistencias(response.data.asistidores || []);
        setMvps(response.data.mvps || []);
        setTarjetasRojas(response.data.tarjetas_rojas || []);
        setTarjetasAmarillas(response.data.tarjetas_amarillas || []);
      }
    } catch (error) {
      showError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [idEdicionCategoria, showError]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEstadisticas(true);
  };

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
          Debes iniciar sesión para ver las estadísticas y rankings completos
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

  const rankings = [
    {
      id: 'scorers',
      title: 'Máximos Goleadores',
      icon: 'soccer' as const,
      color: '#E31E24',
      badgeColor: '#FFEBEE',
      data: goleadores,
      statKey: 'goles',
    },
    {
      id: 'assists',
      title: 'Máximos Asistidores',
      icon: 'handball' as const,
      color: '#4CAF50',
      badgeColor: '#E8F5E9',
      data: asistencias,
      statKey: 'asistencias',
    },
    {
      id: 'mvps',
      title: 'Líderes MVP',
      icon: 'star' as const,
      color: '#FFC107',
      badgeColor: '#FFF8E1',
      data: mvps,
      statKey: 'mvps',
    },
    {
      id: 'red_cards',
      title: 'Tarjetas Rojas',
      icon: 'card-bulleted' as const,
      color: '#F44336',
      badgeColor: '#FFEBEE',
      data: tarjetasRojas,
      statKey: 'tarjetas_rojas',
    },
    {
      id: 'yellow_cards',
      title: 'Tarjetas Amarillas',
      icon: 'card-bulleted-outline' as const,
      color: '#FFEB3B',
      badgeColor: '#FFFDE7',
      data: tarjetasAmarillas,
      statKey: 'tarjetas_amarillas',
    },
  ];

  const handlePlayerPress = (playerId: number) => {
    navigation.navigate('PlayerDetail', { playerId });
  };

  const handleViewAll = (rankingId: string, rankingTitle: string) => {
    // TODO: Navigate to full ranking screen
  };

  const renderRankingCard = (ranking: any) => {
    return (
      <Card key={ranking.id} style={styles.rankingCard}>
        <View style={styles.rankingHeader}>
          <View style={[styles.headerAccent, { backgroundColor: ranking.color }]} />
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons name={ranking.icon} size={28} color={ranking.color} />
            <Text style={styles.rankingTitleText}>{ranking.title}</Text>
          </View>
        </View>

        <View style={styles.rankingList}>
          {ranking.data
            .filter((item: any) => item && item.id_plantilla)
            .map((item: any, index: number) => {
              const posColor = index === 0 ? '#FFD700' : index === 1 ? '#ADADAD' : index === 2 ? '#CD7F32' : colors.textLight;

              return (
                <TouchableOpacity
                  key={item.id_plantilla}
                  style={[
                    styles.rankingItem,
                    index === ranking.data.length - 1 && styles.lastItem
                  ]}
                  onPress={() => handlePlayerPress(item.id_plantilla)}
                  activeOpacity={0.7}
                >
                  <View style={styles.leftSection}>
                    <View style={styles.positionContainer}>
                      <Text style={[styles.positionText, { color: posColor }]}>{index + 1}</Text>
                    </View>

                    <View style={styles.teamLogoContainer}>
                      <Image
                        source={getLogoUri(item.equipo?.logo) || require('../../../assets/InterLOGO.png')}
                        style={styles.teamLogo}
                      />
                    </View>

                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {item.nombre || 'Jugador'}
                      </Text>
                      <Text style={styles.teamName} numberOfLines={1}>
                        {item.equipo?.nombre || 'Equipo'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statValueContainer, { backgroundColor: ranking.badgeColor }]}>
                    <Text style={[styles.statValueText, { color: ranking.color }]}>
                      {item.estadisticas?.[ranking.statKey] ?? '0'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>
      </Card>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando tabla de honor...</Text>
          </View>
        ) : (
          rankings.map((ranking) => renderRankingCard(ranking))
        )}
      </View>
    </ScrollView>
  );
};

// Necesario importar LinearGradient para el banner
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  loadingContainer: {
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  rankingCard: {
    marginBottom: 24,
    padding: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerAccent: {
    width: 6,
    height: 32,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  rankingTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  rankingList: {
    paddingBottom: 4,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  positionText: {
    fontSize: 18,
    fontWeight: '700',
  },
  teamLogoContainer: {
    marginRight: 12,
  },
  teamLogo: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 2,
  },
  teamName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValueContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueText: {
    fontSize: 22,
    fontWeight: '900',
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
