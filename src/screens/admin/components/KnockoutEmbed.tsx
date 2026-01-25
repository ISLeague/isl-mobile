import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import {
  Eliminatoria,
  Partido,
  Equipo,
  TipoCopa,
  TipoFase,
  Fase,
} from '../../../api/types';
import { FAB } from '../../../components/common';
import { useToast } from '../../../contexts/ToastContext';
import { safeAsync, getUserFriendlyMessage } from '../../../utils/errorHandling';
import { formatDate } from '../../../utils/formatters';
import api from '../../../api';

interface KnockoutEmbedProps {
  navigation: any;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  idEdicionCategoria?: number;
}

const getSubtipoGradient = (copa: TipoCopa) => {
  switch (copa) {
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

type CopaInfo = {
  tipo: TipoCopa;
  nombre: string;
  icono: string;
  gradiente: [string, string, string];
};

const COPAS: CopaInfo[] = [
  {
    tipo: 'oro',
    nombre: 'Copa Oro',
    icono: 'trophy',
    gradiente: ['#FFD700', '#FFA500', '#FF8C00'],
  },
  {
    tipo: 'plata',
    nombre: 'Copa Plata',
    icono: 'trophy-variant',
    gradiente: ['#C0C0C0', '#A8A8A8', '#909090'],
  },
  {
    tipo: 'bronce',
    nombre: 'Copa Bronce',
    icono: 'trophy-outline',
    gradiente: ['#CD7F32', '#B8733C', '#A86832'],
  },
];

export const KnockoutEmbed: React.FC<KnockoutEmbedProps> = ({
  navigation,
  isAdmin = false,
  isSuperAdmin = false,
  idEdicionCategoria,
}) => {
  const { showError, showSuccess, showInfo } = useToast();
  const [llaves, setLlaves] = useState<Eliminatoria[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [expandedRondas, setExpandedRondas] = useState<{ [key: string]: boolean }>({});
  const [selectedCopa, setSelectedCopa] = useState<TipoCopa>('oro');
  const [knockoutActivo, setKnockoutActivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fasesKnockout, setFasesKnockout] = useState<any[]>([]);
  const [rondasKnockout, setRondasKnockout] = useState<any[]>([]);

  // Modal para seleccionar copa
  const [showCopaModal, setShowCopaModal] = useState(false);
  const [creatingFase, setCreatingFase] = useState<TipoCopa | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCopa]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [selectedCopa])
  );

  const loadData = async () => {
    console.log('🔄 [KnockoutEmbed] Iniciando carga de datos...');
    console.log('📋 [KnockoutEmbed] idEdicionCategoria:', idEdicionCategoria);
    console.log('🏆 [KnockoutEmbed] Copa seleccionada:', selectedCopa);

    setLoading(true);
    const result = await safeAsync(
      async () => {
        console.log('📂 [KnockoutEmbed] Cargando fases...');
        const fasesResponse = await api.fases.list(idEdicionCategoria || 1);
        console.log('📂 [KnockoutEmbed] Respuesta fases:', fasesResponse);

        const fases = fasesResponse.success && fasesResponse.data ? fasesResponse.data : [];
        console.log(`📂 [KnockoutEmbed] Total fases encontradas: ${fases.length}`);

        const fasesKO = fases.filter((f: any) => f.tipo === 'knockout');
        console.log(`📂 [KnockoutEmbed] Fases knockout encontradas: ${fasesKO.length}`);
        fasesKO.forEach((f: any) => {
          console.log(`   - Fase: ${f.nombre} | Copa: ${f.copa} | ID: ${f.id_fase}`);
        });

        const faseActual = fasesKO.find((f: any) => f.copa === selectedCopa);
        console.log('🎯 [KnockoutEmbed] Fase actual para copa', selectedCopa, ':', faseActual);

        if (!faseActual) {
          console.warn('⚠️ [KnockoutEmbed] No se encontró fase knockout para copa:', selectedCopa);
          return { llaves: [], partidos: [], equipos: [], fases: fasesKO };
        }

        console.log('🔑 [KnockoutEmbed] Cargando llaves para id_fase:', faseActual.id_fase);
        const llavesResponse = await api.eliminatorias.list({ id_fase: faseActual.id_fase });
        console.log('🔑 [KnockoutEmbed] Respuesta llaves:', llavesResponse);

        const llavesData = llavesResponse.success && llavesResponse.data?.todas_las_llaves
          ? llavesResponse.data.todas_las_llaves
          : [];
        console.log(`🔑 [KnockoutEmbed] Total llaves cargadas: ${llavesData.length}`);

        console.log('⚽ [KnockoutEmbed] Cargando partidos knockout...');
        const knockoutResponse = await api.partidos.listKnockout(idEdicionCategoria || 1, selectedCopa);
        console.log('⚽ [KnockoutEmbed] Respuesta partidos knockout:', knockoutResponse);

        let allKnockoutPartidos: any[] = [];

        if (knockoutResponse && knockoutResponse.success && knockoutResponse.data?.partidos_por_etapa) {
          const porEtapa = knockoutResponse.data.partidos_por_etapa;
          allKnockoutPartidos = [
            ...(porEtapa.eliminatoria || []),
            ...(porEtapa['16avos'] || []),
            ...(porEtapa.octavos || []),
            ...(porEtapa.cuartos || []),
            ...(porEtapa.semifinal || []),
            ...(porEtapa.final || []),
          ];
          console.log(`⚽ [KnockoutEmbed] Total partidos knockout: ${allKnockoutPartidos.length}`);
        }

        console.log('👥 [KnockoutEmbed] Cargando equipos...');
        const equiposResponse = await api.equipos.list(idEdicionCategoria || 1);
        const allEquipos = equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];
        console.log(`👥 [KnockoutEmbed] Total equipos: ${allEquipos.length}`);

        console.log('📅 [KnockoutEmbed] Cargando rondas de knockout...');
        let rondasKO: any[] = [];
        if (faseActual) {
          const rondasResponse = await api.rondas.list({ id_fase: faseActual.id_fase, tipo_ronda: 'eliminatorias' });
          if (rondasResponse.success && rondasResponse.data) {
            const todasLasRondas = Array.isArray(rondasResponse.data) ? rondasResponse.data : rondasResponse.data.rondas || [];
            rondasKO = todasLasRondas.filter((r: any) => r.subtipo_eliminatoria === selectedCopa);
            console.log(`📅 [KnockoutEmbed] Rondas filtradas por copa "${selectedCopa}": ${rondasKO.length}`);
          }
        }

        return { llaves: llavesData, partidos: allKnockoutPartidos, equipos: allEquipos, fases: fasesKO, rondas: rondasKO };
      },
      'loadKnockoutData',
      {
        severity: 'high',
        fallbackValue: { llaves: [], partidos: [], equipos: [], fases: [], rondas: [] },
        onError: (error) => {
          console.error('❌ [KnockoutEmbed] Error al cargar datos:', error);
          showError(getUserFriendlyMessage(error), 'Error al cargar eliminatorias');
        }
      }
    );

    if (result) {
      setLlaves(result.llaves ?? []);
      setPartidos(result.partidos ?? []);
      setEquipos(result.equipos ?? []);
      setFasesKnockout(result.fases ?? []);
      setRondasKnockout(result.rondas ?? []);
    }
    setLoading(false);
  };

  const toggleRonda = (rondaKey: string | number) => {
    setExpandedRondas(prev => ({
      ...prev,
      [rondaKey]: !prev[rondaKey],
    }));
  };

  const getPartidosByRonda = (idRonda: number): Partido[] => {
    return partidos.filter(p => p.id_ronda === idRonda);
  };

  // ============================================
  // HANDLERS PARA FAB - SELECCIÓN DE COPA
  // ============================================

  const handleFABPress = () => {
    setShowCopaModal(true);
  };

  const handleCopaSelect = async (copaInfo: CopaInfo) => {
    const faseExistente = fasesKnockout.find((f) => f.copa === copaInfo.tipo);

    if (faseExistente) {
      // Ya existe la fase, navegar a la pantalla de rondas
      console.log(`✅ [KnockoutEmbed] Fase ${copaInfo.tipo} existe, navegando...`);
      setShowCopaModal(false);
      navigation.navigate('KnockoutRondas', {
        fase: faseExistente,
        copa: copaInfo.tipo,
        idEdicionCategoria,
      });
    } else {
      // No existe, crear la fase automáticamente
      console.log(`🆕 [KnockoutEmbed] Creando fase para ${copaInfo.tipo}...`);
      setCreatingFase(copaInfo.tipo);

      const result = await safeAsync(
        async () => {
          const requestData = {
            nombre: `Fase Eliminatoria - ${copaInfo.nombre}`,
            tipo: 'knockout' as TipoFase,
            copa: copaInfo.tipo,
            orden: copaInfo.tipo === 'oro' ? 1 : copaInfo.tipo === 'plata' ? 2 : 3,
            id_edicion_categoria: idEdicionCategoria || 1,
            partidos_ida_vuelta: false,
            permite_empate: false,
            permite_penales: true,
          };

          console.log('📤 [KnockoutEmbed] Enviando request:', requestData);
          const response = await api.fases.create(requestData);
          console.log('📥 [KnockoutEmbed] Respuesta:', response);

          return response;
        },
        'createFaseKnockout',
        {
          severity: 'high',
          fallbackValue: null,
          onError: (error) => {
            console.error('❌ [KnockoutEmbed] Error al crear fase:', error);
            showError(getUserFriendlyMessage(error), 'Error al crear fase');
          },
        }
      );

      setCreatingFase(null);

      if (result && result.success && result.data) {
        showSuccess(`Fase ${copaInfo.nombre} creada exitosamente`);
        setShowCopaModal(false);
        await loadData();
        navigation.navigate('KnockoutRondas', {
          fase: result.data,
          copa: copaInfo.tipo,
          idEdicionCategoria,
        });
      }
    }
  };

  // ============================================
  // HANDLERS PARA ACCIONES DE RONDA
  // ============================================

  const handleEditRonda = (e: any, rondaObj: any) => {
    e?.stopPropagation?.();
    navigation.navigate('EditRonda', {
      ronda: rondaObj,
      onRondaUpdated: loadData
    });
  };

  const handleAddPartido = (e: any, rondaObj: any) => {
    e?.stopPropagation?.();
    const faseActual = fasesKnockout.find(f => f.copa === selectedCopa);
    navigation.navigate('CreatePartido', {
      ronda: rondaObj,
      idEdicionCategoria: idEdicionCategoria || 1,
      idFase: faseActual?.id_fase || rondaObj.id_fase,
      onPartidoCreated: loadData
    });
  };

  const handleExportRonda = async (e: any, rondaObj: any) => {
    e?.stopPropagation?.();
    try {
      const { Share } = await import('react-native');
      const rondaPartidos = getPartidosByRonda(rondaObj.id_ronda);
      const jsonString = JSON.stringify(rondaPartidos, null, 2);

      await Share.share({
        message: `Ronda: ${rondaObj.nombre}\n\n${jsonString}`,
        title: `Exportar ${rondaObj.nombre}`,
      });

      showInfo('Ronda exportada correctamente');
    } catch (error) {
      showError('Error al exportar la ronda');
    }
  };

  const handleDeleteRonda = (rondaObj: any) => {
    Alert.alert(
      'Eliminar Ronda',
      `¿Estás seguro de eliminar la ronda "${rondaObj.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await safeAsync(
              async () => await api.rondas.delete(rondaObj.id_ronda),
              'handleDeleteRonda',
              {
                fallbackValue: null,
                onError: (error) => showError('Error al eliminar la ronda')
              }
            );
            if (result) {
              showSuccess('Ronda eliminada exitosamente');
              loadData();
            }
          },
        },
      ]
    );
  };

  // ============================================
  // HANDLERS PARA ACCIONES DE PARTIDO
  // ============================================

  const handleLoadResult = (partido: Partido) => {
    navigation.navigate('LoadMatchResult', {
      partido,
      onResultLoaded: loadData,
    });
  };

  const handleEditPartido = (partido: Partido) => {
    navigation.navigate('EditPartido', {
      partido,
      onPartidoUpdated: loadData,
    });
  };

  const handleMatchLineup = (partido: Partido) => {
    navigation.navigate('MatchLineup', {
      partido,
      ronda: rondasKnockout.find(r => r.id_ronda === partido.id_ronda),
      equipoLocal: equipos.find(e => e.id_equipo === partido.id_equipo_local),
      equipoVisitante: equipos.find(e => e.id_equipo === partido.id_equipo_visitante),
    });
  };

  const handleMatchSubstitutions = (partido: Partido) => {
    navigation.navigate('MatchSubstitutions', {
      partido,
      ronda: rondasKnockout.find(r => r.id_ronda === partido.id_ronda),
      equipoLocal: equipos.find(e => e.id_equipo === partido.id_equipo_local),
      equipoVisitante: equipos.find(e => e.id_equipo === partido.id_equipo_visitante),
    });
  };

  const hasLlavesInCopa = (copa: TipoCopa) => {
    const fase = fasesKnockout.find(f => f.copa === copa);
    if (!fase) return false;
    return llaves.length > 0;
  };

  const availableCopas: TipoCopa[] = isAdmin
    ? ['oro', 'plata', 'bronce']
    : (['oro', 'plata', 'bronce'].filter(c =>
      hasLlavesInCopa(c as TipoCopa)
    ) as TipoCopa[]);

  if (availableCopas.length === 0 && !isAdmin) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="trophy-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyTitle}>No hay eliminatorias disponibles</Text>
        <Text style={styles.emptyText}>
          Las fases eliminatorias aparecerán cuando se creen las llaves correspondientes.
        </Text>
      </View>
    );
  }

  const renderPartido = (partido: Partido) => {
    if (!partido.equipo_local || !partido.equipo_visitante) {
      return null;
    }

    const hasResult = partido.marcador_local !== null && partido.marcador_local !== undefined &&
      partido.marcador_visitante !== null && partido.marcador_visitante !== undefined;

    const hayPenales = partido.fue_a_penales === true &&
      partido.penales_local !== null && partido.penales_local !== undefined &&
      partido.penales_visitante !== null && partido.penales_visitante !== undefined;

    let ganador: 'local' | 'visitante' | 'empate' | null = null;

    if (hasResult) {
      const golesLocal = partido.marcador_local!;
      const golesVisitante = partido.marcador_visitante!;

      if (hayPenales) {
        ganador = partido.penales_local! > partido.penales_visitante! ? 'local' :
          partido.penales_local! < partido.penales_visitante! ? 'visitante' : 'empate';
      } else {
        ganador = golesLocal > golesVisitante ? 'local' : golesLocal < golesVisitante ? 'visitante' : 'empate';
      }
    }

    return (
      <TouchableOpacity
        key={partido.id_partido}
        style={styles.partidoCard}
        onPress={() => isSuperAdmin ? handleEditPartido(partido) : null}
        activeOpacity={0.7}
      >
        <View style={styles.partidoHeader}>
          <View style={styles.partidoInfoRow}>
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

        {isSuperAdmin && (
          <View style={styles.adminActionsRow}>
            <TouchableOpacity
              style={styles.adminActionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleMatchLineup(partido);
              }}
            >
              <MaterialCommunityIcons name="clipboard-check" size={14} color={colors.primary} />
              <Text style={styles.adminActionText}>Lista</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminActionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleMatchSubstitutions(partido);
              }}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={14} color={colors.primary} />
              <Text style={styles.adminActionText}>Cambios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adminActionButton, styles.adminActionButtonPrimary]}
              onPress={(e) => {
                e.stopPropagation();
                handleLoadResult(partido);
              }}
            >
              <MaterialCommunityIcons name="scoreboard" size={14} color={colors.white} />
              <Text style={[styles.adminActionText, styles.adminActionTextPrimary]}>Resultado</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRonda = (rondaObj: any) => {
    const rondaKey = rondaObj.stage_eliminatoria || rondaObj.id_ronda;
    const isExpanded = expandedRondas[rondaKey];
    const gradientColors = getSubtipoGradient(selectedCopa) as [string, string, ...string[]];
    const titulo = rondaObj.nombre || 'Ronda';
    const partidosRonda = getPartidosByRonda(rondaObj.id_ronda);

    return (
      <View key={rondaObj.id_ronda} style={styles.rondaContainer}>
        <TouchableOpacity
          style={styles.rondaHeader}
          onPress={() => toggleRonda(rondaKey)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rondaHeaderGradient}
          >
            <View style={styles.rondaInfo}>
              <Text style={styles.rondaNombre}>{titulo}</Text>
            </View>
            <View style={styles.rondaStatsActions}>
              <View style={styles.rondaStats}>
                <Text style={styles.llavesCount}>{partidosRonda.length}</Text>
                <Text style={styles.llavesLabel}>partidos</Text>
              </View>
              {isSuperAdmin && (
                <TouchableOpacity
                  style={styles.deleteButtonGradient}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteRonda(rondaObj);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="delete" size={20} color={colors.white} />
                </TouchableOpacity>
              )}
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.white}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {isExpanded && (
          <>
            {isSuperAdmin && (
              <View style={styles.rondaActions}>
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleEditRonda(e, rondaObj)}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
                  <Text style={styles.rondaActionText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleAddPartido(e, rondaObj)}
                >
                  <MaterialCommunityIcons name="plus-circle" size={18} color={colors.success} />
                  <Text style={styles.rondaActionText}>Agregar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={(e) => handleExportRonda(e, rondaObj)}
                >
                  <MaterialCommunityIcons name="export" size={18} color={colors.info} />
                  <Text style={styles.rondaActionText}>Exportar</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.partidosList}>
              {partidosRonda.length === 0 ? (
                <View style={styles.emptyPartidos}>
                  <MaterialCommunityIcons name="soccer" size={48} color={colors.textLight} />
                  <Text style={styles.emptyText}>No hay partidos en esta ronda</Text>
                </View>
              ) : (
                partidosRonda.map((partido) => renderPartido(partido))
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  const rondasExistentes = [...rondasKnockout]
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

  // ============================================
  // MODAL PARA SELECCIONAR COPA
  // ============================================

  const renderCopaModal = () => (
    <Modal
      visible={showCopaModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCopaModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCopaModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecciona una Copa</Text>
          <Text style={styles.modalSubtitle}>
            Se creará la fase automáticamente si no existe
          </Text>

          <View style={styles.copasGrid}>
            {COPAS.map((copaInfo) => {
              const faseExistente = fasesKnockout.find((f) => f.copa === copaInfo.tipo);
              const isCreating = creatingFase === copaInfo.tipo;

              return (
                <TouchableOpacity
                  key={copaInfo.tipo}
                  style={styles.copaCard}
                  onPress={() => handleCopaSelect(copaInfo)}
                  activeOpacity={0.8}
                  disabled={isCreating}
                >
                  <LinearGradient
                    colors={copaInfo.gradiente as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.copaCardGradient}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name={copaInfo.icono as any}
                          size={32}
                          color={colors.white}
                        />
                        <Text style={styles.copaCardText}>{copaInfo.nombre}</Text>
                        {faseExistente && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={16}
                            color={colors.white}
                            style={styles.copaCheckIcon}
                          />
                        )}
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowCopaModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {(knockoutActivo || isAdmin) ? (
        <>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {isSuperAdmin && (
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <MaterialCommunityIcons
                    name={knockoutActivo ? "trophy" : "trophy-outline"}
                    size={24}
                    color={knockoutActivo ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchTitle}>
                      {knockoutActivo ? 'Knockout Activo' : 'Knockout Inactivo'}
                    </Text>
                    <Text style={styles.switchSubtitle}>
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

            {availableCopas.length > 1 && (
              <View style={styles.copaSelector}>
                {availableCopas.map(copa => {
                  const isSelected = selectedCopa === copa;
                  const gradientColors = getSubtipoGradient(copa);

                  return (
                    <TouchableOpacity
                      key={copa}
                      style={styles.copaButtonWrapper}
                      onPress={() => setSelectedCopa(copa)}
                      activeOpacity={0.8}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={gradientColors as [string, string, ...string[]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.copaButtonGradient}
                        >
                          <Text style={styles.copaTextSelected}>
                            {copa.toUpperCase()}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.copaButton}>
                          <Text style={styles.copaText}>
                            {copa.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {rondasExistentes.length === 0 ? (
              <View style={styles.emptyRondasContainer}>
                <MaterialCommunityIcons name="trophy-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyRondasText}>
                  {isSuperAdmin
                    ? 'No hay rondas creadas aún'
                    : 'No hay rondas disponibles en esta copa'}
                </Text>
                {isSuperAdmin && (
                  <Text style={styles.emptyRondasHint}>
                    Presiona el botón + para crear rondas
                  </Text>
                )}
              </View>
            ) : (
              rondasExistentes.map((ronda) => renderRonda(ronda))
            )}
          </ScrollView>

          {/* FAB que abre el modal de copas */}
          {isSuperAdmin && (
            <FAB
              onPress={handleFABPress}
              icon="add-circle"
              color={getSubtipoGradient(selectedCopa)[0]}
            />
          )}

          {/* Modal para seleccionar copa */}
          {renderCopaModal()}
        </>
      ) : (
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
  scrollContent: {
    paddingBottom: 80,
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
    padding: 20,
  },
  copaSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  copaButtonWrapper: {
    flex: 1,
  },
  copaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.backgroundGray,
  },
  copaButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  copaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  copaTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rondaContainer: {
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
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
    minHeight: 60,
  },
  rondaInfo: {
    flex: 1,
  },
  rondaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
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
  llavesCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  llavesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.9,
  },
  rondaActions: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    gap: 6,
  },
  rondaActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deleteButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
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
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  equipoNombre: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  equipoNombreGanador: {
    fontWeight: 'bold',
    color: colors.success,
  },
  emptyRondasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
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
  partidosList: {
    backgroundColor: colors.white,
  },
  emptyPartidos: {
    alignItems: 'center',
    padding: 32,
  },
  partidoCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partidoInfoRow: {
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
    gap: 4,
    marginBottom: 8,
  },
  canchaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  golesTextGanador: {
    color: colors.success,
    fontWeight: 'bold',
  },
  golesTextPerdedor: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  penalesTextSmall: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  adminActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adminActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    gap: 4,
  },
  adminActionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  adminActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  adminActionTextPrimary: {
    color: colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  copasGrid: {
    gap: 12,
  },
  copaCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  copaCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  copaCardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  copaCheckIcon: {
    opacity: 0.9,
  },
  modalCancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default KnockoutEmbed;
