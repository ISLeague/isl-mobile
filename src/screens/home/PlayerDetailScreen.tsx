import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GradientHeader, Card } from '../../components/common';
import { colors } from '../../theme/colors';
import { calculateAge, formatDate } from '../../utils';
import { Jugador, ProximoPartido } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { mockEquipos, mockPlantillas } from '../../data/mockData';

type Props = NativeStackScreenProps<any, 'PlayerDetail'>;

export const PlayerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { isAdmin } = useAuth();
  
  // TODO: Obtener jugador de la API con route.params.jugadorId
  const jugador: Jugador = {
    id_jugador: 1,
    nombre_completo: 'Lionel Andrés Messi',
    dni: '12345678',
    numero_camiseta: 10,
    fecha_nacimiento: '1987-06-24',
    estado: 'activo',
    foto: 'https://via.placeholder.com/150',
    estadisticas: {
      goles: 15,
      asistencias: 8,
      amarillas: 2,
      rojas: 0,
      partidos_jugados: 10,
    },
  };

  // Usar equipos reales de mockEquipos
  const equipo = mockEquipos[0]; // FC Barcelona Lima
  const equipoRival = mockEquipos[1]; // Real Madrid FC

  const proximoPartido: ProximoPartido = {
    id_partido: 1,
    fecha: '2024-02-15',
    hora: '20:00',
    rival: {
      nombre: equipoRival.nombre,
      logo: equipoRival.logo || '⚽',
    },
    cancha: {
      nombre: 'Estadio Camp Nou',
      direccion: 'Barcelona, España',
    },
    local: true,
  };

  const edad = calculateAge(jugador.fecha_nacimiento);

  // Verificar si el jugador es refuerzo
  const plantillaEntry = mockPlantillas.find(p => p.id_jugador === jugador.id_jugador);
  const esRefuerzo = plantillaEntry?.es_refuerzo || false;

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

  return (
    <View style={styles.container}>
      <GradientHeader title="Detalle del Jugador" onBackPress={() => navigation.goBack()} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Datos básicos */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>#{jugador.numero_camiseta}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName}>{formatPlayerName(jugador.nombre_completo)}</Text>
                {esRefuerzo && (
                  <View style={styles.refuerzoBadge}>
                    <Text style={styles.refuerzoText}>R</Text>
                  </View>
                )}
              </View>
              
              {/* Mostrar edad solo para admin */}
              {isAdmin && (
                <Text style={styles.playerAge}>{edad} años</Text>
              )}
              
              {/* Mostrar DNI solo para admin */}
              {isAdmin && (
                <Text style={styles.playerDNI}>DNI: {jugador.dni}</Text>
              )}
              
              <View style={styles.teamContainer}>
                <Image
                  source={equipo.logo ? { uri: equipo.logo } : require('../../assets/InterLOGO.png')}
                  style={styles.teamLogo}
                />
                <Text style={styles.teamName}>{equipo.nombre}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Estadísticas */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            {renderStatItem(
              'soccer',
              'Goles',
              jugador.estadisticas?.goles || 0,
              colors.success
            )}
            {renderStatItem(
              'handball',
              'Asistencias',
              jugador.estadisticas?.asistencias || 0,
              colors.info
            )}
            {renderStatItem(
              'card',
              'Amarillas',
              jugador.estadisticas?.amarillas || 0,
              colors.warning
            )}
            {renderStatItem(
              'card',
              'Rojas',
              jugador.estadisticas?.rojas || 0,
              colors.error
            )}
          </View>
        </Card>

        {/* Próximo partido */}
        <Card style={styles.nextMatchCard}>
          <View style={styles.nextMatchHeader}>
            <MaterialCommunityIcons
              name="soccer-field"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Próximo Partido</Text>
          </View>

          <View style={styles.matchRow}>
            <View style={styles.matchTeam}>
              <Image
                source={equipo.logo ? { uri: equipo.logo } : require('../../assets/InterLOGO.png')}
                style={styles.matchTeamLogo}
              />
              <Text style={styles.matchTeamName} numberOfLines={2}>
                {equipo.nombre}
              </Text>
            </View>

            <View style={styles.matchDetailsCenter}>
              <Text style={styles.matchDate}>{formatDate(proximoPartido.fecha)}</Text>
              <Text style={styles.matchTime}>{proximoPartido.hora}</Text>
              <Text style={styles.matchVenue} numberOfLines={1}>
                {proximoPartido.cancha.nombre}
              </Text>
            </View>

            <View style={styles.matchTeam}>
              <Image
                source={proximoPartido.rival.logo ? { uri: proximoPartido.rival.logo } : require('../../assets/InterLOGO.png')}
                style={styles.matchTeamLogo}
              />
              <Text style={styles.matchTeamName} numberOfLines={2}>
                {proximoPartido.rival.nombre}
              </Text>
            </View>
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
  },
  refuerzoBadge: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refuerzoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
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
  nextMatchCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  nextMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  matchTeam: {
    flex: 1,
    alignItems: 'center',
    maxWidth: '30%',
  },
  matchTeamLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 8,
  },
  matchTeamName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  matchDetailsCenter: {
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 80,
  },
  matchDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  matchTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  matchVenue: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
