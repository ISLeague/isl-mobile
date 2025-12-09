import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, GradientHeader } from '../../components/common';
import { colors } from '../../theme/colors';
import { Partido, EventoPartido, Jugador } from '../../types';
import { mockPartidos, mockEquipos, mockEventos, mockJugadores, mockCanchas, mockLocales, mockPlantillas } from '../../data/mockData';

interface MatchDetailScreenProps {
  navigation: any;
  route: any;
}

export const MatchDetailScreen: React.FC<MatchDetailScreenProps> = ({ navigation, route }) => {
  const { partidoId } = route.params;
  const [partido, setPartido] = useState<Partido | null>(null);
  const [eventos, setEventos] = useState<(EventoPartido & { jugador?: Jugador })[]>([]);

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

  useEffect(() => {
    // Buscar el partido
    const foundPartido = mockPartidos.find(p => p.id_partido === partidoId);
    if (foundPartido) {
      // Agregar información de equipos
      const equipoLocal = mockEquipos.find(e => e.id_equipo === foundPartido.id_equipo_local);
      const equipoVisitante = mockEquipos.find(e => e.id_equipo === foundPartido.id_equipo_visitante);
      const cancha = mockCanchas.find(c => c.id_cancha === foundPartido.id_cancha);
      const local = cancha ? mockLocales.find(l => l.id_local === cancha.id_local) : undefined;

      setPartido({
        ...foundPartido,
        equipo_local: equipoLocal,
        equipo_visitante: equipoVisitante,
        cancha: { ...cancha, local } as any,
      });

      // Buscar eventos del partido
      const partidoEventos = mockEventos
        .filter(e => e.id_partido === partidoId)
        .map(e => ({
          ...e,
          jugador: mockJugadores.find(j => j.id_jugador === e.id_jugador),
        }))
        .sort((a, b) => a.minuto - b.minuto);

      setEventos(partidoEventos);
    }
  }, [partidoId]);

  if (!partido || !partido.equipo_local || !partido.equipo_visitante) {
    return (
      <View style={styles.container}>
        <GradientHeader title="Detalles del Partido" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  const goToTeamDetail = (equipoId: number) => {
    navigation.navigate('TeamDetail', { equipoId });
  };

  const renderResultado = () => {
    const isEmpate = partido.marcador_local === partido.marcador_visitante && partido.estado_partido === 'Finalizado';
    const hayPenales = partido.penales_local !== undefined && partido.penales_visitante !== undefined;
    
    // Determinar ganador
    let ganadorId: number | null = null;
    if (partido.estado_partido === 'Finalizado') {
      if (hayPenales) {
        ganadorId = (partido.penales_local ?? 0) > (partido.penales_visitante ?? 0) 
          ? partido.id_equipo_local 
          : (partido.penales_local ?? 0) < (partido.penales_visitante ?? 0)
          ? partido.id_equipo_visitante
          : null;
      } else if (!isEmpate) {
        ganadorId = (partido.marcador_local ?? 0) > (partido.marcador_visitante ?? 0)
          ? partido.id_equipo_local
          : partido.id_equipo_visitante;
      }
    }

    return (
      <Card style={styles.resultCard}>
        {/* Header con estado */}
        <View style={styles.estadoContainer}>
          <View style={[
            styles.estadoBadge,
            partido.estado_partido === 'Finalizado' ? styles.estadoFinalizado :
            partido.estado_partido === 'En curso' ? styles.estadoEnCurso :
            styles.estadoPendiente
          ]}>
            <Text style={styles.estadoText}>{partido.estado_partido}</Text>
          </View>
          {partido.fecha && (
            <Text style={styles.fechaText}>
              {partido.fecha.split('-').reverse().join('/')}
              {partido.hora && ` • ${partido.hora}`}
            </Text>
          )}
        </View>

        {/* Equipos y Marcador */}
        <View style={styles.matchupContainer}>
          {/* Equipo Local */}
          <TouchableOpacity 
            style={styles.teamContainer}
            onPress={() => goToTeamDetail(partido.equipo_local!.id_equipo)}
            activeOpacity={0.7}
          >
            <Image
              source={partido.equipo_local?.logo ? { uri: partido.equipo_local.logo } : require('../../assets/InterLOGO.png')}
              style={styles.teamLogo}
              resizeMode="cover"
            />
            <Text style={styles.teamName} numberOfLines={2}>
              {partido.equipo_local?.nombre}
            </Text>
          </TouchableOpacity>

          {/* Marcador */}
          <View style={styles.scoreContainer}>
            {partido.estado_partido === 'Finalizado' ? (
              <>
                <View style={styles.scoreBox}>
                  <Text style={[
                    ganadorId === partido.id_equipo_local ? styles.scoreTextGanador : styles.scoreTextPerdedor
                  ]}>
                    {partido.marcador_local}
                  </Text>
                  <Text style={styles.vsTextNegro}>-</Text>
                  <Text style={[
                    ganadorId === partido.id_equipo_visitante ? styles.scoreTextGanador : styles.scoreTextPerdedor
                  ]}>
                    {partido.marcador_visitante}
                  </Text>
                </View>
                {hayPenales && (
                  <View style={styles.penalesBox}>
                    <Text style={styles.penalesLabel}>Penales</Text>
                    <Text style={styles.penalesText}>
                      ({partido.penales_local} - {partido.penales_visitante})
                    </Text>
                  </View>
                )}
                {isEmpate && !hayPenales && (
                  <Text style={styles.empateText}>Empate</Text>
                )}
              </>
            ) : (
              <Text style={styles.vsText}>vs</Text>
            )}
          </View>

          {/* Equipo Visitante */}
          <TouchableOpacity 
            style={styles.teamContainer}
            onPress={() => goToTeamDetail(partido.equipo_visitante!.id_equipo)}
            activeOpacity={0.7}
          >
            <Image
              source={partido.equipo_visitante?.logo ? { uri: partido.equipo_visitante.logo } : require('../../assets/InterLOGO.png')}
              style={styles.teamLogo}
              resizeMode="cover"
            />
            <Text style={styles.teamName} numberOfLines={2}>
              {partido.equipo_visitante?.nombre}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información de Cancha - DESTACADA */}
        {partido.cancha && (
          <View style={styles.canchaDestacada}>
            <MaterialCommunityIcons name="stadium" size={24} color={colors.primary} />
            <View style={styles.canchaInfo}>
              <Text style={styles.canchaNombre}>{partido.cancha.nombre}</Text>
              {partido.cancha.local && (
                <Text style={styles.canchaLocal}>{partido.cancha.local.nombre}</Text>
              )}
            </View>
          </View>
        )}
      </Card>
    );
  };

  const renderEvento = (evento: EventoPartido & { jugador?: Jugador }, index: number) => {
    const getEventoIcon = () => {
      switch (evento.tipo_evento) {
        case 'gol': return 'soccer';
        case 'amarilla': return 'card';
        case 'roja': return 'card';
        case 'asistencia': return 'shoe-cleat';
        case 'cambio': return 'swap-horizontal';
        default: return 'information';
      }
    };

    const getEventoColor = () => {
      switch (evento.tipo_evento) {
        case 'gol': return colors.success;
        case 'amarilla': return '#FFD700';
        case 'roja': return colors.error;
        case 'asistencia': return colors.info;
        default: return colors.textSecondary;
      }
    };

    return (
      <View key={index} style={styles.eventoItem}>
        <View style={styles.eventoMinuto}>
          <Text style={styles.eventoMinutoText}>{evento.minuto}'</Text>
        </View>
        <View style={[styles.eventoIconContainer, { backgroundColor: getEventoColor() }]}>
          <MaterialCommunityIcons name={getEventoIcon()} size={18} color={colors.white} />
        </View>
        <View style={styles.eventoInfo}>
          <Text style={styles.eventoTipo}>
            {evento.tipo_evento === 'gol' && '⚽ Gol'}
            {evento.tipo_evento === 'amarilla' && '🟨 Tarjeta Amarilla'}
            {evento.tipo_evento === 'roja' && '🟥 Tarjeta Roja'}
            {evento.tipo_evento === 'asistencia' && '👟 Asistencia'}
            {evento.tipo_evento === 'cambio' && '🔄 Cambio'}
          </Text>
          {evento.jugador && (
            <Text style={styles.eventoJugador}>{evento.jugador.nombre_completo}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderEstadisticasJugadores = () => {
    if (eventos.length === 0) {
      return (
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <Text style={styles.noStatsText}>No hay estadísticas de jugadores disponibles</Text>
        </Card>
      );
    }

    // Agrupar eventos por jugador
    const jugadoresStats = eventos.reduce((acc: any[], evento) => {
      const jugador = mockJugadores.find(j => j.id_jugador === evento.id_jugador);
      if (!jugador) return acc;
      
      // Buscar el equipo del jugador a través de plantillas
      const plantilla = mockPlantillas.find(p => p.id_jugador === jugador.id_jugador && p.activo_en_equipo);
      if (!plantilla) return acc;
      
      let jugadorStats = acc.find(j => j.id_jugador === jugador.id_jugador);
      if (!jugadorStats) {
        jugadorStats = {
          id_jugador: jugador.id_jugador,
          id_equipo: plantilla.id_equipo,
          nombre: jugador.nombre_completo,
          G: 0,
          A: 0,
          YC: 0,
          RC: 0,
          MVP: false,
        };
        acc.push(jugadorStats);
      }
      
      if (evento.tipo_evento === 'gol') jugadorStats.G++;
      if (evento.tipo_evento === 'asistencia') jugadorStats.A++;
      if (evento.tipo_evento === 'amarilla') jugadorStats.YC++;
      if (evento.tipo_evento === 'roja') jugadorStats.RC++;
      
      return acc;
    }, []);

    // Separar por equipo usando id_equipo del jugador
    const jugadoresLocal = jugadoresStats.filter(j => j.id_equipo === partido.id_equipo_local);
    const jugadoresVisitante = jugadoresStats.filter(j => j.id_equipo === partido.id_equipo_visitante);

    // Marcar MVP al jugador con más goles en todo el partido
    if (jugadoresStats.length > 0) {
      const mvp = jugadoresStats.reduce((max, j) => (j.G > max.G ? j : max));
      if (mvp.G > 0) mvp.MVP = true;
    }

    const renderTablaJugadores = (jugadores: any[], equipo: any) => {
      if (jugadores.length === 0) return null;

      return (
        <View style={styles.statsTeamContainer}>
          {/* Header con logo y nombre del equipo */}
          <View style={styles.statsTeamHeader}>
            <Image
              source={equipo?.logo ? { uri: equipo.logo } : require('../../assets/InterLOGO.png')}
              style={styles.statsTeamLogo}
              resizeMode="cover"
            />
            <Text style={styles.statsTeamTitle}>{equipo?.nombre || 'Equipo'}</Text>
          </View>
          
          {/* Header de tabla */}
          <View style={styles.statsTableHeader}>
            <Text style={[styles.statsHeaderCell, styles.statsNombreCell]}>Jugador</Text>
            <Text style={styles.statsHeaderCell}>G</Text>
            <Text style={styles.statsHeaderCell}>A</Text>
            <Text style={styles.statsHeaderCell}>YC</Text>
            <Text style={styles.statsHeaderCell}>RC</Text>
            <Text style={styles.statsHeaderCell}>MVP</Text>
          </View>

          {/* Filas de jugadores */}
          {jugadores.map((jugador, index) => (
            <View key={index} style={styles.statsTableRow}>
              <Text style={[styles.statsCell, styles.statsNombreCell]}>
                {formatPlayerName(jugador.nombre)}
              </Text>
              <Text style={styles.statsCell}>{jugador.G || '-'}</Text>
              <Text style={styles.statsCell}>{jugador.A || '-'}</Text>
              <View style={styles.statsCell}>
                {jugador.YC > 0 ? (
                  <View style={styles.tarjetasContainer}>
                    {[...Array(jugador.YC)].map((_, i) => (
                      <View key={i} style={styles.tarjetaAmarilla} />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.statsCellText}>-</Text>
                )}
              </View>
              <View style={styles.statsCell}>
                {jugador.RC > 0 ? (
                  <View style={styles.tarjetasContainer}>
                    {[...Array(jugador.RC)].map((_, i) => (
                      <View key={i} style={styles.tarjetaRoja} />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.statsCellText}>-</Text>
                )}
              </View>
              <Text style={styles.statsCell}>{jugador.MVP ? '⭐' : '-'}</Text>
            </View>
          ))}
        </View>
      );
    };

    return (
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        
        {renderTablaJugadores(jugadoresLocal, partido.equipo_local)}
        
        {jugadoresLocal.length > 0 && jugadoresVisitante.length > 0 && (
          <View style={styles.statsDivider} />
        )}
        
        {renderTablaJugadores(jugadoresVisitante, partido.equipo_visitante)}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader title="Detalles del Partido" onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderResultado()}

        {partido.estado_partido === 'Finalizado' && eventos.length > 0 && (
          <>
            {renderEstadisticasJugadores()}
          </>
        )}

        {partido.estado_partido === 'Pendiente' && (
          <Card style={styles.infoCard}>
            <MaterialCommunityIcons name="calendar-clock" size={48} color={colors.primary} />
            <Text style={styles.infoCardTitle}>Partido Próximo</Text>
            <Text style={styles.infoCardText}>
              Este partido aún no se ha jugado. Vuelve después del {new Date(partido.fecha).toLocaleDateString('es-ES')} para ver los resultados.
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
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    paddingHorizontal: 20,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
  },
  scoreTextNegro: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scoreTextGanador: {
    fontSize: 48,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scoreTextPerdedor: {
    fontSize: 48,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vsText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 12,
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
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoText: {
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    width: 60,
    textAlign: 'center',
  },
  eventosCard: {
    padding: 20,
    marginBottom: 16,
  },
  eventoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventoMinuto: {
    width: 45,
    alignItems: 'center',
  },
  eventoMinutoText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eventoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventoInfo: {
    flex: 1,
  },
  eventoTipo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  eventoJugador: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoCard: {
    padding: 32,
    alignItems: 'center',
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
  canchaDestacada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 12,
  },
  canchaInfo: {
    flex: 1,
  },
  canchaNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  canchaLocal: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsTeamContainer: {
    marginBottom: 20,
  },
  statsTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statsTeamLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  statsTeamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statsTableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    marginBottom: 4,
  },
  statsHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    width: 40,
  },
  statsNombreCell: {
    flex: 1,
    textAlign: 'left',
    width: 'auto',
  },
  statsTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsCell: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tarjetasContainer: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaAmarilla: {
    width: 8,
    height: 12,
    backgroundColor: '#FFD700',
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
    marginVertical: 20,
  },
  noStatsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
