import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { GradientHeader } from '../../components/common';
import { Partido, Equipo, Jugador } from '../../api/types';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';

export const LoadResultsScreen = ({ navigation, route }: any) => {
  const { torneo } = route.params;
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [marcadorLocal, setMarcadorLocal] = useState('');
  const [marcadorVisitante, setMarcadorVisitante] = useState('');
  const [eventos, setEventos] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      const result = await safeAsync(
        async () => {
          const [partidosResponse, equiposResponse, jugadoresResponse] = await Promise.all([
            api.partidos.list(),
            route.params?.idEdicionCategoria ? api.equipos.list(route.params.idEdicionCategoria) : Promise.resolve({ success: true, data: [] }),
            api.jugadores.list(),
          ]);

          const partidosData = partidosResponse.success && partidosResponse.data ? partidosResponse.data : [];
          const equiposData = equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];
          const jugadoresData = jugadoresResponse.success && jugadoresResponse.data ? jugadoresResponse.data : [];

          return { partidos: partidosData, equipos: equiposData, jugadores: jugadoresData };
        },
        'LoadResultsScreen - loadData',
        { fallbackValue: { partidos: [], equipos: [], jugadores: [] } }
      );

      if (result) {
        setPartidos(result.partidos);
        setEquipos(result.equipos);
        setJugadores(result.jugadores);
      }
      setLoading(false);
    };

    loadData();
  }, [route.params?.idEdicionCategoria]);

  // Helper function to get equipo by id
  const getEquipoById = (id: number): Equipo | undefined => {
    return equipos.find(e => e.id_equipo === id);
  };

  // Helper function to get jugadores by equipo
  const getJugadoresByEquipo = (idEquipo: number): Jugador[] => {
    return jugadores.filter(j => j.id_equipo === idEquipo);
  };

  const partidosPendientes = partidos.filter(
    p => p.estado_partido === 'Pendiente'
  ).slice(0, 4);

  const handleSelectMatch = (partido: any) => {
    const local = getEquipoById(partido.id_equipo_local);
    const visitante = getEquipoById(partido.id_equipo_visitante);
    
    setSelectedMatch({
      ...partido,
      equipo_local: local,
      equipo_visitante: visitante,
    });
    setMarcadorLocal('');
    setMarcadorVisitante('');
    setEventos([]);
  };

  const handleAddEvento = (tipo: string, equipo: 'local' | 'visitante') => {
    const jugadores = equipo === 'local' 
      ? getJugadoresByEquipo(selectedMatch.id_equipo_local)
      : getJugadoresByEquipo(selectedMatch.id_equipo_visitante);

    Alert.alert(
      `Agregar ${tipo}`,
      'Selecciona un jugador (en producción sería un selector)',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Agregar',
          onPress: () => {
            const nuevoEvento = {
              id: eventos.length + 1,
              tipo,
              jugador: jugadores[0]?.nombre_completo || 'Jugador',
              minuto: '45',
              equipo,
            };
            setEventos([...eventos, nuevoEvento]);
          },
        },
      ]
    );
  };

  const handleSaveResult = () => {
    if (!marcadorLocal || !marcadorVisitante) {
      Alert.alert('Error', 'Debes ingresar ambos marcadores');
      return;
    }

    Alert.alert(
      '¡Resultado Guardado!',
      `${selectedMatch.equipo_local.nombre} ${marcadorLocal} - ${marcadorVisitante} ${selectedMatch.equipo_visitante.nombre}\n\nEventos registrados: ${eventos.length}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setSelectedMatch(null);
            setMarcadorLocal('');
            setMarcadorVisitante('');
            setEventos([]);
          },
        },
      ]
    );
  };

  if (!selectedMatch) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Cargar Resultados</Text>
            <Text style={styles.subtitle}>Selecciona un partido</Text>
          </View>

          <View style={styles.matchesSection}>
            <Text style={styles.sectionTitle}>Partidos Pendientes</Text>
            
            {partidosPendientes.map((partido) => {
              const local = getEquipoById(partido.id_equipo_local);
              const visitante = getEquipoById(partido.id_equipo_visitante);

              return (
                <TouchableOpacity
                  key={partido.id_partido}
                  style={styles.matchCard}
                  onPress={() => handleSelectMatch(partido)}
                >
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchDate}>
                      {new Date(partido.fecha || '').toLocaleDateString('es-ES')} - {partido.hora}
                    </Text>
                    <View style={styles.teamsContainer}>
                      <View style={styles.team}>
                        <Text style={styles.teamLogo}>{local?.logo}</Text>
                        <Text style={styles.teamName}>{local?.nombre}</Text>
                      </View>
                      <Text style={styles.vs}>VS</Text>
                      <View style={styles.team}>
                        <Text style={styles.teamLogo}>{visitante?.logo}</Text>
                        <Text style={styles.teamName}>{visitante?.nombre}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedMatch(null)}
          >
            <Text style={styles.backButtonText}>← Cambiar Partido</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Cargar Resultado</Text>
        </View>

        {/* Match Header */}
        <View style={styles.matchHeader}>
          <Text style={styles.matchHeaderDate}>
            {new Date(selectedMatch.fecha || '').toLocaleDateString('es-ES')} - {selectedMatch.hora}
          </Text>
          <View style={styles.matchHeaderTeams}>
            <View style={styles.matchHeaderTeam}>
              <Text style={styles.matchHeaderLogo}>{selectedMatch.equipo_local.logo}</Text>
              <Text style={styles.matchHeaderName}>{selectedMatch.equipo_local.nombre}</Text>
            </View>
            <Text style={styles.matchHeaderVs}>VS</Text>
            <View style={styles.matchHeaderTeam}>
              <Text style={styles.matchHeaderLogo}>{selectedMatch.equipo_visitante.logo}</Text>
              <Text style={styles.matchHeaderName}>{selectedMatch.equipo_visitante.nombre}</Text>
            </View>
          </View>
        </View>

        {/* Score Input */}
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>Resultado Final</Text>
          <View style={styles.scoreInputs}>
            <View style={styles.scoreTeam}>
              <Text style={styles.scoreLogo}>{selectedMatch.equipo_local.logo}</Text>
              <TextInput
                style={styles.scoreInput}
                placeholder="0"
                keyboardType="numeric"
                value={marcadorLocal}
                onChangeText={setMarcadorLocal}
                maxLength={2}
                placeholderTextColor={colors.textLight}
              />
            </View>
            <Text style={styles.scoreSeparator}>-</Text>
            <View style={styles.scoreTeam}>
              <TextInput
                style={styles.scoreInput}
                placeholder="0"
                keyboardType="numeric"
                value={marcadorVisitante}
                onChangeText={setMarcadorVisitante}
                maxLength={2}
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.scoreLogo}>{selectedMatch.equipo_visitante.logo}</Text>
            </View>
          </View>
        </View>

        {/* Events */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.sectionTitle}>Eventos del Partido</Text>
            <Text style={styles.eventsCount}>({eventos.length})</Text>
          </View>

          {/* Event Buttons */}
          <View style={styles.eventButtons}>
            <TouchableOpacity
              style={styles.eventButton}
              onPress={() => handleAddEvento('Gol', 'local')}
            >
              <Text style={styles.eventButtonText}>⚽ Gol Local</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.eventButton}
              onPress={() => handleAddEvento('Gol', 'visitante')}
            >
              <Text style={styles.eventButtonText}>⚽ Gol Visitante</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.eventButton}
              onPress={() => handleAddEvento('Amarilla', 'local')}
            >
              <Text style={styles.eventButtonText}>🟨 Amarilla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.eventButton}
              onPress={() => handleAddEvento('Roja', 'local')}
            >
              <Text style={styles.eventButtonText}>🟥 Roja</Text>
            </TouchableOpacity>
          </View>

          {/* Events List */}
          {eventos.length > 0 ? (
            <View style={styles.eventsList}>
              {eventos.map((evento) => (
                <View key={evento.id} style={styles.eventoCard}>
                  <Text style={styles.eventoMinuto}>{evento.minuto}'</Text>
                  <Text style={styles.eventoTipo}>{evento.tipo}</Text>
                  <Text style={styles.eventoJugador}>{evento.jugador}</Text>
                  <TouchableOpacity
                    onPress={() => setEventos(eventos.filter(e => e.id !== evento.id))}
                  >
                    <Text style={styles.eventoDelete}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyEvents}>
              <Text style={styles.emptyEventsText}>
                No hay eventos registrados. Agrega goles, tarjetas, etc.
              </Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <Button
            title="Guardar Resultado"
            onPress={handleSaveResult}
            style={styles.saveButton}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  matchesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  matchInfo: {
    flex: 1,
  },
  matchDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    fontSize: 20,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  vs: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: colors.primary,
  },
  matchHeader: {
    backgroundColor: colors.white,
    padding: 20,
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchHeaderDate: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  matchHeaderTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchHeaderTeam: {
    flex: 1,
    alignItems: 'center',
  },
  matchHeaderLogo: {
    fontSize: 48,
    marginBottom: 8,
  },
  matchHeaderName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  matchHeaderVs: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginHorizontal: 16,
  },
  scoreSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreLogo: {
    fontSize: 32,
  },
  scoreInput: {
    width: 60,
    height: 60,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  scoreSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginHorizontal: 16,
  },
  eventsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsCount: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  eventButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  eventButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  eventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  eventsList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  eventoMinuto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    width: 40,
  },
  eventoTipo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    width: 80,
  },
  eventoJugador: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  eventoDelete: {
    fontSize: 18,
    padding: 4,
  },
  emptyEvents: {
    backgroundColor: colors.white,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyEventsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  saveSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  saveButton: {
    backgroundColor: colors.success,
  },
});

// Exportar por defecto también
export default LoadResultsScreen;