import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { colors } from '../../../theme/colors';
import { useToast } from '../../../contexts/ToastContext';
import { Ronda, Partido, Cancha } from '../../../api/types';
import { FixtureSinPartido, JornadaConFixturesSinPartido } from '../../../api/types/rondas.types';
import { SearchBar, FAB, DatePickerInput, TimePickerInput } from '../../../components/common';
import { formatDate } from '../../../utils/formatters';
import { safeAsync, getUserFriendlyMessage } from '../../../utils/errorHandling';
import api from '../../../api';

interface FixtureEmbedImprovedProps {
  navigation: any;
  isAdmin?: boolean;
  idEdicionCategoria?: number;
}

export const FixtureEmbedImproved: React.FC<FixtureEmbedImprovedProps> = ({ 
  navigation, 
  isAdmin = false, 
  idEdicionCategoria 
}) => {
  const { showError, showInfo } = useToast();
  const showErrorRef = useRef(showError);
  const showInfoRef = useRef(showInfo);
  
  // Actualizar las refs cuando cambien las funciones
  useEffect(() => {
    showErrorRef.current = showError;
    showInfoRef.current = showInfo;
  }, [showError, showInfo]);
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [expandedRondas, setExpandedRondas] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [idFase, setIdFase] = useState<number | null>(null);

  // Fixtures sin partido state (for admin)
  const [fixturesSinPartido, setFixturesSinPartido] = useState<{ [rondaId: number]: JornadaConFixturesSinPartido[] }>({});
  const [loadingFixtures, setLoadingFixtures] = useState<{ [rondaId: number]: boolean }>({});
  const [creatingPartido, setCreatingPartido] = useState<{ [fixtureId: number]: boolean }>({});
  const [fixtureDetails, setFixtureDetails] = useState<{
    [fixtureId: number]: {
      fecha: string;
      hora: string;
      id_cancha: number | null;
    };
  }>({});

  const loadData = useCallback(async () => {
    console.log('🔄 loadData callback iniciado');
    setLoading(true);
    const result = await safeAsync(
      async () => {
        if(!idEdicionCategoria) {
          throw new Error('idEdicionCategoria es requerido para cargar el fixture');
        }
        
        let currentIdFase: number;
        try {
          const fasesResponse = await api.fases.getFaseGrupos(idEdicionCategoria);
          
          const allFases = fasesResponse.success && fasesResponse.data ? fasesResponse.data : [];
         
          
          if (allFases.length === 0) {
            throw new Error('No se encontraron fases de grupo para esta edición categoría');
          }
          
          currentIdFase = allFases[0].id_fase;
          console.log('Estableciendo idFase:', currentIdFase);
          setIdFase(currentIdFase);
        } catch (apiError) {
          console.log('Error en llamada a API getFaseGrupos:', apiError);
          throw apiError;
        }


        // Load rondas from API with id_fase
        let allRondas: Ronda[] = [];
        try {
          const rondasResponse = await api.rondas.list({ id_fase: currentIdFase });
          console.log('📋 Respuesta completa de rondas:', rondasResponse);
          console.log('🎯 Rondas extraídas:', rondasResponse.data?.rondas);
          allRondas = rondasResponse.success && rondasResponse.data?.rondas ? rondasResponse.data.rondas : [];
          console.log('✅ Rondas procesadas:', allRondas.length, 'rondas encontradas');
        } catch (error) {
          console.log('💥 Error cargando rondas:', error);
        }

        // Filter only fase_grupos and amistosa (no knockout rounds)
        // Also ensure each ronda has id_fase set
        console.log('🔍 Filtrando rondas tipo fase_grupos o amistosa...');
        const sortedRondas: Ronda[] = allRondas
          .filter((r: Ronda) => {
            const isValid = r.tipo === 'fase_grupos' || r.tipo === 'amistosa';
            console.log(`🔸 Ronda "${r.nombre}" (tipo: ${r.tipo}): ${isValid ? 'incluida' : 'excluida'}`);
            return isValid;
          })
          .map((r: Ronda) => ({ ...r, id_fase: currentIdFase }))
          .sort((a: Ronda, b: Ronda) => b.orden - a.orden);
        
        console.log('📊 Rondas finales después del filtro:', sortedRondas.length);

        // Load partidos from API (now with nested team, cancha, and ronda data)
        console.log('🔄 Cargando partidos para idEdicionCategoria:', idEdicionCategoria);
        const partidosResponse = await api.partidos.list({ id_edicion_categoria: idEdicionCategoria || 1 });
        const allPartidos = partidosResponse.success && partidosResponse.data ? partidosResponse.data : [];
        console.log('📋 Partidos cargados:', allPartidos.length);

        // Load canchas from API (optional - only needed for creating partidos from fixtures)
        let allCanchas: Cancha[] = [];
        try {
          console.log('🔄 Cargando canchas para idEdicionCategoria:', idEdicionCategoria);
          const canchasResponse = await api.canchas.listByEdicionCategoria(idEdicionCategoria || 1);
          allCanchas = canchasResponse.success && canchasResponse.data?.canchas ? canchasResponse.data.canchas : [];
          console.log('📋 Canchas cargadas:', allCanchas.length);
        } catch (canchasError) {
          console.log('⚠️ Error cargando canchas (no crítico):', canchasError);
          // No es crítico - las canchas solo se necesitan para crear partidos desde fixtures
        }

        const today = new Date();
        let closestRondaId: number | null = null;
        let minDiff = Infinity;

        sortedRondas.forEach((ronda: Ronda) => {
          const rondaDate = new Date(ronda.fecha_inicio);
          const diff = Math.abs(rondaDate.getTime() - today.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestRondaId = ronda.id_ronda;
          }
        });

        return { sortedRondas, closestRondaId, partidos: allPartidos, canchas: allCanchas };
      },
      'loadFixtureData',
      {
        severity: 'high',
        fallbackValue: { sortedRondas: [], closestRondaId: null, partidos: [], canchas: [] },
        onError: (error) => {
          console.log('💥 Error en safeAsync:', error);
          showErrorRef.current(getUserFriendlyMessage(error), 'Error al cargar fixture');
        }
      }
    );

    console.log('📊 Resultado de safeAsync:', result ? 'success' : 'failed');
    if (result) {
      console.log('🔧 Estableciendo estados con resultado:', {
        rondas: result.sortedRondas.length,
        partidos: result.partidos.length,
        canchas: result.canchas.length
      });
      setRondas(result.sortedRondas);
      setPartidos(result.partidos);
      setCanchas(result.canchas);

      if (result.closestRondaId !== null) {
        setExpandedRondas({ [result.closestRondaId]: true });
      }
    }
    console.log('✅ loadData completado, loading=false');
    setLoading(false);
  }, [idEdicionCategoria]); // Removido showError de dependencias

  useEffect(() => {
    console.log('🔄 useEffect disparado, llamando loadData...');
    loadData();
  }, [loadData]);

  const loadFixturesSinPartido = useCallback(async (rondaId: number) => {
    if (!isAdmin) return;

    setLoadingFixtures(prev => ({ ...prev, [rondaId]: true }));

    const result = await safeAsync(
      async () => {
        const response = await api.rondas.fixturesSinPartido(rondaId);
        return response.success && response.data ? response.data.jornadas : [];
      },
      'loadFixturesSinPartido',
      {
        fallbackValue: [],
        onError: () => showErrorRef.current('Error al cargar fixtures sin partido'),
      }
    );

    setFixturesSinPartido(prev => ({ ...prev, [rondaId]: result || [] }));
    setLoadingFixtures(prev => ({ ...prev, [rondaId]: false }));
  }, [isAdmin]); // Removido showError de dependencias

  const toggleRonda = useCallback((rondaId: number) => {
    setExpandedRondas(prev => {
      const isExpanding = !prev[rondaId];

      // Load fixtures sin partido if expanding and admin
      if (isExpanding && isAdmin && !fixturesSinPartido[rondaId]) {
        loadFixturesSinPartido(rondaId);
      }

      return {
        ...prev,
        [rondaId]: isExpanding,
      };
    });
  }, [isAdmin, fixturesSinPartido, loadFixturesSinPartido]);

  const getPartidosByRonda = useCallback((rondaId: number): Partido[] => {
    return partidos
      .filter(p => {
        if (p.id_ronda !== rondaId) return false;

        if (!searchQuery) return true;

        // Use nested team data for search
        const queryLower = searchQuery.toLowerCase();
        return (
          p.equipo_local?.nombre?.toLowerCase().includes(queryLower) ||
          p.equipo_visitante?.nombre?.toLowerCase().includes(queryLower)
        );
      })
      .sort((a, b) => {
        // Sort by date and time
        const dateTimeA = a.fecha && a.hora ? new Date(`${a.fecha}T${a.hora}`) : new Date(a.fecha_hora || '');
        const dateTimeB = b.fecha && b.hora ? new Date(`${b.fecha}T${b.hora}`) : new Date(b.fecha_hora || '');
        return dateTimeB.getTime() - dateTimeA.getTime();
      });
  }, [partidos, searchQuery]);

  const handleFixtureDetailChange = (fixtureId: number, field: 'fecha' | 'hora' | 'id_cancha', value: string | number | null) => {
    setFixtureDetails(prev => ({
      ...prev,
      [fixtureId]: {
        ...prev[fixtureId],
        fecha: prev[fixtureId]?.fecha || '',
        hora: prev[fixtureId]?.hora || '',
        id_cancha: prev[fixtureId]?.id_cancha || null,
        [field]: value,
      },
    }));
  };

  const handleCreatePartidoFromFixture = async (fixture: FixtureSinPartido, ronda: Ronda) => {
    const details = fixtureDetails[fixture.id_fixture];

    // Validate fixture has all required data
    if (!details || !details.fecha || !details.hora || !details.id_cancha) {
      showErrorRef.current('Por favor completa todos los campos antes de crear el partido');
      return;
    }

    if (!ronda.id_fase) {
      showErrorRef.current('La ronda no tiene fase asignada');
      return;
    }

    // Set loading state for this fixture
    setCreatingPartido(prev => ({ ...prev, [fixture.id_fixture]: true }));

    const result = await safeAsync(
      async () => {
        const partidoData = {
          id_fixture: fixture.id_fixture,
          id_equipo_local: fixture.id_equipo_local,
          id_equipo_visitante: fixture.id_equipo_visitante,
          id_ronda: ronda.id_ronda,
          id_fase: ronda.id_fase!,
          id_cancha: details.id_cancha!,
          fecha: details.fecha,
          hora: details.hora,
          tipo_partido: (ronda.tipo === 'amistosa' ? 'amistoso' : 'clasificacion') as 'amistoso' | 'clasificacion' | 'eliminatoria',
          afecta_clasificacion: ronda.tipo !== 'amistosa',
          observaciones: fixture.nombre_grupo
            ? `Partido de clasificación - Grupo ${fixture.nombre_grupo}`
            : `Partido de ${ronda.tipo}`,
        };

        const response = await api.partidos.createFromFixture(partidoData);
        return response;
      },
      'createPartidoFromFixture',
      {
        fallbackValue: null,
        onError: (error) => {
          showErrorRef.current('Error al crear el partido');
        },
      }
    );

    // Clear loading state
    setCreatingPartido(prev => ({ ...prev, [fixture.id_fixture]: false }));

    if (result && result.success) {
      showInfoRef.current('Partido creado exitosamente');

      // Remove this fixture from details
      setFixtureDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[fixture.id_fixture];
        return newDetails;
      });

      // Reload data
      await loadData();
      await loadFixturesSinPartido(ronda.id_ronda);
    }
  };

  const handleEditPartido = (partido: Partido) => {
    navigation.navigate('EditPartido', { partido, idEdicionCategoria });
  };

  const handleLoadResult = (partido: Partido) => {
    navigation.navigate('LoadResults', { partido });
  };

  const renderFixturesSinPartido = (ronda: Ronda) => {
    const fixtures = fixturesSinPartido[ronda.id_ronda] || [];
    const isLoadingFixtures = loadingFixtures[ronda.id_ronda];

    if (isLoadingFixtures) {
      return (
        <View style={styles.loadingFixturesContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingFixturesText}>Cargando fixtures...</Text>
        </View>
      );
    }

    if (fixtures.length === 0) return null;

    // Safety check: ensure canchas is defined and is an array
    if (!canchas || !Array.isArray(canchas) || canchas.length === 0) {
      return null;
    }

    // Flatten all fixtures
    const allFixtures: FixtureSinPartido[] = [];
    fixtures.forEach(jornada => {
      jornada.fixtures.forEach(fixture => {
        allFixtures.push(fixture);
      });
    });

    if (allFixtures.length === 0) return null;

    return (
      <View style={styles.fixturesSection}>
        <View style={styles.fixturesSectionHeader}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.info} />
          <Text style={styles.fixturesSectionTitle}>
            Fixtures sin partido ({allFixtures.length})
          </Text>
        </View>

        {fixtures.map((jornada) => (
          <View key={jornada.jornada} style={styles.jornadaGroup}>
            <Text style={styles.jornadaTitle}>Jornada {jornada.jornada}</Text>

            {jornada.fixtures.map((fixture) => {
              const details = fixtureDetails[fixture.id_fixture] || { fecha: '', hora: '', id_cancha: null };
              const isComplete = details.fecha && details.hora && details.id_cancha;

              return (
                <View key={fixture.id_fixture} style={styles.fixtureCard}>
                  {/* Teams */}
                  <View style={styles.fixtureTeams}>
                    <Text style={styles.fixtureTeamText}>{fixture.local}</Text>
                    <Text style={styles.fixtureVs}>vs</Text>
                    <Text style={styles.fixtureTeamText}>{fixture.visitante}</Text>
                  </View>

                  {fixture.nombre_grupo && (
                    <Text style={styles.fixtureGrupo}>Grupo {fixture.nombre_grupo}</Text>
                  )}

                  {/* Date and Time Inputs */}
                  <View style={styles.fixtureInputRow}>
                    <View style={styles.inputHalf}>
                      <DatePickerInput
                        label="Fecha *"
                        value={details.fecha}
                        onChangeDate={(date) => handleFixtureDetailChange(fixture.id_fixture, 'fecha', date)}
                        placeholder="Seleccionar fecha"
                      />
                    </View>

                    <View style={styles.inputHalf}>
                      <TimePickerInput
                        label="Hora *"
                        value={details.hora}
                        onChangeTime={(time) => handleFixtureDetailChange(fixture.id_fixture, 'hora', time)}
                        placeholder="Seleccionar hora"
                      />
                    </View>
                  </View>

                  {/* Cancha Selector */}
                  <View style={styles.canchaSelector}>
                    <Text style={styles.fixtureInputLabel}>Cancha *</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.canchaScrollView}
                    >
                      {canchas.map((cancha) => (
                        <TouchableOpacity
                          key={cancha.id_cancha}
                          style={[
                            styles.canchaChip,
                            details.id_cancha === cancha.id_cancha && styles.canchaChipSelected,
                          ]}
                          onPress={() => handleFixtureDetailChange(fixture.id_fixture, 'id_cancha', cancha.id_cancha)}
                        >
                          <MaterialCommunityIcons
                            name="soccer-field"
                            size={16}
                            color={details.id_cancha === cancha.id_cancha ? colors.white : colors.primary}
                          />
                          <Text
                            style={[
                              styles.canchaChipText,
                              details.id_cancha === cancha.id_cancha && styles.canchaChipTextSelected,
                            ]}
                          >
                            {cancha.nombre}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Create Partido Button - Only show when complete */}
                  {isComplete && (
                    <TouchableOpacity
                      style={[
                        styles.createPartidoButton,
                        creatingPartido[fixture.id_fixture] && styles.createPartidoButtonDisabled
                      ]}
                      onPress={() => handleCreatePartidoFromFixture(fixture, ronda)}
                      disabled={creatingPartido[fixture.id_fixture]}
                    >
                      {creatingPartido[fixture.id_fixture] ? (
                        <>
                          <ActivityIndicator size="small" color={colors.white} />
                          <Text style={styles.createPartidoButtonText}>Creando...</Text>
                        </>
                      ) : (
                        <>
                          <MaterialCommunityIcons name="plus-circle" size={18} color={colors.white} />
                          <Text style={styles.createPartidoButtonText}>Crear Partido</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderPartido = (partido: Partido) => {
    // Safety check: ensure team data exists
    if (!partido.equipo_local || !partido.equipo_visitante) {
      return null;
    }

    // Determinar ganador considerando penales
    const hasResult = partido.marcador_local !== null && partido.marcador_local !== undefined &&
                      partido.marcador_visitante !== null && partido.marcador_visitante !== undefined;

    const hayPenales = partido.penales_local !== null && partido.penales_local !== undefined &&
                       partido.penales_visitante !== null && partido.penales_visitante !== undefined;

    let ganador: 'local' | 'visitante' | 'empate' | null = null;

    if (hasResult) {
      const golesLocal = partido.marcador_local!;
      const golesVisitante = partido.marcador_visitante!;
      const penalesLocal = partido.penales_local;
      const penalesVisitante = partido.penales_visitante;

      // Si hay penales, determinar ganador por penales
      if (hayPenales) {
        ganador = penalesLocal! > penalesVisitante! ? 'local' : penalesLocal! < penalesVisitante! ? 'visitante' : 'empate';
      } else {
        // Determinar ganador por resultado normal
        ganador = golesLocal > golesVisitante ? 'local' : golesLocal < golesVisitante ? 'visitante' : 'empate';
      }
    }

    return (
      <TouchableOpacity
        key={partido.id_partido}
        style={styles.partidoCard}
        onPress={() => isAdmin ? handleEditPartido(partido) : navigation.navigate('MatchDetail', { partidoId: partido.id_partido })}
        activeOpacity={0.7}
      >
        <View style={styles.partidoHeader}>
          <View style={styles.partidoInfo}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={styles.fechaText}>{formatDate(partido.fecha || partido.fecha_hora || '')}</Text>
            {partido.hora && (
              <>
                <MaterialCommunityIcons name="clock" size={14} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                <Text style={styles.fechaText}>{partido.hora}</Text>
              </>
            )}
          </View>
          {hasResult && (
            <View style={styles.estadoBadge}>
              <Text style={styles.estadoText}>Finalizado</Text>
            </View>
          )}
        </View>

        {/* Show cancha info */}
        {partido.cancha && (
          <View style={styles.canchaContainer}>
            <MaterialCommunityIcons name="soccer-field" size={14} color={colors.textSecondary} />
            <Text style={styles.canchaText}>{partido.cancha.nombre}</Text>
          </View>
        )}

        <View style={styles.equiposContainer}>
          <View style={styles.equipoRow}>
            <Image
              source={partido.equipo_local.logo ? { uri: partido.equipo_local.logo } : require('../../../assets/InterLOGO.png')}
              style={styles.equipoLogo}
              resizeMode="cover"
            />
            <Text style={[
              styles.equipoNombre,
              ganador === 'local' && styles.equipoNombreGanador,
            ]} numberOfLines={1}>
              {partido.equipo_local.nombre}
            </Text>
            <View style={styles.scoreContainer}>
              {ganador === 'local' && <View style={styles.winnerIndicator} />}
              <View style={styles.scoreRow}>
                <Text style={[
                  styles.golesText,
                  ganador === 'local' && styles.golesTextGanador,
                  ganador === 'visitante' && styles.golesTextPerdedor
                ]}>
                  {partido.marcador_local !== null && partido.marcador_local !== undefined ? partido.marcador_local : '-'}
                </Text>
                {hayPenales && (
                  <Text style={[
                    styles.penalesTextSmall,
                    ganador === 'local' && styles.golesTextGanador,
                    ganador === 'visitante' && styles.golesTextPerdedor
                  ]}>
                    {' '}({partido.penales_local})
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.equipoRow}>
            <Image 
              source={partido.equipo_visitante.logo ? { uri: partido.equipo_visitante.logo } : require('../../../assets/InterLOGO.png')} 
              style={styles.equipoLogo} 
              resizeMode="cover" 
            />
            <Text style={[
              styles.equipoNombre,
              ganador === 'visitante' && styles.equipoNombreGanador,
            ]} numberOfLines={1}>
              {partido.equipo_visitante.nombre}
            </Text>
            <View style={styles.scoreContainer}>
              {ganador === 'visitante' && <View style={styles.winnerIndicator} />}
              <View style={styles.scoreRow}>
                <Text style={[
                  styles.golesText,
                  ganador === 'visitante' && styles.golesTextGanador,
                  ganador === 'local' && styles.golesTextPerdedor
                ]}>
                  {partido.marcador_visitante !== null && partido.marcador_visitante !== undefined ? partido.marcador_visitante : '-'}
                </Text>
                {hayPenales && (
                  <Text style={[
                    styles.penalesTextSmall,
                    ganador === 'visitante' && styles.golesTextGanador,
                    ganador === 'local' && styles.golesTextPerdedor
                  ]}>
                    {' '}({partido.penales_visitante})
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={styles.loadResultButton}
            onPress={(e) => {
              e.stopPropagation();
              handleLoadResult(partido);
            }}
          >
            <MaterialCommunityIcons name="scoreboard" size={16} color={colors.primary} />
            <Text style={styles.loadResultText}>Cargar Resultado</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const handleEditRonda = (e: any, ronda: Ronda) => {
    e.stopPropagation();
    navigation.navigate('EditRonda', { ronda });
  };

  const handleAddPartido = (e: any, ronda: Ronda) => {
    e.stopPropagation();
    navigation.navigate('CreatePartido', {
      ronda,
      idEdicionCategoria: idEdicionCategoria || 1,
      idFase: idFase || ronda.id_fase
    });
  };

  const handleGenerateFixture = (e: any, ronda: Ronda) => {
    e.stopPropagation();
    Alert.alert(
      'Generar Partidos',
      '¿Deseas generar automáticamente los partidos para esta ronda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            try {
              // TODO: Llamar API para generar fixture automático
              // await api.rounds.generateFixture(ronda.id_ronda);
              showInfo('Partidos generados automáticamente');
              loadData();
            } catch (error) {
              showError('Error al generar los partidos');
            }
          },
        },
      ]
    );
  };

  const handleExportRonda = async (e: any, ronda: Ronda) => {
    e.stopPropagation();
    try {
      const partidosRonda = getPartidosByRonda(ronda.id_ronda);
      const exportData = {
        ronda: {
          nombre: ronda.nombre,
          tipo: ronda.tipo,
          subtipo_eliminatoria: ronda.subtipo_eliminatoria,
          fecha_inicio: ronda.fecha_inicio,
          fecha_fin: ronda.fecha_fin,
        },
        partidos: partidosRonda.map(p => ({
          equipo_local: p.equipo_local?.nombre || 'N/A',
          equipo_visitante: p.equipo_visitante?.nombre || 'N/A',
          fecha: p.fecha,
          hora: p.hora,
          marcador_local: p.marcador_local,
          marcador_visitante: p.marcador_visitante,
          estado_partido: p.estado_partido,
          cancha: p.cancha?.nombre,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: `Ronda: ${ronda.nombre}\n\n${jsonString}`,
        title: `Exportar ${ronda.nombre}`,
      });

      showInfo('Ronda exportada correctamente');
    } catch (error) {
      showError('Error al exportar la ronda');
    }
  };

  const renderRonda = ({ item: ronda }: { item: Ronda }) => {
    const partidosRonda = getPartidosByRonda(ronda.id_ronda);
    const isExpanded = expandedRondas[ronda.id_ronda];
    const gradientColors = ronda.tipo === 'eliminatorias' && ronda.subtipo_eliminatoria
      ? getSubtipoGradient(ronda.subtipo_eliminatoria) as [string, string, ...string[]]
      : null;

    return (
      <View key={ronda.id_ronda} style={styles.rondaContainer}>
        <TouchableOpacity
          style={[styles.rondaHeader, !gradientColors && { backgroundColor: colors.white }]}
          onPress={() => toggleRonda(ronda.id_ronda)}
          activeOpacity={0.7}
        >
          {gradientColors ? (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
              <View style={styles.rondaInfo}>
                <View style={styles.rondaTitleRow}>
                  <Text style={[styles.rondaNombre, { color: colors.white }]}>{ronda.nombre}</Text>
                  <View style={[styles.tipoRondaBadge, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                    <MaterialCommunityIcons name="trophy" size={12} color={colors.white} />
                    <Text style={styles.tipoRondaText}>Eliminatoria</Text>
                  </View>
                </View>
                <Text style={[styles.rondaFecha, { color: colors.white }]}>
                  {formatDate(ronda.fecha_inicio)}{ronda.fecha_fin ? ` - ${formatDate(ronda.fecha_fin)}` : ''}
                </Text>
              </View>
              <View style={styles.rondaStatsActions}>
                <View style={styles.rondaStats}>
                  <Text style={[styles.partidosCount, { color: colors.white }]}>{partidosRonda.length} partidos</Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.white}
                  />
                </View>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.deleteButtonGradient}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteRonda(ronda);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.rondaInfo}>
                <View style={styles.rondaTitleRow}>
                  <Text style={styles.rondaNombre}>{ronda.nombre}</Text>
                  <View style={[
                    styles.tipoRondaBadge,
                    ronda.tipo === 'fase_grupos' ? styles.tipoRondaBadgeGrupos : styles.tipoRondaBadgeAmistosa
                  ]}>
                    <MaterialCommunityIcons
                      name={ronda.tipo === 'fase_grupos' ? 'soccer' : 'trophy-outline'}
                      size={12}
                      color={colors.white}
                    />
                    <Text style={styles.tipoRondaText}>
                      {ronda.tipo === 'fase_grupos' ? 'Fase de Grupos' : 'Amistosa'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rondaFecha}>
                  {formatDate(ronda.fecha_inicio)}{ronda.fecha_fin ? ` - ${formatDate(ronda.fecha_fin)}` : ''}
                </Text>
              </View>
              <View style={styles.rondaStatsActions}>
                <View style={styles.rondaStats}>
                  <Text style={styles.partidosCount}>{partidosRonda.length} partidos</Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </View>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteRonda(ronda);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <>
            {/* Botones de admin para la ronda */}
            {isAdmin && (
              <View style={styles.rondaActions}>
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleEditRonda(e, ronda)}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
                  <Text style={styles.rondaActionText}>Editar</Text>
                </TouchableOpacity>
                
                {/* Mostrar botón de generar fixtures si no tiene fixtures */}
                {(() => {
                  const fixtures = fixturesSinPartido[ronda.id_ronda] || [];
                  const hasFixtures = fixtures.some(j => j.fixtures.length > 0);
                  const hasPartidos = getPartidosByRonda(ronda.id_ronda).length > 0;
                  
                  if (!hasFixtures && !hasPartidos) {
                    return (
                      <TouchableOpacity
                        style={[styles.rondaActionButton, styles.rondaActionButtonHighlight]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleGenerateFixtures(ronda);
                        }}
                      >
                        <MaterialCommunityIcons name="auto-fix" size={18} color={colors.warning} />
                        <Text style={[styles.rondaActionText, { color: colors.warning }]}>Fixtures</Text>
                      </TouchableOpacity>
                    );
                  }
                  
                  return (
                    <TouchableOpacity
                      style={styles.rondaActionButton}
                      onPress={(e) => handleAddPartido(e, ronda)}
                    >
                      <MaterialCommunityIcons name="plus-circle" size={18} color={colors.success} />
                      <Text style={styles.rondaActionText}>Agregar</Text>
                    </TouchableOpacity>
                  );
                })()}
                
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleExportRonda(e, ronda)}
                >
                  <MaterialCommunityIcons name="export" size={18} color={colors.info} />
                  <Text style={styles.rondaActionText}>Exportar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Fixtures sin partido section (admin only) */}
            {isAdmin && renderFixturesSinPartido(ronda)}

            {/* Partidos list */}
            <View style={styles.partidosList}>
              {partidosRonda.length === 0 && !isAdmin ? (
                <Text style={styles.emptyText}>No hay partidos en esta ronda</Text>
              ) : partidosRonda.length === 0 && isAdmin ? (
                // Empty state for admin: no fixtures and no partidos
                (() => {
                  const fixtures = fixturesSinPartido[ronda.id_ronda] || [];
                  const hasFixtures = fixtures.some(j => j.fixtures.length > 0);

                  if (!hasFixtures) {
                    return (
                      <View style={styles.emptyStateContainer}>
                        <MaterialCommunityIcons name="calendar-plus" size={48} color={colors.textLight} />
                        <Text style={styles.emptyStateTitle}>Esta ronda no tiene fixtures</Text>
                        <Text style={styles.emptyStateSubtitle}>
                          Genera fixtures para poder crear partidos en esta ronda
                        </Text>
                        
                        <View style={styles.emptyStateActions}>
                          <TouchableOpacity
                            style={[styles.emptyStateButton, styles.emptyStateButtonPrimary]}
                            onPress={() => handleGenerateFixtures(ronda)}
                          >
                            <MaterialCommunityIcons name="auto-fix" size={20} color={colors.white} />
                            <Text style={styles.emptyStateButtonText}>Generar Automáticamente</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.emptyStateButton, styles.emptyStateButtonSecondary]}
                            onPress={() => navigation.navigate('ManageFixture', { 
                              ronda, 
                              idEdicionCategoria 
                            })}
                          >
                            <MaterialCommunityIcons name="pencil-plus" size={20} color={colors.primary} />
                            <Text style={[styles.emptyStateButtonText, { color: colors.primary }]}>Crear Manualmente</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()
              ) : (
                partidosRonda.map((partido) => renderPartido(partido))
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  const handleCreateRonda = () => {
    navigation.navigate('CreateRonda', { idEdicionCategoria });
  };

  const handleGenerateFixtures = (ronda: Ronda) => {
    // Navegar al paso 2 del flujo de creación de rondas (generación de fixtures)
    console.log('🚀 Navegando a generación de fixtures con parámetros:', {
      idEdicionCategoria,
      step: 2,
      rondaData: {
        id_ronda: ronda.id_ronda,
        nombre: ronda.nombre,
        tipo: ronda.tipo,
        fecha_inicio: ronda.fecha_inicio,
        fecha_fin: ronda.fecha_fin,
        id_fase: ronda.id_fase
      }
    });
    
    navigation.navigate('CreateRondaFlow', { 
      idEdicionCategoria,
      step: 2, // Ir directamente al paso 2 (generación de fixtures)
      rondaData: {
        id_ronda: ronda.id_ronda,
        nombre: ronda.nombre,
        tipo: ronda.tipo,
        fecha_inicio: ronda.fecha_inicio,
        fecha_fin: ronda.fecha_fin,
        id_fase: ronda.id_fase,
        orden: ronda.orden
      }
    });
  };

  const handleDeleteRonda = (ronda: Ronda) => {
    Alert.alert(
      'Eliminar Ronda',
      `¿Estás seguro de eliminar la ronda "${ronda.nombre}"? Esta acción eliminará todos los partidos asociados y no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Llamar API para eliminar ronda
              // await api.rounds.deleteRound(ronda.id_ronda);
              showInfo('Ronda eliminada exitosamente');
              loadData();
            } catch (error) {
              showError('Error al eliminar la ronda');
            }
          },
        },
      ]
    );
  };

  const renderRondaRightActions = (ronda: Ronda) => (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -20, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });

    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteContainer,
          {
            opacity,
            transform: [{ translateX }, { scale }],
            height: '100%',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeDeleteButton}
          onPress={() => handleDeleteRonda(ronda)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="delete" size={28} color={colors.white} />
          <Text style={styles.swipeDeleteText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getSubtipoGradient = (subtipo?: string): string[] => {
    switch (subtipo) {
      case 'oro':
        return ['#FFD700', '#FFA500', '#FF8C00']; // Dorado
      case 'plata':
        return ['#C0C0C0', '#A8A8A8', '#808080']; // Plateado
      case 'bronce':
        return ['#CD7F32', '#B8733C', '#9F6F3D']; // Bronce
      default:
        return [colors.white, colors.white, colors.white];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando fixture...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar equipo..."
        onClear={() => setSearchQuery('')}
      />

      <FlatList
        data={rondas}
        renderItem={renderRonda}
        keyExtractor={(item) => item.id_ronda.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-remove" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No hay rondas creadas</Text>
            {isAdmin && (
              <Text style={styles.emptySubtitle}>Crea la primera ronda para comenzar</Text>
            )}
          </View>
        }
      />

      {isAdmin && (
        <FAB
          icon="add-circle"
          onPress={handleCreateRonda}
          color={colors.primary}
        />
      )}
    </GestureHandlerRootView>
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
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  rondaContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rondaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
  },
  rondaInfo: {
    flex: 1,
  },
  rondaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  rondaNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tipoRondaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tipoRondaBadgeGrupos: {
    backgroundColor: colors.primary,
  },
  tipoRondaBadgeAmistosa: {
    backgroundColor: colors.info,
  },
  tipoRondaText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  rondaFecha: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rondaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rondaStatsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partidosCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rondaActions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    padding: 12,
    gap: 8,
    backgroundColor: colors.backgroundGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rondaActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  rondaActionButtonHighlight: {
    backgroundColor: colors.backgroundGray,
    borderColor: colors.warning,
    borderWidth: 2,
  },
  rondaActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
  partidosList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  partidoCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partidoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fechaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  canchaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: 8,
  },
  canchaTextContainer: {
    flexDirection: 'column',
  },
  canchaLocalText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  canchaText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  estadoBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  equiposContainer: {
    gap: 8,
  },
  equipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipoLogo: {
    width: 20,
    height: 20,
    borderRadius: 8,
  },
  equipoLogoEmoji: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipoLogoEmojiText: {
    fontSize: 20,
  },
  equipoNombre: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  equipoNombreGanador: {
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  winnerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  golesText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  golesTextGanador: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  golesTextPerdedor: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  penalesTextSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadResultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
  },
  loadResultText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  swipeDeleteContainer: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  swipeDeleteButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  // Fixtures sin partido styles
  loadingFixturesContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingFixturesText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
  fixturesSection: {
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  fixturesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  fixturesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  jornadaGroup: {
    marginBottom: 16,
  },
  jornadaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  fixtureCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fixtureTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fixtureTeamText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  fixtureVs: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  fixtureGrupo: {
    fontSize: 12,
    color: colors.info,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  fixtureInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputHalf: {
    flex: 1,
  },
  fixtureInputLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  fixtureInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  fixtureInputText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  fixtureInputPlaceholder: {
    color: colors.textLight,
  },
  canchaSelector: {
    marginTop: 4,
  },
  canchaScrollView: {
    marginTop: 8,
  },
  canchaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    marginRight: 8,
  },
  canchaChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  canchaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  canchaChipTextSelected: {
    color: colors.white,
  },
  createPartidoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  createPartidoButtonDisabled: {
    backgroundColor: colors.textLight,
    opacity: 0.6,
  },
  createPartidoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Empty state styles
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emptyStateActions: {
    width: '100%',
    gap: 12,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonPrimary: {
    backgroundColor: colors.primary,
  },
  emptyStateButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
