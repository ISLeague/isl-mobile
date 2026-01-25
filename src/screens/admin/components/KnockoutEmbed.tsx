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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import {
  Eliminatoria,
  Partido,
  Equipo,
  TipoCopa,
  RondaEliminatoria
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
  const [rondasKnockout, setRondasKnockout] = useState<any[]>([]); // Rondas creadas desde backend

  useEffect(() => {
    loadData();
  }, [selectedCopa]);

  // Refresh data when screen comes back into focus (e.g., after creating knockout)
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
        // Cargar fases knockout de esta edición categoría
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

        // Buscar fase de la copa seleccionada
        const faseActual = fasesKO.find((f: any) => f.copa === selectedCopa);
        console.log('🎯 [KnockoutEmbed] Fase actual para copa', selectedCopa, ':', faseActual);

        if (!faseActual) {
          console.warn('⚠️ [KnockoutEmbed] No se encontró fase knockout para copa:', selectedCopa);
          return { llaves: [], partidos: [], equipos: [], fases: fasesKO };
        }

        // Cargar llaves de esta fase
        console.log('🔑 [KnockoutEmbed] Cargando llaves para id_fase:', faseActual.id_fase);
        const llavesResponse = await api.eliminatorias.list({ id_fase: faseActual.id_fase });
        console.log('🔑 [KnockoutEmbed] Respuesta llaves:', llavesResponse);

        const llavesData = llavesResponse.success && llavesResponse.data?.todas_las_llaves
          ? llavesResponse.data.todas_las_llaves
          : [];
        console.log(`🔑 [KnockoutEmbed] Total llaves cargadas: ${llavesData.length}`);
        llavesData.forEach((ll: any, idx: number) => {
          console.log(`   ${idx + 1}. Ronda: ${ll.ronda} | Llave #${ll.numero_llave} | ID: ${ll.id_eliminatoria} | Estado: ${ll.estado}`);
        });

        // Cargar partidos de knockout (con la nueva acción agrupada)
        console.log('⚽ [KnockoutEmbed] Cargando partidos knockout...');
        const knockoutResponse = await api.partidos.listKnockout(idEdicionCategoria || 1, selectedCopa);
        console.log('⚽ [KnockoutEmbed] Respuesta partidos knockout:', knockoutResponse);

        let allKnockoutPartidos: any[] = [];

        if (knockoutResponse && knockoutResponse.success && knockoutResponse.data?.partidos_por_etapa) {
          const porEtapa = knockoutResponse.data.partidos_por_etapa;
          console.log('⚽ [KnockoutEmbed] Partidos por etapa:', {
            eliminatoria: (porEtapa.eliminatoria || []).length,
            '16avos': (porEtapa['16avos'] || []).length,
            octavos: (porEtapa.octavos || []).length,
            cuartos: (porEtapa.cuartos || []).length,
            semifinal: (porEtapa.semifinal || []).length,
            final: (porEtapa.final || []).length,
          });

          allKnockoutPartidos = [
            ...(porEtapa.eliminatoria || []),
            ...(porEtapa['16avos'] || []),
            ...(porEtapa.octavos || []),
            ...(porEtapa.cuartos || []),
            ...(porEtapa.semifinal || []),
            ...(porEtapa.final || []),
          ];
          console.log(`⚽ [KnockoutEmbed] Total partidos knockout: ${allKnockoutPartidos.length}`);
        } else {
          console.warn('⚠️ [KnockoutEmbed] No se recibieron partidos knockout o estructura inválida');
        }

        // Cargar equipos
        console.log('👥 [KnockoutEmbed] Cargando equipos...');
        const equiposResponse = await api.equipos.list(idEdicionCategoria || 1);
        const allEquipos = equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];
        console.log(`👥 [KnockoutEmbed] Total equipos: ${allEquipos.length}`);

        // Cargar rondas de knockout de la fase actual
        console.log('📅 [KnockoutEmbed] Cargando rondas de knockout...');
        console.log('📅 [KnockoutEmbed] Copa seleccionada para filtrar:', selectedCopa);
        let rondasKO: any[] = [];
        if (faseActual) {
          const rondasResponse = await api.rondas.list({ id_fase: faseActual.id_fase, tipo_ronda: 'eliminatorias' });
          if (rondasResponse.success && rondasResponse.data) {
            const todasLasRondas = Array.isArray(rondasResponse.data) ? rondasResponse.data : rondasResponse.data.rondas || [];
            console.log(`📅 [KnockoutEmbed] Rondas knockout totales en fase: ${todasLasRondas.length}`);

            // FILTRAR por copa seleccionada (subtipo_eliminatoria)
            rondasKO = todasLasRondas.filter((r: any) => r.subtipo_eliminatoria === selectedCopa);
            console.log(`📅 [KnockoutEmbed] Rondas filtradas por copa "${selectedCopa}": ${rondasKO.length}`);

            rondasKO.forEach((r: any, idx: number) => {
              console.log(`   ${idx + 1}. ${r.nombre} | Tipo: ${r.tipo} | Subtipo: ${r.subtipo_eliminatoria || 'N/A'} | Stage: ${r.stage_eliminatoria || 'N/A'}`);
            });
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
      console.log('✅ [KnockoutEmbed] Datos cargados exitosamente');
      console.log(`   - Llaves: ${result.llaves.length}`);
      console.log(`   - Partidos: ${result.partidos.length}`);
      console.log(`   - Equipos: ${result.equipos.length}`);
      console.log(`   - Fases KO: ${result.fases.length}`);
      console.log(`   - Rondas KO: ${(result.rondas ?? []).length}`);

      setLlaves(result.llaves ?? []);
      setPartidos(result.partidos ?? []);
      setEquipos(result.equipos ?? []);
      setFasesKnockout(result.fases ?? []);
      setRondasKnockout(result.rondas ?? []);
    } else {
      console.error('❌ [KnockoutEmbed] No se recibió resultado válido');
    }
    setLoading(false);
  };

  

  const toggleRonda = (rondaKey: string | number) => {
    setExpandedRondas(prev => ({
      ...prev,
      [rondaKey]: !prev[rondaKey],
    }));
  };

  const getLlavesByRonda = (ronda: string): Eliminatoria[] => {
    return llaves.filter(l => l.ronda === ronda);
  };

  const getPartidoByLlave = (llave: Eliminatoria): Partido | null => {
    // Buscar partido por id_eliminatoria
    return partidos.find(p => p.id_eliminatoria === llave.id_eliminatoria) || null;
  };

  const getPartidosByRonda = (idRonda: number): Partido[] => {
    // Obtener todos los partidos de una ronda
    return partidos.filter(p => p.id_ronda === idRonda);
  };

  const handleCreateLlave = (ronda: string) => {
    // Navegar a pantalla de crear llave
    const faseActual = fasesKnockout.find(f => f.copa === selectedCopa);
    if (!faseActual) {
      showError('Primero debes crear una fase de knockout para esta copa');
      return;
    }

    navigation.navigate('CreateLlave', {
      idFase: faseActual.id_fase,
      ronda,
      copa: selectedCopa,
      idEdicionCategoria,
    });
  };

  // ============================================
  // HANDLERS PARA ACCIONES DE RONDA (REPLICADO DE FIXTURE)
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
  // HANDLERS PARA ACCIONES DE PARTIDO (REPLICADO DE FIXTURE)
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

  const handleCreatePartidoForLlave = (llave: Eliminatoria) => {
    // Navegar a crear partido para esta llave
    const faseActual = fasesKnockout.find(f => f.copa === selectedCopa);
    navigation.navigate('CreatePartido', {
      idFase: faseActual?.id_fase,
      idEdicionCategoria,
      llave, // Pasar la llave para prellenar equipos
    });
  };

  // Verificar si hay llaves para cada copa
  const hasLlavesInCopa = (copa: TipoCopa) => {
    const fase = fasesKnockout.find(f => f.copa === copa);
    if (!fase) return false;
    return llaves.length > 0; // Si hay fase, verificar si tiene llaves
  };

  // Filtrar copas disponibles
  const availableCopas: TipoCopa[] = isAdmin
    ? ['oro', 'plata', 'bronce']
    : (['oro', 'plata', 'bronce'].filter(c =>
      hasLlavesInCopa(c as TipoCopa)
    ) as TipoCopa[]);

  // Si no hay ninguna copa con llaves para fans, mostrar mensaje vacío
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

  const renderLlave = (llave: Eliminatoria, index: number) => {
    const partido = getPartidoByLlave(llave);

    // Priorizar datos del partido (incluye logos y nombres actualizados)
    // Type helper: both structures have id_equipo, nombre, and logo
    type EquipoDisplay = { id_equipo: number; nombre: string; logo?: string };
    const displayEquipoA: EquipoDisplay | undefined = partido?.equipo_local || equipos.find(e => e.id_equipo === llave.id_equipo_a);
    const displayEquipoB: EquipoDisplay | undefined = partido?.equipo_visitante || equipos.find(e => e.id_equipo === llave.id_equipo_b);

    const equipoGanador = equipos.find(e => e.id_equipo === llave.id_equipo_ganador);

    return (
      <View key={`llave-${llave.id_eliminatoria}-${index}`} style={styles.llaveCard}>
        <View style={styles.llaveHeader}>
          <Text style={styles.llaveNumero}>Llave {llave.numero_llave}</Text>
          <View style={[
            styles.estadoBadge,
            llave.estado === 'finalizado' && styles.estadoBadgeFinalizado,
            llave.estado === 'en_curso' && styles.estadoBadgeEnCurso,
          ]}>
            <Text style={[
              styles.estadoText,
              llave.estado === 'finalizado' && styles.estadoTextFinalizado,
              llave.estado === 'en_curso' && styles.estadoTextEnCurso,
            ]}>
              {llave.estado}
            </Text>
          </View>
        </View>

        <View style={styles.equiposContainer}>
          {/* Equipo A */}
          <View style={styles.equipoRow}>
            {displayEquipoA ? (
              <>
                <Image
                  source={displayEquipoA.logo ? { uri: displayEquipoA.logo } : require('../../../assets/InterLOGO.png')}
                  style={styles.equipoLogo}
                />
                <Text style={[
                  styles.equipoNombre,
                  llave.id_equipo_ganador === displayEquipoA?.id_equipo && styles.equipoNombreGanador
                ]} numberOfLines={1}>
                  {displayEquipoA.nombre}
                </Text>
                {partido && (partido.marcador_local !== null || partido.marcador_visitante !== null) && (
                  <Text style={[
                    styles.equipoResultado,
                    llave.id_equipo_ganador === displayEquipoA?.id_equipo && styles.equipoResultadoGanador
                  ]}>
                    {partido.marcador_local ?? 0}
                    {partido.fue_a_penales && partido.penales_local !== null && (
                      <Text style={styles.penalesText}> ({partido.penales_local})</Text>
                    )}
                  </Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.equipoPorDefinir}>
                  <MaterialCommunityIcons name="help-circle" size={20} color={colors.textLight} />
                </View>
                <Text style={styles.equipoPorDefinirText}>
                  {llave.origen_a || 'Por definir'}
                </Text>
              </>
            )}
            {llave.id_equipo_ganador && displayEquipoA && displayEquipoA.id_equipo === llave.id_equipo_ganador && (
              <MaterialCommunityIcons name="trophy" size={16} color={colors.warning} />
            )}
          </View>

          <Text style={styles.vsText}>vs</Text>

          {/* Equipo B */}
          <View style={styles.equipoRow}>
            {displayEquipoB ? (
              <>
                <Image
                  source={displayEquipoB.logo ? { uri: displayEquipoB.logo } : require('../../../assets/InterLOGO.png')}
                  style={styles.equipoLogo}
                />
                <Text style={[
                  styles.equipoNombre,
                  llave.id_equipo_ganador === displayEquipoB?.id_equipo && styles.equipoNombreGanador
                ]} numberOfLines={1}>
                  {displayEquipoB.nombre}
                </Text>
                {partido && (partido.marcador_local !== null || partido.marcador_visitante !== null) && (
                  <Text style={[
                    styles.equipoResultado,
                    llave.id_equipo_ganador === displayEquipoB?.id_equipo && styles.equipoResultadoGanador
                  ]}>
                    {partido.marcador_visitante ?? 0}
                    {partido.fue_a_penales && partido.penales_visitante !== null && (
                      <Text style={styles.penalesText}> ({partido.penales_visitante})</Text>
                    )}
                  </Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.equipoPorDefinir}>
                  <MaterialCommunityIcons name="help-circle" size={20} color={colors.textLight} />
                </View>
                <Text style={styles.equipoPorDefinirText}>
                  {llave.origen_b || 'Por definir'}
                </Text>
              </>
            )}
            {llave.id_equipo_ganador && displayEquipoB && displayEquipoB.id_equipo === llave.id_equipo_ganador && (
              <MaterialCommunityIcons name="trophy" size={16} color={colors.warning} />
            )}
          </View>
        </View>

        {partido && (
          <View style={styles.partidoInfo}>
            <View style={styles.partidoDetalle}>
              <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
              <Text style={styles.partidoDetalleText}>{partido.fecha || 'Fecha Pendiente'}</Text>
            </View>
            <View style={styles.partidoDetalle}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.partidoDetalleText}>{partido.hora?.substring(0, 5) || 'Hora Pendiente'}</Text>
            </View>
            <View style={styles.partidoDetalle}>
              <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
              <Text style={styles.partidoDetalleText} numberOfLines={1}>
                {partido.cancha?.nombre || 'Cancha Pendiente'}
              </Text>
            </View>
          </View>
        )}

        {equipoGanador && (
          <View style={styles.ganadorContainer}>
            <MaterialCommunityIcons name="trophy" size={16} color={colors.success} />
            <Text style={styles.ganadorText}>
              Ganador: {equipoGanador.nombre}
            </Text>
          </View>
        )}

        {/* Botones de acción para admin */}
        {isAdmin && (
          <View style={styles.llaveActions}>
            {partido ? (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditPartido(partido)}
                >
                  <MaterialCommunityIcons name="pencil" size={14} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleMatchLineup(partido)}
                >
                  <MaterialCommunityIcons name="clipboard-check" size={14} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Lista</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleMatchSubstitutions(partido)}
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={14} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Cambios</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => handleLoadResult(partido)}
                >
                  <MaterialCommunityIcons name="scoreboard" size={14} color={colors.white} />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>Resultado</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCreatePartidoForLlave(llave)}
              >
                <MaterialCommunityIcons name="plus-circle" size={16} color={colors.success} />
                <Text style={styles.actionButtonText}>Crear Partido</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // ============================================
  // RENDER PARTIDO (REPLICADO DE FIXTURE)
  // ============================================
  const renderPartido = (partido: Partido) => {
    // Safety check: ensure team data exists
    if (!partido.equipo_local || !partido.equipo_visitante) {
      return null;
    }

    // Determinar ganador considerando penales
    const hasResult = partido.marcador_local !== null && partido.marcador_local !== undefined &&
      partido.marcador_visitante !== null && partido.marcador_visitante !== undefined;

    const hayPenales = partido.fue_a_penales === true &&
      partido.penales_local !== null && partido.penales_local !== undefined &&
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

        {/* Cancha info */}
        {partido.cancha && (
          <View style={styles.canchaContainer}>
            <MaterialCommunityIcons name="soccer-field" size={14} color={colors.textSecondary} />
            <Text style={styles.canchaText}>{partido.cancha.nombre}</Text>
          </View>
        )}

        <View style={styles.equiposContainer}>
          {/* Equipo Local */}
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

          {/* Equipo Visitante */}
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

        {/* Botones de acciones (Lista, Cambios, Resultado) */}
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
    // Usar el objeto de ronda directamente del backend
    const rondaKey = rondaObj.stage_eliminatoria || rondaObj.id_ronda;
    const isExpanded = expandedRondas[rondaKey];
    const gradientColors = getSubtipoGradient(selectedCopa) as [string, string, ...string[]];

    // Obtener título de la ronda
    const titulo = rondaObj.nombre || 'Ronda';

    // Obtener partidos de esta ronda directamente
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
              {/* Botón de eliminar ronda en el header (replicado de Fixture) */}
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
            {/* Botones de acciones de ronda (REPLICADO DE FIXTURE) */}
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

            {/* Lista de partidos (igual que Fixture) */}
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

  // Usar directamente las rondas del backend (ya filtradas por copa)
  // Ordenarlas por orden
  const rondasExistentes = [...rondasKnockout]
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

  console.log('📋 [KnockoutEmbed] Rondas a mostrar:', rondasExistentes.length);
  rondasExistentes.forEach((r) => {
    console.log(`   - ${r.nombre} (stage: ${r.stage_eliminatoria}, subtipo: ${r.subtipo_eliminatoria})`);
  });

  return (
    <View style={styles.container}>
      {/* Mostrar contenido solo si el knockout está activo o si es admin */}
      {(knockoutActivo || isAdmin) ? (
        <>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Switch para activar/desactivar Knockout (solo superadmin) */}
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

            {/* Selector de Copa */}
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

            {/* Rondas */}
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
                    Crea rondas para comenzar
                  </Text>
                )}
              </View>
            ) : (
              rondasExistentes.map((ronda) => renderRonda(ronda))
            )}
          </ScrollView>

          {/* FAB para crear/configurar knockout (solo superadmin) */}
          {isSuperAdmin && (
            <FAB
              onPress={() => {
                navigation.navigate('CreateFase', {
                  idEdicionCategoria,
                  tipo: 'knockout',
                  copa: selectedCopa,
                });
              }}
              icon="add-circle"
              color={getSubtipoGradient(selectedCopa)[0]}
            />
          )}
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
  llavesList: {
    padding: 12,
    gap: 12,
  },
  llaveCard: {
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  llaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  llaveNumero: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
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
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  equipoPorDefinir: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
  equipoPorDefinirText: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 4,
  },
  ganadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ganadorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  partidoInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  partidoDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partidoDetalleText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  equipoResultado: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  equipoResultadoGanador: {
    color: colors.success,
  },
  penalesText: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textLight,
  },
  llaveActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionButtonTextPrimary: {
    color: colors.white,
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
  // Estilos para partidos (replicados de Fixture)
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
});

export default KnockoutEmbed;
