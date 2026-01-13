import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, GradientHeader } from '../../components/common';
import { colors } from '../../theme/colors';
import api from '../../api';

interface MatchDetailScreenProps {
  navigation: any;
  route: any;
}

export const MatchDetailScreen: React.FC<MatchDetailScreenProps> = ({ navigation, route }) => {
  const { partidoId } = route.params;
  const [partido, setPartido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localDetails, setLocalDetails] = useState<any>(null);
  const [canchaDetails, setCanchaDetails] = useState<any>(null);

  // Formatear nombre: mostrar "Nombre A." (primera letra del apellido)
  const formatPlayerName = (nombreCompleto: string) => {
    if (!nombreCompleto) return '';
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length === 1) {
      return partes[0]; // Si solo hay una palabra, mostrarla completa
    }

    const nombre = partes[0];
    const apellidoInicial = partes[partes.length - 1].charAt(0).toUpperCase();
    return `${nombre} ${apellidoInicial}.`;
  };

  useEffect(() => {
    fetchMatchDetail();
  }, [partidoId]);

  const fetchMatchDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.partidos.getResultado(partidoId, false);

      if (response) {
        setPartido(response);
      } else {
        setError('No se pudo encontrar la información del partido');
      }
    } catch (err) {
      console.error('[MatchDetailScreen] Error fetching match detail:', err);
      setError('Error al cargar los detalles del partido');
    } finally {
      setLoading(false);
    }
  };

  // Extraer datos del objeto de respuesta consolidado (permitir valores undefined mientras carga)
  const matchInfo = partido?.data?.partido;
  const resultInfo = partido?.data?.resultado;
  const equipoLocal = partido?.data?.equipo_local;
  const equipoVisitante = partido?.data?.equipo_visitante;
  const cancha = partido?.data?.cancha;

  // Fetch local details to get estadio
  useEffect(() => {
    const fetchLocalDetails = async () => {
      try {
        // 1) Si ya viene el id_local en la cancha
        if (cancha?.id_local) {
          const respLocal = await api.locales.get(cancha.id_local);
          setLocalDetails(respLocal.data);
          return;
        }

        // 2) Si no viene, intentar obtener la cancha completa para sacar id_local
        if (!canchaDetails && cancha?.id_cancha) {
          const respCancha = await api.canchas.get(cancha.id_cancha);
          setCanchaDetails(respCancha.data);
          if (respCancha.data?.id_local) {
            const respLocal = await api.locales.get(respCancha.data.id_local);
            setLocalDetails(respLocal.data);
          }
          return;
        }

        // 3) Si ya tenemos canchaDetails y tiene id_local
        if (canchaDetails?.id_local) {
          const respLocal = await api.locales.get(canchaDetails.id_local);
          setLocalDetails(respLocal.data);
        }
      } catch (error) {
        console.log('Error fetching local details:', error);
      }
    };

    fetchLocalDetails();
  }, [cancha?.id_local, cancha?.id_cancha, canchaDetails?.id_local]);

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientHeader title="Detalles del Partido" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </View>
    );
  }

  if (error || !partido) {
    return (
      <View style={styles.container}>
        <GradientHeader title="Detalles del Partido" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.loadingText}>{error || 'Partido no encontrado'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchMatchDetail}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const goToTeamDetail = (equipoId: number) => {
    navigation.navigate('TeamDetail', { equipoId });
  };

  const renderResultado = () => {
    // Add null checks to prevent undefined errors
    if (!resultInfo || !matchInfo || !equipoLocal || !equipoVisitante) {
      return (
        <Card style={styles.resultCard}>
          <Text style={styles.loadingText}>Información del partido no disponible</Text>
        </Card>
      );
    }

    // Additional null check for estado property
    if (!matchInfo.estado) {
      return (
        <Card style={styles.resultCard}>
          <Text style={styles.loadingText}>Estado del partido no disponible</Text>
        </Card>
      );
    }

    const isEmpate = resultInfo.marcador_local === resultInfo.marcador_visitante && matchInfo.estado === 'Finalizado';
    const hayPenales = resultInfo.fue_a_penales;
    const ganador = resultInfo.ganador;

    return (
      <Card style={styles.resultCard}>
        {/* Header con estado */}
        <View style={styles.estadoContainer}>
          <View style={[
            styles.estadoBadge,
            matchInfo.estado === 'Finalizado' ? styles.estadoFinalizado :
              matchInfo.estado === 'En curso' ? styles.estadoEnCurso :
                styles.estadoPendiente
          ]}>
            <Text style={styles.estadoText}>{matchInfo.estado}</Text>
          </View>
          {matchInfo.fecha && (
            <Text style={styles.fechaText}>
              {matchInfo.fecha.split('-').reverse().join('/')}
              {matchInfo.hora && ` • ${matchInfo.hora}`}
            </Text>
          )}
        </View>

        {/* Equipos y Marcador */}
        <View style={styles.matchupContainer}>
          {/* Equipo Local */}
          <TouchableOpacity
            style={styles.teamContainer}
            onPress={() => goToTeamDetail(equipoLocal.id_equipo)}
            activeOpacity={0.7}
          >
            <Image
              source={equipoLocal.logo ? { uri: equipoLocal.logo } : require('../../assets/InterLOGO.png')}
              style={styles.teamLogo}
              resizeMode="cover"
            />
            <Text style={styles.teamName} numberOfLines={2}>
              {equipoLocal.nombre || 'Equipo Local'}
            </Text>
          </TouchableOpacity>

          {/* Marcador */}
          <View style={styles.scoreContainer}>
            {matchInfo.estado === 'Finalizado' ? (
              <>
                <View style={styles.scoreBox}>
                  <Text style={[
                    ganador === 'local' ? styles.scoreTextGanador : styles.scoreTextPerdedor
                  ]}>
                    {resultInfo.marcador_local}
                  </Text>
                  <Text style={styles.vsTextNegro}>-</Text>
                  <Text style={[
                    ganador === 'visitante' ? styles.scoreTextGanador : styles.scoreTextPerdedor
                  ]}>
                    {resultInfo.marcador_visitante}
                  </Text>
                </View>
                {hayPenales && (
                  <View style={styles.penalesBox}>
                    <Text style={styles.penalesLabel}>Penales</Text>
                    <Text style={styles.penalesText}>
                      ({resultInfo.penales_local} - {resultInfo.penales_visitante})
                    </Text>
                  </View>
                )}
                {isEmpate && !hayPenales && (
                  <Text style={styles.empateText}>Empate</Text>
                )}
                {resultInfo.walkover && (
                  <Text style={[styles.empateText, { color: colors.error }]}>WO - {resultInfo.walkover_motivo || 'No presentado'}</Text>
                )}
              </>
            ) : (
              <Text style={styles.vsText}>vs</Text>
            )}
          </View>

          {/* Equipo Visitante */}
          <TouchableOpacity
            style={styles.teamContainer}
            onPress={() => goToTeamDetail(equipoVisitante.id_equipo)}
            activeOpacity={0.7}
          >
            <Image
              source={equipoVisitante.logo ? { uri: equipoVisitante.logo } : require('../../assets/InterLOGO.png')}
              style={styles.teamLogo}
              resizeMode="cover"
            />
            <Text style={styles.teamName} numberOfLines={2}>
              {equipoVisitante.nombre || 'Equipo Visitante'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información de Cancha */}
        {cancha && (
          <View style={styles.canchaDestacada}>
            <MaterialCommunityIcons name="stadium" size={24} color={colors.primary} />
            <View style={styles.canchaInfo}>
              <Text style={styles.canchaNombre}>
                {localDetails?.nombre || 'Local'}
              </Text>
              <Text style={styles.canchaLocal}>{cancha?.nombre || 'Cancha no disponible'}</Text>
            </View>
          </View>
        )}
      </Card>
    );
  };

  const renderTablaJugadores = (jugadores: any[], equipo: any) => {
    const statsJugadoresConAccion = (jugadores || []).filter(j =>
      (j.goles || 0) > 0 || (j.asistencias || 0) > 0 || (j.tarjetas_amarillas || 0) > 0 || (j.tarjetas_rojas || 0) > 0 || j.es_mvp
    );

    if (statsJugadoresConAccion.length === 0) return null;

    return (
      <View style={styles.statsTeamContainer}>
        <View style={styles.statsTeamHeader}>
          <Image
            source={equipo?.logo ? { uri: equipo.logo } : require('../../assets/InterLOGO.png')}
            style={styles.statsTeamLogo}
            resizeMode="cover"
          />
          <Text style={styles.statsTeamTitle}>{equipo?.nombre || 'Equipo'}</Text>
        </View>

        <View style={styles.statsTableHeader}>
          <Text style={[styles.statsHeaderCell, styles.statsNombreCell]}>Jugador</Text>
          <Text style={styles.statsHeaderCell}>G</Text>
          <Text style={styles.statsHeaderCell}>A</Text>
          <Text style={styles.statsHeaderCell}>YC</Text>
          <Text style={styles.statsHeaderCell}>RC</Text>
          <Text style={styles.statsHeaderCell}>MVP</Text>
        </View>

        {statsJugadoresConAccion.map((jugador, index) => (
          <View key={index} style={styles.statsTableRow}>
            <Text style={[styles.statsCell, styles.statsNombreCell]}>
              {formatPlayerName(jugador.nombre)}
            </Text>
            <Text style={styles.statsCell}>{jugador.goles || '-'}</Text>
            <Text style={styles.statsCell}>{jugador.asistencias || '-'}</Text>
            <View style={styles.statsCell}>
              {(jugador.tarjetas_amarillas || 0) > 0 ? (
                <View style={styles.tarjetasContainer}>
                  {[...Array(jugador.tarjetas_amarillas || 0)].map((_, i) => (
                    <View key={i} style={styles.tarjetaAmarilla} />
                  ))}
                </View>
              ) : (
                <Text style={styles.statsCellText}>-</Text>
              )}
            </View>
            <View style={styles.statsCell}>
              {(jugador.tarjetas_rojas || 0) > 0 ? (
                <View style={styles.tarjetasContainer}>
                  {[...Array(jugador.tarjetas_rojas || 0)].map((_, i) => (
                    <View key={i} style={styles.tarjetaRoja} />
                  ))}
                </View>
              ) : (
                <Text style={styles.statsCellText}>-</Text>
              )}
            </View>
            <Text style={styles.statsCell}>{jugador.es_mvp ? '⭐' : '-'}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderEstadisticasJugadores = () => {
    const jugadoresLocal = equipoLocal.estadisticas_jugadores || [];
    const jugadoresVisitante = equipoVisitante.estadisticas_jugadores || [];

    const tieneStats = jugadoresLocal.some((j: any) => j.goles > 0 || j.asistencias > 0 || j.tarjetas_amarillas > 0 || j.tarjetas_rojas > 0 || j.es_mvp) ||
      jugadoresVisitante.some((j: any) => j.goles > 0 || j.asistencias > 0 || j.tarjetas_amarillas > 0 || j.tarjetas_rojas > 0 || j.es_mvp);

    if (!tieneStats) {
      return (
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <Text style={styles.noStatsText}>No hay estadísticas de jugadores disponibles</Text>
        </Card>
      );
    }

    return (
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        {renderTablaJugadores(jugadoresLocal, equipoLocal)}
        {jugadoresLocal.length > 0 && jugadoresVisitante.length > 0 && (
          <View style={styles.statsDivider} />
        )}
        {renderTablaJugadores(jugadoresVisitante, equipoVisitante)}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader title="Detalles del Partido" onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderResultado()}
        {matchInfo.estado === 'Finalizado' && renderEstadisticasJugadores()}
        {matchInfo.estado === 'Pendiente' && (
          <Card style={styles.infoCard}>
            <MaterialCommunityIcons name="calendar-clock" size={48} color={colors.primary} />
            <Text style={styles.infoCardTitle}>Partido Próximo</Text>
            <Text style={styles.infoCardText}>
              Este partido aún no se ha jugado. Vuelve el {matchInfo.fecha ? matchInfo.fecha.split('-').reverse().join('/') : ''} para ver los resultados.
            </Text>
          </Card>
        )}
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
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  resultCard: {
    padding: 20,
    marginBottom: 16,
  },
  estadoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  estadoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  estadoFinalizado: {
    backgroundColor: colors.success,
  },
  estadoEnCurso: {
    backgroundColor: colors.warning,
  },
  estadoPendiente: {
    backgroundColor: colors.info,
  },
  estadoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fechaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  matchupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  teamLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    minWidth: 100,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreTextGanador: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scoreTextPerdedor: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vsText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vsTextNegro: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 12,
  },
  penalesBox: {
    marginTop: 8,
    alignItems: 'center',
  },
  penalesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  penalesText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  empateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  canchaDestacada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  canchaInfo: {
    flex: 1,
  },
  canchaNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  canchaLocal: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  noStatsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsTeamContainer: {
    marginBottom: 20,
  },
  statsTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTeamLogo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
  },
  statsTeamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statsTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  statsHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  statsNombreCell: {
    flex: 2,
  },
  statsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
  statsCell: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  statsCellText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tarjetasContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  tarjetaAmarilla: {
    width: 8,
    height: 12,
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
  tarjetaRoja: {
    width: 8,
    height: 12,
    backgroundColor: colors.error,
    borderRadius: 2,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  infoCard: {
    padding: 20,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
