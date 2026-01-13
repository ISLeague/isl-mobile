import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GradientHeader, Card } from '../../components/common';
import { colors } from '../../theme/colors';
import { formatDate, calculateAge } from '../../utils';
import { JugadorDetalleData } from '../../api/types/jugadores.types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import api from '../../api';
import { getLogoUri } from '../../utils/imageUtils';

type Props = NativeStackScreenProps<any, 'PlayerDetail'>;

export const PlayerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { showError } = useToast();

  // Log all route params to debug
  console.log('🔍 [PlayerDetail] route.params:', route.params);
  console.log('🔍 [PlayerDetail] All keys in route.params:', route.params ? Object.keys(route.params) : 'No params');

  const { playerId } = route.params as { playerId: number };

  console.log('🔍 [PlayerDetail] Extracted playerId:', playerId);
  console.log('🔍 [PlayerDetail] playerId type:', typeof playerId);

  const [loading, setLoading] = useState(true);
  const [detalleData, setDetalleData] = useState<JugadorDetalleData | null>(null);

  useEffect(() => {
    const loadJugadorDetalle = async () => {
      console.log('🔍 [PlayerDetail] About to call API with playerId:', playerId);

      const result = await safeAsync(
        async () => {
          console.log('🔍 [PlayerDetail] Calling api.jugadores.detalle with id:', playerId);
          const response = await api.jugadores.detalle(playerId);
          console.log('🔍 [PlayerDetail] API response:', response);
          return response;
        },
        'PlayerDetailScreen - loadJugadorDetalle',
        {
          fallbackValue: null,
          onError: (error) => {
            console.error('❌ [PlayerDetail] Error loading player:', error);
            showError('No se pudo cargar la información del jugador', 'Error');
          }
        }
      );

      if (result && result.success) {
        setDetalleData(result.data);
      }
      setLoading(false);
    };

    loadJugadorDetalle();
  }, [playerId]);

  // Formatear nombre según el rol del usuario
  const formatPlayerName = (nombreCompleto: string) => {
    if (isAdmin) {
      return nombreCompleto; // Admin ve nombre completo
    }

    // Fan: mostrar "Nombre A." (primera letra del apellido)
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length === 1) {
      return partes[0]; // Si solo hay una palabra, mostrarla completa
    }

    const nombre = partes[0];
    const apellidoInicial = partes[partes.length - 1].charAt(0).toUpperCase();
    return `${nombre} ${apellidoInicial}.`;
  };

  const renderStatItem = (
    icon: string,
    label: string,
    value: number,
    color: string
  ) => (
    <View style={styles.statItem}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading || !detalleData) {
    return (
      <View style={styles.container}>
        <GradientHeader title="Detalle del Jugador" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando información del jugador...</Text>
        </View>
      </View>
    );
  }

  const { equipo, estadisticas_historicas } = detalleData;
  const edad = detalleData.edad || calculateAge(detalleData.fecha_nacimiento);
  const esRefuerzo = detalleData.es_refuerzo || false;
  const esCapitan = detalleData.es_capitan || false;
  const esGoleador = estadisticas_historicas?.es_goleador || false;
  const esMejorJugador = estadisticas_historicas?.es_mejor_jugador || false;

  return (
    <View style={styles.container}>
      <GradientHeader title="Detalle del Jugador" onBackPress={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Datos básicos */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.imageWrapper}>
              {detalleData.foto ? (
                <Image
                  source={{ uri: detalleData.foto }}
                  style={styles.playerPhotoLarge}
                />
              ) : (
                <View style={styles.playerPhotoPlaceholder}>
                  <MaterialCommunityIcons name="account" size={48} color={colors.textLight} />
                </View>
              )}
              {esCapitan && (
                <View style={styles.capitanBadge}>
                  <Text style={styles.capitanText}>C</Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.numberRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{detalleData.numero_camiseta != null ? `#${detalleData.numero_camiseta}` : 'X'}</Text>
                </View>
                <View style={styles.badgesRow}>
                  {esRefuerzo && (
                    <View style={[styles.badge, styles.refuerzoBadge]}>
                      <Text style={styles.badgeText}>R</Text>
                    </View>
                  )}
                  {esGoleador && (
                    <View style={[styles.badge, styles.goleadorBadge]}>
                      <MaterialCommunityIcons name="soccer" size={14} color={colors.white} />
                    </View>
                  )}
                  {esMejorJugador && (
                    <View style={[styles.badge, styles.mvpBadge]}>
                      <MaterialCommunityIcons name="trophy" size={14} color={colors.white} />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.nameRow}>
                <Text style={styles.playerName}>{formatPlayerName(detalleData.nombre_completo)}</Text>
              </View>

              {/* Mostrar edad solo para admin */}
              {(isAdmin || isSuperAdmin) && (
                <Text style={styles.playerAge}>{edad} años • {formatDate(detalleData.fecha_nacimiento)}</Text>
              )}

              {/* Mostrar DNI solo para superadmin */}
              {isSuperAdmin && (
                <Text style={styles.playerDNI}>DNI: {detalleData.dni}</Text>
              )}

              {/* Mostrar pie dominante solo para admin */}
              {(isAdmin || isSuperAdmin) && detalleData.pie_dominante && (
                <Text style={styles.playerDetail}>Pie dominante: {detalleData.pie_dominante}</Text>
              )}

              {/* Removed: Weight, Height, Nationality, Position text */}

              <View style={styles.teamContainer}>
                <Image
                  source={getLogoUri(equipo.logo || undefined) || require('../../assets/InterLOGO.png')}
                  style={styles.teamLogo}
                />
                <Text style={styles.teamName}>{equipo.nombre}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Bloque 1: Rendimiento en la Temporada */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Rendimiento Temporada</Text>
          <View style={styles.statsGrid}>
            {renderStatItem('run', 'Partidos', estadisticas_historicas?.partidos_jugados || 0, colors.primary)}
            {renderStatItem('soccer', 'Goles', estadisticas_historicas?.goles_totales || 0, colors.success)}
            {renderStatItem('handball', 'Asistencias', estadisticas_historicas?.asistencias_totales || 0, '#00BCD4')}
            {renderStatItem('star', 'MVP', estadisticas_historicas?.mvp_partidos || 0, '#FFD700')}
          </View>
        </Card>

        {/* Bloque 2: Disciplina */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Disciplina</Text>
          <View style={styles.statsGrid}>
            {renderStatItem('card', 'Amarillas', estadisticas_historicas?.amarillas_totales || 0, colors.warning)}
            {renderStatItem('card-multiple', 'Dobles Am.', estadisticas_historicas?.dobles_amarillas || 0, '#FF9800')}
            {renderStatItem('card', 'Rojas', estadisticas_historicas?.rojas_totales || 0, colors.error)}
          </View>
        </Card>

      </ScrollView>
    </View>
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
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileCard: {
    margin: 16,
    marginBottom: 12,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  numberBadge: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  numberText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  playerPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  badge: {
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refuerzoBadge: {
    backgroundColor: '#FFC107',
  },
  goleadorBadge: {
    backgroundColor: '#4CAF50',
  },
  mvpBadge: {
    backgroundColor: '#FFD700',
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  capitanBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  capitanText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  playerAge: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  playerDNI: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  playerDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  playerPhotoLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  playerPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
});
