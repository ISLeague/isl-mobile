import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { GradientHeader } from '../../components/common';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';

interface ResultPageProps {
  navigation: any;
  route: any;
}

interface PlayerEvent {
  id_jugador: number;
  goles: number;
  asistencias: number;
  amarillas: number;
  rojas: number;
  isMVP: boolean;
}

export const ResultPage: React.FC<ResultPageProps> = ({ navigation, route }) => {
  const { partido, ronda } = route.params;
  const { showSuccess, showError } = useToast();

  // partido.id_equipo_local y partido.id_equipo_visitante pueden ser números o objetos
  const equipoLocalId = typeof partido.id_equipo_local === 'number' ? partido.id_equipo_local : partido.id_equipo_local?.id_equipo;
  const equipoVisitanteId = typeof partido.id_equipo_visitante === 'number' ? partido.id_equipo_visitante : partido.id_equipo_visitante?.id_equipo;

  // State for loading and data
  const [loading, setLoading] = useState(true);
  const [equipoLocal, setEquipoLocal] = useState<any>(null);
  const [equipoVisitante, setEquipoVisitante] = useState<any>(null);
  const [jugadoresLocal, setJugadoresLocal] = useState<any[]>([]);
  const [jugadoresVisitante, setJugadoresVisitante] = useState<any[]>([]);

  const [golesLocal, setGolesLocal] = useState(partido.marcador_local || 0);
  const [golesVisitante, setGolesVisitante] = useState(partido.marcador_visitante || 0);
  const [penalesEnabled, setPenalesEnabled] = useState(false);
  const [penalesLocal, setPenalesLocal] = useState(partido.penales_local || 0);
  const [penalesVisitante, setPenalesVisitante] = useState(partido.penales_visitante || 0);
  const [walkoverEnabled, setWalkoverEnabled] = useState(false);
  const [walkoverWinner, setWalkoverWinner] = useState<'local' | 'visitante' | null>(null);

  // Modales de selección
  const [showScoreModal, setShowScoreModal] = useState<'golesLocal' | 'golesVisitante' | 'penalesLocal' | 'penalesVisitante' | null>(null);
  const [showEventModal, setShowEventModal] = useState<{ jugadorId: number; isLocal: boolean; eventType: keyof PlayerEvent } | null>(null);

  const [eventosLocal, setEventosLocal] = useState<PlayerEvent[]>([]);
  const [eventosVisitante, setEventosVisitante] = useState<PlayerEvent[]>([]);

  // Load teams and players data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load teams
      if (equipoLocalId) {
        const equipoLocalResponse = await api.equipos.getById(equipoLocalId);
        if (equipoLocalResponse.data) {
          setEquipoLocal(equipoLocalResponse.data);
        }
      }

      if (equipoVisitanteId) {
        const equipoVisitanteResponse = await api.equipos.getById(equipoVisitanteId);
        if (equipoVisitanteResponse.data) {
          setEquipoVisitante(equipoVisitanteResponse.data);
        }
      }

      // Load players for each team
      // TODO: Backend needs to support filtering by id_equipo in /jugadores-list endpoint
      // For now, we load all players and filter locally
      const allJugadoresResponse = await api.jugadores.list();
      if (allJugadoresResponse.success && allJugadoresResponse.data) {
        // Filter players for local team
        if (equipoLocalId) {
          const jugadoresLocalData = allJugadoresResponse.data.filter(
            (j: any) => j.equipo_id === equipoLocalId || j.id_equipo === equipoLocalId
          );
          setJugadoresLocal(jugadoresLocalData);
          setEventosLocal(
            jugadoresLocalData.map((j: any) => ({
              id_jugador: j.id_jugador,
              goles: 0,
              asistencias: 0,
              amarillas: 0,
              rojas: 0,
              isMVP: false
            }))
          );
        }

        // Filter players for visiting team
        if (equipoVisitanteId) {
          const jugadoresVisitanteData = allJugadoresResponse.data.filter(
            (j: any) => j.equipo_id === equipoVisitanteId || j.id_equipo === equipoVisitanteId
          );
          setJugadoresVisitante(jugadoresVisitanteData);
          setEventosVisitante(
            jugadoresVisitanteData.map((j: any) => ({
              id_jugador: j.id_jugador,
              goles: 0,
              asistencias: 0,
              amarillas: 0,
              rojas: 0,
              isMVP: false
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar los datos del partido');
    } finally {
      setLoading(false);
    }
  }, [equipoLocalId, equipoVisitanteId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasResult = partido.estado_partido === 'Finalizado';
  const canLoadResult = equipoLocal && equipoVisitante;

  // Límites según lógica del fútbol
  const getEventLimit = (eventType: keyof PlayerEvent): number => {
    switch (eventType) {
      case 'goles': return 50; // Máximo 50 goles por jugador
      case 'asistencias': return 50; // Máximo 50 asistencias
      case 'amarillas': return 2; // Máximo 2 amarillas (luego sería roja)
      case 'rojas': return 1; // Máximo 1 roja
      default: return 50;
    }
  };

  const updatePlayerEvent = (
    isLocal: boolean,
    jugadorId: number,
    field: keyof PlayerEvent,
    value: number | boolean
  ) => {
    const setter = isLocal ? setEventosLocal : setEventosVisitante;
    const eventos = isLocal ? eventosLocal : eventosVisitante;
    
    setter(eventos.map(e => {
      if (e.id_jugador === jugadorId) {
        const updated = { ...e, [field]: value };
        // Si hay 2 amarillas, activar automáticamente la roja
        if (field === 'amarillas' && typeof value === 'number' && value >= 2) {
          updated.rojas = 1;
        }
        return updated;
      }
      return e;
    }));
  };

  const toggleMVP = (isLocal: boolean, jugadorId: number) => {
    const setter = isLocal ? setEventosLocal : setEventosVisitante;
    const eventos = isLocal ? eventosLocal : eventosVisitante;
    
    setter(eventos.map(e => ({
      ...e,
      isMVP: e.id_jugador === jugadorId ? !e.isMVP : false
    })));
  };

  const handleScoreSelect = (modalType: typeof showScoreModal, value: number) => {
    if (modalType === 'golesLocal') setGolesLocal(value);
    else if (modalType === 'golesVisitante') setGolesVisitante(value);
    else if (modalType === 'penalesLocal') setPenalesLocal(value);
    else if (modalType === 'penalesVisitante') setPenalesVisitante(value);
    setShowScoreModal(null);
  };

  const handleEventSelect = (value: number) => {
    if (!showEventModal) return;
    updatePlayerEvent(
      showEventModal.isLocal,
      showEventModal.jugadorId,
      showEventModal.eventType,
      value
    );
    setShowEventModal(null);
  };

  const handleSaveResult = async () => {
    if (!canLoadResult) {
      Alert.alert('Error', 'No se puede cargar el resultado. Hay equipos por definir.');
      return;
    }

    if (walkoverEnabled && !walkoverWinner) {
      Alert.alert('Error', 'Debes seleccionar el ganador del walkover');
      return;
    }

    try {
      setLoading(true);

      // Si es walkover, establecer marcador 3-0
      const finalGolesLocal = walkoverEnabled ? (walkoverWinner === 'local' ? 3 : 0) : golesLocal;
      const finalGolesVisitante = walkoverEnabled ? (walkoverWinner === 'visitante' ? 3 : 0) : golesVisitante;

      // Collect all events from both teams
      const eventos: any[] = [];

      // Process local team events
      eventosLocal.forEach((evento) => {
        // Add goals
        for (let i = 0; i < evento.goles; i++) {
          eventos.push({
            tipo: 'gol',
            minuto: 0, // TODO: Add minute tracking if needed
            id_jugador: evento.id_jugador,
            id_equipo: equipoLocalId,
          });
        }

        // Add assists
        for (let i = 0; i < evento.asistencias; i++) {
          eventos.push({
            tipo: 'asistencia',
            minuto: 0,
            id_jugador: evento.id_jugador,
            id_equipo: equipoLocalId,
          });
        }

        // Add yellow cards
        for (let i = 0; i < evento.amarillas; i++) {
          eventos.push({
            tipo: 'amarilla',
            minuto: 0,
            id_jugador: evento.id_jugador,
            id_equipo: equipoLocalId,
          });
        }

        // Add red cards
        for (let i = 0; i < evento.rojas; i++) {
          eventos.push({
            tipo: 'roja',
            minuto: 0,
            id_jugador: evento.id_jugador,
            id_equipo: equipoLocalId,
          });
        }
      });

      // Process visiting team events
      eventosVisitante.forEach((evento) => {
        // Add goals
        for (let i = 0; i < evento.goles; i++) {
          eventos.push({
            tipo: 'gol',
            minuto: 0,
            id_jugador: evento.id_jugador,
            id_equipo: equipoVisitanteId,
          });
        }

        // Add assists
        for (let i = 0; i < evento.asistencias; i++) {
          eventos.push({
            tipo: 'asistencia',
            minuto: 0,
            id_jugador: evento.id_jugador,
            id_equipo: equipoVisitanteId,
          });
        }

        // Add yellow cards
        for (let i = 0; i < evento.amarillas; i++) {
          eventos.push({
            tipo: 'amarilla',
            minuto: 0,
            id_jugador: evento.id_jugador,
            id_equipo: equipoVisitanteId,
          });
        }

        // Add red cards
        for (let i = 0; i < evento.rojas; i++) {
          eventos.push({
            tipo: 'roja',
            minuto: 0,
            id_jugador: evento.id_jugador,
            id_equipo: equipoVisitanteId,
          });
        }
      });

      // Call API to register result
      const response = await api.partidos.registrarResultado({
        id_partido: partido.id_partido,
        goles_local: finalGolesLocal,
        goles_visitante: finalGolesVisitante,
        estado: 'finalizado',
        eventos,
      });

      if (response.success) {
        showSuccess('Resultado guardado exitosamente');
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        showError('Error al guardar el resultado');
      }
    } catch (error) {
      console.error('Error saving result:', error);
      showError('Error al guardar el resultado');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = () => {
    Alert.alert(
      'Eliminar Resultado',
      '¿Estás seguro de que quieres eliminar este resultado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Resultado Eliminado', '', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          },
        },
      ]
    );
  };

  const renderPlayerEvents = (jugador: any, eventosArray: PlayerEvent[], isLocal: boolean) => {
    const playerEvent = eventosArray.find((e: PlayerEvent) => e.id_jugador === jugador.id_jugador);
    if (!playerEvent) return null;

    return (
      <View key={jugador.id_jugador} style={styles.playerCard}>
        <View style={styles.playerHeader}>
          {jugador.numero_camiseta && (
            <View style={styles.playerNumberBadge}>
              <Text style={styles.playerNumber}>#{jugador.numero_camiseta}</Text>
            </View>
          )}
          <Text style={styles.playerName} numberOfLines={2}>{jugador.nombre_completo}</Text>
        </View>
        
        <View style={styles.playerEvents}>
          {/* Goles */}
          <TouchableOpacity
            style={styles.eventBadge}
            onPress={() => setShowEventModal({ jugadorId: jugador.id_jugador, isLocal, eventType: 'goles' })}
          >
            <Text style={[styles.eventLabel, playerEvent.goles > 0 && styles.eventLabelActive]}>G</Text>
            <Text style={styles.eventValue}>{playerEvent.goles}</Text>
          </TouchableOpacity>

          {/* Asistencias */}
          <TouchableOpacity
            style={styles.eventBadge}
            onPress={() => setShowEventModal({ jugadorId: jugador.id_jugador, isLocal, eventType: 'asistencias' })}
          >
            <Text style={[styles.eventLabel, playerEvent.asistencias > 0 && styles.eventLabelActive]}>A</Text>
            <Text style={styles.eventValue}>{playerEvent.asistencias}</Text>
          </TouchableOpacity>

          {/* Amarillas */}
          <TouchableOpacity
            style={styles.eventBadge}
            onPress={() => setShowEventModal({ jugadorId: jugador.id_jugador, isLocal, eventType: 'amarillas' })}
          >
            <Text style={[styles.eventLabel, styles.eventLabelYellow, playerEvent.amarillas > 0 && styles.eventLabelActive]}>YC</Text>
            <Text style={styles.eventValue}>{playerEvent.amarillas}</Text>
          </TouchableOpacity>

          {/* Rojas */}
          <TouchableOpacity
            style={[styles.eventBadge, (playerEvent.rojas > 0 || playerEvent.amarillas >= 2) && styles.eventBadgeRedActive]}
            onPress={() => {
              if (playerEvent.amarillas < 2) {
                updatePlayerEvent(isLocal, jugador.id_jugador, 'rojas', playerEvent.rojas > 0 ? 0 : 1);
              }
            }}
          >
            <Text style={[styles.eventLabel, styles.eventLabelRed, (playerEvent.rojas > 0 || playerEvent.amarillas >= 2) && styles.eventLabelActive]}>RC</Text>
          </TouchableOpacity>

          {/* MVP */}
          <TouchableOpacity
            style={[styles.mvpBadge, playerEvent.isMVP && styles.mvpBadgeActive]}
            onPress={() => toggleMVP(isLocal, jugador.id_jugador)}
          >
            <Text style={[styles.eventLabel, playerEvent.isMVP && styles.eventLabelActive]}>MVP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Modal de selección numérica
  const renderNumberModal = () => {
    if (!showScoreModal) return null;

    const isPenales = showScoreModal.includes('penales');
    const numbers = Array.from({ length: 51 }, (_, i) => i);

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setShowScoreModal(null)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowScoreModal(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalBackButton}
                onPress={() => setShowScoreModal(null)}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {isPenales ? 'Seleccionar Penales' : 'Seleccionar Goles'}
              </Text>
              <View style={styles.modalPlaceholder} />
            </View>
            <FlatList
              data={numbers}
              numColumns={5}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => handleScoreSelect(showScoreModal, item)}
                >
                  <Text style={styles.numberText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.numberGrid}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Modal de eventos de jugador
  const renderEventModal = () => {
    if (!showEventModal) return null;

    const limit = getEventLimit(showEventModal.eventType);
    const numbers = Array.from({ length: limit + 1 }, (_, i) => i);
    const eventNames: { [key: string]: string } = {
      goles: 'Goles',
      asistencias: 'Asistencias',
      amarillas: 'Tarjetas Amarillas',
      rojas: 'Tarjetas Rojas',
    };

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setShowEventModal(null)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowEventModal(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalBackButton}
                onPress={() => setShowEventModal(null)}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {eventNames[showEventModal.eventType]}
              </Text>
              <View style={styles.modalPlaceholder} />
            </View>
            <FlatList
              data={numbers}
              numColumns={5}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => handleEventSelect(item)}
                >
                  <Text style={styles.numberText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.numberGrid}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading && !equipoLocal && !equipoVisitante) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <GradientHeader
          title="Cargar Resultado"
          onBackPress={() => navigation.goBack()}
        />

        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando datos del partido...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canLoadResult) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <GradientHeader
          title="Cargar Resultado"
          onBackPress={() => navigation.goBack()}
        />

        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>No se puede cargar el resultado</Text>
          <Text style={styles.errorMessage}>
            Uno o ambos equipos están "Por Definir". Espera a que se defina el fixture completo.
          </Text>
          <Button
            title="Volver"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Cargar Resultado"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Nombre de la Ronda */}
        <View style={styles.roundHeader}>
          <Text style={styles.roundName}>{ronda?.nombre || 'Ronda 1'}</Text>
        </View>

        {/* Marcador Principal */}
        <View style={styles.mainScoreContainer}>
          {/* Equipo Local */}
          <View style={styles.teamSection}>
            <Image 
              source={equipoLocal?.logo ? { uri: equipoLocal.logo } : require('../../assets/InterLOGO.png')} 
              style={styles.teamLogo} 
              resizeMode="contain" 
            />
            <Text style={styles.teamName}>{equipoLocal?.nombre}</Text>
          </View>

          {/* Marcador Centro */}
          <View style={styles.scoreCenter}>
            <View style={styles.scoreRow}>
              <TouchableOpacity
                style={[styles.scoreButton, walkoverEnabled && styles.scoreButtonDisabled]}
                onPress={() => !walkoverEnabled && setShowScoreModal('golesLocal')}
                disabled={walkoverEnabled}
              >
                <Text style={[styles.scoreText, walkoverEnabled && styles.scoreTextDisabled]}>
                  {walkoverEnabled ? (walkoverWinner === 'local' ? 3 : 0) : golesLocal}
                </Text>
              </TouchableOpacity>

              <Text style={styles.scoreDivider}>-</Text>

              <TouchableOpacity
                style={[styles.scoreButton, walkoverEnabled && styles.scoreButtonDisabled]}
                onPress={() => !walkoverEnabled && setShowScoreModal('golesVisitante')}
                disabled={walkoverEnabled}
              >
                <Text style={[styles.scoreText, walkoverEnabled && styles.scoreTextDisabled]}>
                  {walkoverEnabled ? (walkoverWinner === 'visitante' ? 3 : 0) : golesVisitante}
                </Text>
              </TouchableOpacity>
            </View>
            {walkoverEnabled && (
              <Text style={styles.walkoverLabel}>W.O.</Text>
            )}
          </View>

          {/* Equipo Visitante */}
          <View style={styles.teamSection}>
            <Image 
              source={equipoVisitante?.logo ? { uri: equipoVisitante.logo } : require('../../assets/InterLOGO.png')} 
              style={styles.teamLogo} 
              resizeMode="contain" 
            />
            <Text style={styles.teamName}>{equipoVisitante?.nombre}</Text>
          </View>
        </View>

        {/* Switch de Penales */}
        <View style={styles.penalesSwitchContainer}>
          <Text style={styles.penalesSwitchLabel}>Penales</Text>
          <Switch
            value={penalesEnabled}
            onValueChange={(value) => {
              setPenalesEnabled(value);
              if (!value) {
                setPenalesLocal(0);
                setPenalesVisitante(0);
              }
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* Marcador de Penales */}
        {penalesEnabled && (
          <View style={styles.penalesScoreContainer}>
            <TouchableOpacity
              style={styles.penalesButton}
              onPress={() => setShowScoreModal('penalesLocal')}
            >
              <Text style={styles.penalesScore}>{penalesLocal}</Text>
            </TouchableOpacity>

            <Text style={styles.penalesDivider}>-</Text>

            <TouchableOpacity
              style={styles.penalesButton}
              onPress={() => setShowScoreModal('penalesVisitante')}
            >
              <Text style={styles.penalesScore}>{penalesVisitante}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Switch de Walkover */}
        <View style={styles.walkoverSection}>
          <View style={styles.walkoverHeader}>
            <Text style={styles.sectionTitle}>Walkover</Text>
            <Switch
              value={walkoverEnabled}
              onValueChange={(value) => {
                setWalkoverEnabled(value);
                if (!value) setWalkoverWinner(null);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          {walkoverEnabled && (
            <View style={styles.walkoverButtons}>
              <TouchableOpacity
                style={[styles.walkoverButton, walkoverWinner === 'local' && styles.walkoverButtonActive]}
                onPress={() => setWalkoverWinner('local')}
              >
                <Text style={[styles.walkoverButtonText, walkoverWinner === 'local' && styles.walkoverButtonTextActive]}>
                  {equipoLocal?.nombre}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.walkoverButton, walkoverWinner === 'visitante' && styles.walkoverButtonActive]}
                onPress={() => setWalkoverWinner('visitante')}
              >
                <Text style={[styles.walkoverButtonText, walkoverWinner === 'visitante' && styles.walkoverButtonTextActive]}>
                  {equipoVisitante?.nombre}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Eventos de Jugadores - Local */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>{equipoLocal?.nombre} - Jugadores</Text>
          {jugadoresLocal.map(jugador => renderPlayerEvents(jugador, eventosLocal, true))}
        </View>

        {/* Eventos de Jugadores - Visitante */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>{equipoVisitante?.nombre} - Jugadores</Text>
          {jugadoresVisitante.map(jugador => renderPlayerEvents(jugador, eventosVisitante, false))}
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsSection}>
          <View style={styles.actionsRow}>
            {hasResult && (
              <Button
                title="Eliminar"
                onPress={handleDeleteResult}
                style={styles.deleteButton}
              />
            )}
            <Button
              title={hasResult ? "Actualizar" : "Guardar"}
              onPress={handleSaveResult}
              style={styles.saveButton}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderNumberModal()}
      {renderEventModal()}

      {/* Loading overlay when saving */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>Guardando resultado...</Text>
          </View>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    minWidth: 120,
  },
  roundHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  roundName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  mainScoreContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  teamLogoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamLogoEmoji: {
    fontSize: 36,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
    lineHeight: 16,
  },
  scoreCenter: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  walkoverLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.error,
    marginTop: 4,
  },
  scoreButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreButtonDisabled: {
    opacity: 0.5,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scoreTextDisabled: {
    color: colors.textLight,
  },
  scoreDivider: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  penalesSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 2,
    gap: 12,
  },
  penalesSwitchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  penalesScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 2,
    gap: 24,
  },
  penalesButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  penalesScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  penalesDivider: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  walkoverSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  walkoverHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  walkoverButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  walkoverButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  walkoverButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  walkoverButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  walkoverButtonTextActive: {
    color: colors.white,
  },
  playersSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 12,
  },
  playerCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 8,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  playerEvents: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
    gap: 4,
    minWidth: 50,
    justifyContent: 'center',
  },
  eventLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  eventLabelActive: {
    color: colors.primary,
  },
  eventLabelYellow: {
    color: '#FFD700',
  },
  eventLabelRed: {
    color: colors.error,
  },
  eventBadgeRedActive: {
    backgroundColor: colors.error,
    opacity: 0.9,
  },
  eventValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  mvpBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
    minWidth: 45,
    alignItems: 'center',
  },
  mvpBadgeActive: {
    backgroundColor: '#FFD700',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 8,
    width: '90%',
    maxWidth: 380,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  modalBackButton: {
    padding: 4,
    width: 32,
  },
  modalPlaceholder: {
    width: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  numberGrid: {
    alignItems: 'center',
  },
  numberButton: {
    width: 60,
    height: 60,
    margin: 3,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  numberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingOverlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default ResultPage;
