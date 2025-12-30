import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Ronda, Partido, Equipo } from '../../../api/types';
import { formatDate } from '../../../utils/formatters';
import { FAB, SearchBar } from '../../../components/common';
import { useToast } from '../../../contexts/ToastContext';
import { safeAsync, getUserFriendlyMessage } from '../../../utils/errorHandling';
import api from '../../../api';

interface KnockoutEmbedProps {
  navigation: any;
  isAdmin?: boolean;
  idEdicionCategoria?: number;
}

type SubtipoEliminatoria = 'oro' | 'plata' | 'bronce';

const getSubtipoGradient = (subtipo: SubtipoEliminatoria) => {
  switch (subtipo) {
    case 'oro':
      return ['#FFD700', '#FFA500', '#FF8C00'];
    case 'plata':
      return ['#C0C0C0', '#A8A8A8', '#909090'];
    case 'bronce':
      return ['#CD7F32', '#B8733C', '#A86832'];
    default:
      return [colors.primary, colors.primary, colors.primary];
  }
};

const getSubtipoIcon = (subtipo: SubtipoEliminatoria) => {
  switch (subtipo) {
    case 'oro':
      return 'ðŸ¥‡';
    case 'plata':
      return 'ðŸ¥ˆ';
    case 'bronce':
      return 'ðŸ¥‰';
    default:
      return 'ðŸ†';
  }
};

export const KnockoutEmbed: React.FC<KnockoutEmbedProps> = ({
  navigation,
  isAdmin = false,
  idEdicionCategoria,
}) => {
  const { showInfo, showError } = useToast();
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [expandedRondas, setExpandedRondas] = useState<{ [key: number]: boolean }>({});
  const [selectedSubtipo, setSelectedSubtipo] = useState<SubtipoEliminatoria>('oro');
  const [torneoFinalizado, setTorneoFinalizado] = useState(false);
  const [knockoutActivo, setKnockoutActivo] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        // Load rondas from API
        const rondasResponse = await api.rondas.list();
        const allRondas = rondasResponse.success && rondasResponse.data ? rondasResponse.data : [];

        // Filter only eliminatorias rounds
        const eliminatoriasRondas: Ronda[] = allRondas.filter((r: Ronda) => r.tipo === 'eliminatorias');

        // Load partidos from API
        const partidosResponse = await api.partidos.list();
        const allPartidos = partidosResponse.success && partidosResponse.data ? partidosResponse.data : [];

        // Load equipos from API
        const equiposResponse = await api.equipos.list(idEdicionCategoria || 1);
        const allEquipos = equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];

        return { eliminatoriasRondas, partidos: allPartidos, equipos: allEquipos };
      },
      'loadKnockoutData',
      {
        severity: 'high',
        fallbackValue: { eliminatoriasRondas: [], partidos: [], equipos: [] },
        onError: (error) => {
          showError(getUserFriendlyMessage(error), 'Error al cargar eliminatorias');
        }
      }
    );

    if (result) {
      setRondas(result.eliminatoriasRondas);
      setPartidos(result.partidos);
      setEquipos(result.equipos);
    }
    setLoading(false);
  };

  // Asegurar que el selectedSubtipo sea válido cuando cambian las rondas
  useEffect(() => {
    if (rondas.length > 0) {
      const available = isAdmin
        ? ['oro', 'plata', 'bronce'] as SubtipoEliminatoria[]
        : (['oro', 'plata', 'bronce'].filter(s => 
            hasPartidosInSubtipo(s as SubtipoEliminatoria)
          ) as SubtipoEliminatoria[]);
      
      // Si el subtipo seleccionado no está disponible, cambiar al primero disponible
      if (available.length > 0 && !available.includes(selectedSubtipo)) {
        setSelectedSubtipo(available[0]);
      }
    }
  }, [rondas, partidos, isAdmin]);

  const toggleRonda = (rondaId: number) => {
    setExpandedRondas(prev => ({
      ...prev,
      [rondaId]: !prev[rondaId],
    }));
  };

  const getPartidosByRonda = (rondaId: number): (Partido & { equipo_local: Equipo, equipo_visitante: Equipo })[] => {
    return partidos
      .filter(p => p.id_ronda === rondaId)
      .map(p => ({
        ...p,
        equipo_local: equipos.find(e => e.id_equipo === p.id_equipo_local)!,
        equipo_visitante: equipos.find(e => e.id_equipo === p.id_equipo_visitante)!,
        // TODO: Load cancha data from API when available
      }))
      .filter(p => {
        // Filtrar por búsqueda si hay query
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          p.equipo_local?.nombre.toLowerCase().includes(query) ||
          p.equipo_visitante?.nombre.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Ordenar por fecha y hora descendente (más tarde primero - arriba)
        const dateA = new Date(a.fecha_hora || '');
        const dateB = new Date(b.fecha_hora || '');
        return dateB.getTime() - dateA.getTime();
      });
  };

  const handleEditPartido = (partido: Partido) => {
    navigation.navigate('EditPartido', { partido });
  };

  const handleLoadResult = (partido: Partido) => {
    navigation.navigate('LoadResults', { partido });
  };

  const handleCreateRonda = (subtipo: SubtipoEliminatoria) => {
    navigation.navigate('CreateRonda', { 
      idEdicionCategoria,
      tipo: 'eliminatorias',
      subtipo_eliminatoria: subtipo,
    });
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
      idFase: ronda.id_fase
    });
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
          equipo_local: p.equipo_local.nombre,
          equipo_visitante: p.equipo_visitante.nombre,
          fecha: p.fecha,
          hora: p.hora,
          marcador_local: p.marcador_local,
          marcador_visitante: p.marcador_visitante,
          estado_partido: p.estado_partido,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: `Ronda: ${ronda.nombre}\n\n${jsonString}`,
        title: `Exportar ${ronda.nombre}`,
      });
      
      showInfo('Ronda exportada correctamente');
    } catch (error) {
      console.error('Error al exportar ronda:', error);
      showError('Error al exportar la ronda');
    }
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
              console.log('Eliminar ronda:', ronda.id_ronda);
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

  // Verificar si hay partidos para cada subtipo
  const hasPartidosInSubtipo = (subtipo: SubtipoEliminatoria) => {
    return rondas.some(r => 
      r.subtipo_eliminatoria === subtipo && 
      getPartidosByRonda(r.id_ronda).length > 0
    );
  };

  // Filtrar subtipos disponibles
  // Para admin: mostrar todos (oro, plata, bronce)
  // Para fans: mostrar solo los que tienen partidos (oro, plata, bronce según disponibilidad)
  const availableSubtipos: SubtipoEliminatoria[] = isAdmin
    ? ['oro', 'plata', 'bronce']
    : (['oro', 'plata', 'bronce'].filter(s => 
        hasPartidosInSubtipo(s as SubtipoEliminatoria)
      ) as SubtipoEliminatoria[]);

  // Si no hay ningún subtipo con partidos para fans, mostrar mensaje vacío
  if (availableSubtipos.length === 0 && !isAdmin) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="trophy-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyTitle}>No hay eliminatorias disponibles</Text>
        <Text style={styles.emptyText}>
          Las fases eliminatorias aparecerán cuando se creen los partidos correspondientes.
        </Text>
      </View>
    );
  }

  // Filtrar y ordenar rondas por subtipo seleccionado
  const filteredRondas = rondas
    .filter(r => r.subtipo_eliminatoria === selectedSubtipo)
    .sort((a, b) => {
      // Ordenar rondas por fecha de inicio descendente (más reciente primero - arriba)
      const dateA = new Date(a.fecha_inicio || '');
      const dateB = new Date(b.fecha_inicio || '');
      return dateB.getTime() - dateA.getTime();
    });

  const renderPartido = (partido: Partido & { equipo_local: Equipo, equipo_visitante: Equipo }) => {
    // Determinar ganador considerando penales
    const hasResult = partido.marcador_local !== null && partido.marcador_local !== undefined && 
                      partido.marcador_visitante !== null && partido.marcador_visitante !== undefined;
    
    const hayPenales = partido.penales_local !== null && partido.penales_local !== undefined && 
                       partido.penales_visitante !== null && partido.penales_visitante !== undefined;
    
    let ganador: 'local' | 'visitante' | 'empate' | null = null;
    
    if (hasResult) {
      const golesLocal = partido.marcador_local!;
      const golesVisitante = partido.marcador_visitante!;
      
      // Si hay penales, determinar ganador por penales
      if (hayPenales) {
        ganador = partido.penales_local! > partido.penales_visitante! ? 'local' : 
                  partido.penales_local! < partido.penales_visitante! ? 'visitante' : 'empate';
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
          <View style={styles.fechaHoraContainer}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={styles.fechaText}>{formatDate(partido.fecha || partido.fecha_hora || '')}</Text>
            {partido.hora && (
              <>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.horaText}>{partido.hora}</Text>
              </>
            )}
          </View>
          <View style={[
            styles.estadoBadge,
            partido.estado_partido === 'Finalizado' && styles.estadoBadgeFinalizado,
            partido.estado_partido === 'En curso' && styles.estadoBadgeEnCurso,
          ]}>
            <Text style={[
              styles.estadoText,
              partido.estado_partido === 'Finalizado' && styles.estadoTextFinalizado,
              partido.estado_partido === 'En curso' && styles.estadoTextEnCurso,
            ]}>
              {partido.estado_partido}
            </Text>
          </View>
        </View>

        {/* TODO: Show cancha info when API is available */}

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

  const renderRonda = (ronda: Ronda) => {
    const partidosRonda = getPartidosByRonda(ronda.id_ronda);
    const isExpanded = expandedRondas[ronda.id_ronda];
    const gradientColors = ronda.subtipo_eliminatoria 
      ? getSubtipoGradient(ronda.subtipo_eliminatoria) as [string, string, ...string[]]
      : [colors.primary, colors.primary, colors.primary] as [string, string, ...string[]];

    return (
      <View key={ronda.id_ronda} style={styles.rondaContainer}>
        <TouchableOpacity
          style={styles.rondaHeader}
          onPress={() => toggleRonda(ronda.id_ronda)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rondaHeaderGradient}
          >
            <View style={styles.rondaInfo}>
              <Text style={styles.rondaNombre}>{ronda.nombre}</Text>
              <Text style={styles.rondaFecha}>
                {formatDate(ronda.fecha_inicio)}{ronda.fecha_fin ? ` - ${formatDate(ronda.fecha_fin)}` : ''}
              </Text>
            </View>
            <View style={styles.rondaStatsActions}>
              <View style={styles.rondaStats}>
                <Text style={styles.partidosCount}>{partidosRonda.length}</Text>
                <Text style={styles.partidosLabel}>partidos</Text>
              </View>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.white}
              />
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
                  <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.rondaActionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleAddPartido(e, ronda)}
                >
                  <MaterialCommunityIcons name="plus-circle" size={16} color={colors.success} />
                  <Text style={styles.rondaActionText}>Agregar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleExportRonda(e, ronda)}
                >
                  <MaterialCommunityIcons name="export" size={16} color={colors.info} />
                  <Text style={styles.rondaActionText}>Exportar</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.partidosList}>
              {partidosRonda.length === 0 ? (
                <Text style={styles.emptyText}>No hay partidos en esta ronda</Text>
              ) : (
                partidosRonda.map((partido) => renderPartido(partido))
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Switch para terminar torneo (solo admin) */}
      {isAdmin && (
        <View style={styles.finalizarContainer}>
          <View style={styles.finalizarInfo}>
            <MaterialCommunityIcons 
              name={torneoFinalizado ? "check-circle" : "tournament"} 
              size={24} 
              color={torneoFinalizado ? colors.success : colors.textSecondary} 
            />
            <View style={styles.finalizarTextContainer}>
              <Text style={styles.finalizarTitle}>
                {torneoFinalizado ? 'Torneo Finalizado' : 'Torneo en Curso'}
              </Text>
              <Text style={styles.finalizarSubtitle}>
                {torneoFinalizado 
                  ? 'El torneo ha sido marcado como finalizado' 
                  : 'Marca el torneo como finalizado cuando termine'}
              </Text>
            </View>
          </View>
          <Switch
            value={torneoFinalizado}
            onValueChange={setTorneoFinalizado}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor={colors.white}
          />
        </View>
      )}

      {/* Switch para activar/desactivar Knockout (solo admin) */}
      {isAdmin && (
        <View style={styles.finalizarContainer}>
          <View style={styles.finalizarInfo}>
            <MaterialCommunityIcons 
              name={knockoutActivo ? "trophy" : "trophy-outline"} 
              size={24} 
              color={knockoutActivo ? colors.primary : colors.textSecondary} 
            />
            <View style={styles.finalizarTextContainer}>
              <Text style={styles.finalizarTitle}>
                {knockoutActivo ? 'Knockout Activo' : 'Knockout Inactivo'}
              </Text>
              <Text style={styles.finalizarSubtitle}>
                {knockoutActivo 
                  ? 'Los fans pueden ver el knockout' 
                  : 'El knockout está oculto para los fans'}
              </Text>
            </View>
          </View>
          <Switch
            value={knockoutActivo}
            onValueChange={setKnockoutActivo}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      )}

      {/* Mostrar contenido solo si el knockout está activo o si es admin */}
      {(knockoutActivo || isAdmin) ? (
        <>
          {/* Selector de Copa (mostrar si hay múltiples copas con partidos) */}
          {availableSubtipos.length > 1 && (
        <View style={styles.subtipoSelector}>
          {availableSubtipos.map(subtipo => {
            const isSelected = selectedSubtipo === subtipo;
            const gradientColors = getSubtipoGradient(subtipo);
            
            return (
              <TouchableOpacity
                key={subtipo}
                style={styles.subtipoButtonWrapper}
                onPress={() => setSelectedSubtipo(subtipo)}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={gradientColors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.subtipoButtonGradient}
                  >
                    <Text style={styles.subtipoTextSelected}>
                      {subtipo.toUpperCase()}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.subtipoButton}>
                    <Text style={styles.subtipoText}>
                      {subtipo.toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar equipo en eliminatorias..."
          onClear={() => setSearchQuery('')}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredRondas.length === 0 ? (
          <View style={styles.emptyRondasContainer}>
            <MaterialCommunityIcons name="trophy-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyRondasText}>
              {isAdmin 
                ? `No hay rondas creadas para la copa ${selectedSubtipo.toUpperCase()}`
                : `No hay rondas disponibles en la copa ${selectedSubtipo.toUpperCase()}`
              }
            </Text>
            {isAdmin && (
              <Text style={styles.emptyRondasHint}>
                Usa el botón + para crear una nueva ronda
              </Text>
            )}
          </View>
        ) : (
          filteredRondas.map(ronda => renderRonda(ronda))
        )}
      </ScrollView>

      {/* FAB para crear ronda (solo admin) */}
      {isAdmin && (
        <FAB
          onPress={() => handleCreateRonda(selectedSubtipo)}
          icon="add-circle"
          color={getSubtipoGradient(selectedSubtipo)[0]}
        />
      )}

        </>
      ) : (
        // Mensaje para fans cuando el knockout no está activo
        <View style={styles.inactiveContainer}>
          <MaterialCommunityIcons name="trophy-outline" size={64} color={colors.textLight} />
          <Text style={styles.inactiveTitle}>Knockout no disponible</Text>
          <Text style={styles.inactiveText}>
            La fase de knockout aún no está activa. Regresa más tarde para ver los partidos eliminatorios.
          </Text>
        </View>
      )}
    </View>
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
  searchSection: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: colors.backgroundGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtipoSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 16,
  },
  subtipoButtonWrapper: {
    flex: 1,
  },
  subtipoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.backgroundGray,
  },
  subtipoButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  subtipoIcon: {
    fontSize: 20,
  },
  subtipoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtipoTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  finalizarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  finalizarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  finalizarTextContainer: {
    flex: 1,
  },
  finalizarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  finalizarSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rondaContainer: {
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rondaHeader: {
    overflow: 'hidden',
  },
  rondaHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 80,
  },
  rondaInfo: {
    flex: 1,
  },
  rondaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rondaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  rondaFecha: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
  },
  rondaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rondaStatsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partidosCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  partidosLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.9,
  },
  rondaActions: {
    flexDirection: 'row',
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    flex: 1,
  },
  rondaActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
  partidosList: {
    padding: 12,
    gap: 12,
  },
  partidoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fechaHoraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fechaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  horaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  canchaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
  },
  estadoBadgeFinalizado: {
    backgroundColor: '#e8f5e9',
  },
  estadoBadgeEnCurso: {
    backgroundColor: '#fff3e0',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  estadoTextFinalizado: {
    color: colors.success,
  },
  estadoTextEnCurso: {
    color: colors.warning,
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
    backgroundColor: colors.white,
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
    fontWeight: '500',
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
    fontWeight: 'bold',
    color: colors.textPrimary,
    minWidth: 24,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 4,
  },
  loadResultText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyRondasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyRondasText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRondasHint: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  inactiveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  inactiveTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  inactiveText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default KnockoutEmbed;

