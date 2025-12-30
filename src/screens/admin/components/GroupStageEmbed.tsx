import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Card, SearchBar, FAB } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { Grupo, Clasificacion, Equipo, ConfiguracionClasificacion, GrupoDetallado } from '../../../api/types';
import { AddTeamToGroupModal } from './AddTeamToGroupModal';
import { AsignarEquiposModal } from './AsignarEquiposModal';
import { MoveTeamToGroupModal } from './MoveTeamToGroupModal';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../api';

interface GroupStageEmbedProps {
  navigation: any;
  isAdmin?: boolean;
  idFase?: number;
  idEdicionCategoria?: number;
}

// Función helper para determinar el color de clasificación basado en la posición y configuración del grupo
const getClasificacionColor = (posicion: number, grupo: Grupo) => {
  const equiposOro = grupo.equipos_pasan_oro || 0;
  const equiposPlata = grupo.equipos_pasan_plata || 0;
  const equiposBronce = grupo.equipos_pasan_bronce || 0;

  // Primeras posiciones van a Oro (dorado)
  if (posicion <= equiposOro) {
    return '#FFD700'; // Dorado
  }

  // Siguientes posiciones van a Plata (plateado)
  if (posicion <= equiposOro + equiposPlata) {
    return '#C0C0C0'; // Plateado
  }

  if (posicion <= equiposOro + equiposPlata + equiposBronce) {
    return '#CD7F32'; // Bronce
  }

  // Resto de equipos (no clasifican) - gris muy claro casi blanco
  return '#F5F5F5';
};

export const GroupStageEmbed: React.FC<GroupStageEmbedProps> = ({ navigation, isAdmin = false, idFase, idEdicionCategoria }) => {
  console.log('🎨 [GroupStageEmbed] Renderizado - Props recibidas:', { idFase, idEdicionCategoria, isAdmin });

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [clasificaciones, setClasificaciones] = useState<{ [grupoId: number]: (Clasificacion & { equipo: Equipo })[] }>({});
  const [configuracionClasificacion, setConfiguracionClasificacion] = useState<ConfiguracionClasificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRules, setExpandedRules] = useState<{ [key: number]: boolean }>({});
  const [addTeamModalVisible, setAddTeamModalVisible] = useState(false);
  const [asignarEquiposModalVisible, setAsignarEquiposModalVisible] = useState(false);
  const [moveTeamModalVisible, setMoveTeamModalVisible] = useState(false);
  const [editReglasModalVisible, setEditReglasModalVisible] = useState(false);
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
  const [selectedGrupoNombre, setSelectedGrupoNombre] = useState<string>('');
  const [selectedClasificacion, setSelectedClasificacion] = useState<(Clasificacion & { equipo: Equipo }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para editar reglas
  const [equiposOro, setEquiposOro] = useState('');
  const [equiposPlata, setEquiposPlata] = useState('');
  const [equiposBronce, setEquiposBronce] = useState('');
  const [posicionesOro, setPosicionesOro] = useState('');
  const [posicionesPlata, setPosicionesPlata] = useState('');
  const [posicionesBronce, setPosicionesBronce] = useState('');
  const [descripcionReglas, setDescripcionReglas] = useState('');
  const [savingReglas, setSavingReglas] = useState(false);

  const { showSuccess, showError, showWarning } = useToast();

  const loadGruposAndClasificacion = useCallback(async () => {
    if (!idFase) {
      showError('No se ha especificado la fase');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📥 [GroupStageEmbed] Cargando información completa de grupos para fase:', idFase);

      // Usar el nuevo endpoint que trae toda la información de una vez
      const response = await api.grupos.get(idFase);
      console.log('📥 [GroupStageEmbed] Respuesta recibida del API:', response);

      if (response.success && response.data) {
        console.log('✅ [GroupStageEmbed] Datos recibidos:', response.data);

        // Guardar configuración de clasificación
        setConfiguracionClasificacion(response.data.configuracion_clasificacion);

        // Convertir GrupoDetallado[] a Grupo[] para compatibilidad
        const gruposSimplificados: Grupo[] = response.data.grupos.map((grupoDetallado: GrupoDetallado) => ({
          id_grupo: grupoDetallado.id_grupo,
          nombre: grupoDetallado.nombre,
          id_fase: response.data.fase.id_fase,
          cantidad_equipos: grupoDetallado.cantidad_equipos,
          equipos_pasan_oro: response.data.configuracion_clasificacion.equipos_oro,
          equipos_pasan_plata: response.data.configuracion_clasificacion.equipos_plata,
          equipos_pasan_bronce: response.data.configuracion_clasificacion.equipos_bronce,
        }));

        setGrupos(gruposSimplificados);

        // Construir mapa de clasificaciones desde los equipos asignados
        const clasificacionesMap: { [grupoId: number]: (Clasificacion & { equipo: Equipo })[] } = {};

        response.data.grupos.forEach((grupoDetallado: GrupoDetallado) => {
          // Mapear equipos asignados a clasificaciones
          const clasificacionesGrupo = grupoDetallado.equipos.map(equipoGrupo => {
            const clasificacion = equipoGrupo.clasificacion[0] || {
              // Valores por defecto si no hay clasificación
              id_clasificacion: 0,
              id_equipo: equipoGrupo.equipo.id_equipo,
              id_grupo: grupoDetallado.id_grupo,
              posicion: null,
              pj: 0, pg: 0, pe: 0, pp: 0,
              gf: 0, gc: 0, dif: 0, puntos: 0,
              tarjetas_amarillas: 0,
              tarjetas_rojas: 0,
            };

            return {
              ...clasificacion,
              equipo: equipoGrupo.equipo,
            };
          });

          // Ordenar por posición (nulls al final) y luego por puntos
          clasificacionesGrupo.sort((a, b) => {
            if (a.posicion === null && b.posicion === null) return b.puntos - a.puntos;
            if (a.posicion === null) return 1;
            if (b.posicion === null) return -1;
            return a.posicion - b.posicion;
          });

          clasificacionesMap[grupoDetallado.id_grupo] = clasificacionesGrupo;
        });

        setClasificaciones(clasificacionesMap);

        console.log('✅ [GroupStageEmbed] Grupos y clasificaciones cargados:', {
          totalGrupos: gruposSimplificados.length,
          totalEquipos: response.data.resumen.total_equipos,
          configuracion: response.data.configuracion_clasificacion,
        });
      }
    } catch (error) {
      console.error('❌ [GroupStageEmbed] Error loading groups:', error);
      showError('Error al cargar los grupos');
    } finally {
      setLoading(false);
    }
  }, [idFase, showError]);

  useEffect(() => {
    loadGruposAndClasificacion();
  }, [loadGruposAndClasificacion]);

  const handleCreateGroup = () => {
    console.log('🔍 [GroupStageEmbed] handleCreateGroup - idEdicionCategoria:', idEdicionCategoria);

    if (!idEdicionCategoria) {
      Alert.alert('Error', 'No se pudo obtener el ID de la edición categoría');
      return;
    }

    navigation.navigate('CreateGroupsFlow', { idEdicionCategoria });
  };

  const handleDeleteGroup = async (grupo: Grupo) => {
    const equiposEnGrupo = clasificaciones[grupo.id_grupo]?.length || 0;

    Alert.alert(
      'Eliminar Grupo',
      equiposEnGrupo > 0
        ? `¿Deseas eliminar el grupo "${grupo.nombre}"? Tiene ${equiposEnGrupo} equipos asignados que también serán removidos.`
        : `¿Deseas eliminar el grupo "${grupo.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.grupos.delete(grupo.id_grupo, equiposEnGrupo > 0);

              if (response.success) {
                showSuccess(`Grupo "${grupo.nombre}" eliminado exitosamente`);
                loadGruposAndClasificacion(); // Recargar datos
              }
            } catch (error) {
              console.error('Error eliminando grupo:', error);
              showError('Error al eliminar el grupo');
            }
          },
        },
      ]
    );
  };

  const handleEditReglas = () => {
    if (!configuracionClasificacion || !idFase) {
      showError('No hay configuración de clasificación disponible');
      return;
    }

    // Cargar valores actuales en el formulario
    setEquiposOro(String(configuracionClasificacion.equipos_oro));
    setEquiposPlata(String(configuracionClasificacion.equipos_plata));
    setEquiposBronce(String(configuracionClasificacion.equipos_bronce));
    setPosicionesOro(configuracionClasificacion.posiciones_oro);
    setPosicionesPlata(configuracionClasificacion.posiciones_plata);
    setPosicionesBronce(configuracionClasificacion.posiciones_bronce);
    setDescripcionReglas(configuracionClasificacion.descripcion);

    // Abrir modal
    setEditReglasModalVisible(true);
  };

  const handleSaveReglas = async () => {
    if (!idFase) {
      showError('No se puede actualizar las reglas sin ID de fase');
      return;
    }

    setSavingReglas(true);

    try {
      const updateData = {
        equipos_oro: parseInt(equiposOro) || undefined,
        equipos_plata: parseInt(equiposPlata) || undefined,
        equipos_bronce: parseInt(equiposBronce) || undefined,
        posiciones_oro: posicionesOro.trim() || undefined,
        posiciones_plata: posicionesPlata.trim() || undefined,
        posiciones_bronce: posicionesBronce.trim() || undefined,
        descripcion: descripcionReglas.trim() || undefined,
      };

      console.log('🔧 Actualizando reglas:', updateData);

      const response = await api.grupos.updateReglas(idFase, updateData);

      if (response.success) {
        showSuccess('Reglas de clasificación actualizadas exitosamente');
        setEditReglasModalVisible(false);
        loadGruposAndClasificacion(); // Recargar datos
      }
    } catch (error) {
      console.error('Error actualizando reglas:', error);
      showError('Error al actualizar las reglas de clasificación');
    } finally {
      setSavingReglas(false);
    }
  };

  const handleAddTeamToGroup = (grupoId: number) => {
    const grupo = grupos.find(g => g.id_grupo === grupoId);
    setSelectedGrupoId(grupoId);
    setSelectedGrupoNombre(grupo?.nombre || '');
    setAsignarEquiposModalVisible(true);
  };

  const handleRemoveTeamFromGroup = (clasificacionId: number, equipoNombre: string) => {
    Alert.alert(
      'Eliminar Equipo',
      `Â¿Deseas remover "${equipoNombre}" del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            console.log('Remover equipo del grupo:', clasificacionId);
            // TODO: Llamar a la API para remover el equipo del grupo
            // await api.groups.removeTeamFromGroup(clasificacionId);
            showSuccess('Equipo removido del grupo');
          },
        },
      ]
    );
  };

  const handleMoveTeam = (clasificacion: Clasificacion & { equipo: Equipo }) => {
    setSelectedClasificacion(clasificacion);
    setMoveTeamModalVisible(true);
  };

  const handleConfirmMoveTeam = (targetGrupoId: number) => {
    if (!selectedClasificacion) return;

    const targetGrupo = grupos.find(g => g.id_grupo === targetGrupoId);
    
    Alert.alert(
      'Confirmar Movimiento',
      `Â¿Mover "${selectedClasificacion.equipo.nombre}" a "${targetGrupo?.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover',
          onPress: () => {
            console.log('Mover equipo', selectedClasificacion.id_equipo, 'al grupo', targetGrupoId);
            // TODO: Llamar a la API para mover el equipo
            // await api.groups.moveTeamToGroup(selectedClasificacion.id_clasificacion, targetGrupoId);
            showSuccess(`Equipo movido a ${targetGrupo?.nombre}`);
            setMoveTeamModalVisible(false);
            setSelectedClasificacion(null);
          },
        },
      ]
    );
  };

  const handleAddTeam = (equipoId: number) => {
    if (!selectedGrupoId) return;
    
    console.log('Agregar equipo', equipoId, 'al grupo', selectedGrupoId);
    // TODO: Llamar a la API para agregar el equipo al grupo
    // await api.groups.addTeamToGroup(selectedGrupoId, equipoId);
  };

  const getEquiposByGrupo = (id_grupo: number): (Clasificacion & { equipo: Equipo })[] => {
    const grupoClasificacion = clasificaciones[id_grupo] || [];

    return grupoClasificacion
      .filter((c) => {
        // Filtrar por búsqueda si hay query
        if (!searchQuery) return true;
        const equipoNombre = c.equipo?.nombre?.toLowerCase() || '';
        return equipoNombre.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        if (a.posicion === null && b.posicion === null) return 0;
        if (a.posicion === null) return 1;
        if (b.posicion === null) return -1;
        return a.posicion - b.posicion;
      });
  };

  const handleTeamPress = (equipoId: number) => {
    console.log('GroupStageEmbed - handleTeamPress called, equipoId:', equipoId);
    try {
      navigation.navigate('TeamDetail', { equipoId });
    } catch (error) {
      console.error('GroupStageEmbed - Navigation error:', error);
    }
  };

  const renderClasificacionIndicator = (posicion: number, grupo: Grupo) => {
    const color = getClasificacionColor(posicion, grupo);
    const isEliminated = color === '#F5F5F5';
    const textColor = isEliminated ? colors.textSecondary : colors.white;
    
    return (
      <View style={[
        styles.posicionCircle, 
        { backgroundColor: color, borderWidth: isEliminated ? 1 : 0, borderColor: colors.border }
      ]}>
        <Text style={[styles.posicionText, { color: textColor }]}>{posicion}</Text>
      </View>
    );
  };

  const renderRightActions = (clasificacion: Clasificacion & { equipo: Equipo }) => (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-180, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-180, -20, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });

    const translateX = dragX.interpolate({
      inputRange: [-180, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeActionsContainer,
          {
            opacity,
            transform: [{ translateX }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.swipeActionButton, styles.swipeMoveButton]}
          onPress={() => handleMoveTeam(clasificacion)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.white} />
          <Text style={styles.swipeActionText}>Mover</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeActionButton, styles.swipeDeleteButton]}
          onPress={() => handleRemoveTeamFromGroup(clasificacion.id_clasificacion, clasificacion.equipo.nombre)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="delete" size={24} color={colors.white} />
          <Text style={styles.swipeActionText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEquipoRow = (clasificacion: Clasificacion & { equipo: Equipo }, grupo: Grupo) => {
    // Usar una key única basada en id_equipo y id_grupo en lugar de id_clasificacion
    const uniqueKey = `${grupo.id_grupo}-${clasificacion.id_equipo}`;

    const content = (
      <TouchableOpacity
        style={styles.tableRow}
        onPress={() => handleTeamPress(clasificacion.id_equipo)}
        activeOpacity={0.7}
        accessible={true}
      >
        {renderClasificacionIndicator(clasificacion.posicion ?? 0, grupo)}
        <Image
          source={clasificacion.equipo.logo ? { uri: clasificacion.equipo.logo } : require('../../../assets/InterLOGO.png')}
          style={styles.equipoLogo}
          resizeMode="cover"
        />
        <View style={[styles.equipoCell, styles.equipoCol]}>
          <Text style={styles.equipoNombre}>
            {clasificacion.equipo.nombre}
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.tableText}>{clasificacion.pj}</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.tableText}>
            {clasificacion.dif > 0 ? `+${clasificacion.dif}` : clasificacion.dif}
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.tableText}>{clasificacion.puntos}</Text>
        </View>
      </TouchableOpacity>
    );

    if (isAdmin) {
      return (
        <Swipeable
          key={uniqueKey}
          renderRightActions={renderRightActions(clasificacion)}
          rightThreshold={40}
          overshootRight={false}
          friction={1.5}
          overshootFriction={8}
          enableTrackpadTwoFingerGesture
        >
          {content}
        </Swipeable>
      );
    }

    return <View key={uniqueKey}>{content}</View>;
  };

  const handleGrupoPress = (grupo: Grupo) => {
    // Obtener las clasificaciones de este grupo
    const clasificacionesGrupo = clasificaciones[grupo.id_grupo] || [];

    navigation.navigate('GrupoDetail', {
      grupo: grupo,
      clasificaciones: clasificacionesGrupo,
      nombreGrupo: grupo.nombre,
    });
  };

  const renderGrupo = (grupo: Grupo) => {
    const equipos = getEquiposByGrupo(grupo.id_grupo);

    return (
      <Card key={grupo.id_grupo} style={styles.grupoCard}>
        {/* Header del grupo */}
        <View style={styles.grupoHeader}>
          <TouchableOpacity
            style={styles.grupoNombreContainer}
            onPress={() => handleGrupoPress(grupo)}
            activeOpacity={0.7}
          >
            <Text style={styles.grupoNombre}>{grupo.nombre}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {isAdmin && (
            <View style={styles.grupoActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleAddTeamToGroup(grupo.id_grupo)}
              >
                <MaterialCommunityIcons name="account-plus" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDeleteGroup(grupo)}
              >
                <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.posCol}>
              <Text style={styles.tableHeaderText}>#</Text>
            </View>
            <Text style={[styles.tableHeaderText, styles.equipoCol]}>Equipo</Text>
            <View style={styles.statCol}>
              <Text style={styles.tableHeaderText}>P</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.tableHeaderText}>DIFF</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.tableHeaderText}>PTS</Text>
            </View>
          </View>

          {equipos.map((clasificacion) => renderEquipoRow(clasificacion, grupo))}
        </View>

        {/* SecciÃ³n de Reglas - Collapsible */}
        <TouchableOpacity
          style={styles.rulesToggle}
          onPress={() => setExpandedRules(prev => ({ ...prev, [grupo.id_grupo]: !prev[grupo.id_grupo] }))}
          activeOpacity={0.7}
        >
          <Text style={styles.rulesToggleText}>Reglas de Clasificación</Text>
          <MaterialCommunityIcons
            name={expandedRules[grupo.id_grupo] ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {expandedRules[grupo.id_grupo] && configuracionClasificacion && (
          <View style={styles.rulesContent}>
            <Text style={styles.rulesTitle}>Sistema de Clasificación</Text>
            <Text style={styles.rulesText}>
              Los equipos clasifican según su posición en el grupo:
            </Text>

            <View style={styles.rulesSection}>
              {/* Reglas para Copa de Oro */}
              {configuracionClasificacion.equipos_oro > 0 && (
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#FFD700', borderColor: '#DAA520' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>Posiciones {configuracionClasificacion.posiciones_oro}:</Text>{' '}
                    Clasifican a Copa de Oro ({configuracionClasificacion.equipos_oro}{' '}
                    {configuracionClasificacion.equipos_oro === 1 ? 'equipo' : 'equipos'})
                  </Text>
                </View>
              )}

              {/* Reglas para Copa de Plata */}
              {configuracionClasificacion.equipos_plata > 0 && (
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#C0C0C0', borderColor: '#A0A0A0' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>Posiciones {configuracionClasificacion.posiciones_plata}:</Text>{' '}
                    Clasifican a Copa de Plata ({configuracionClasificacion.equipos_plata}{' '}
                    {configuracionClasificacion.equipos_plata === 1 ? 'equipo' : 'equipos'})
                  </Text>
                </View>
              )}

              {/* Reglas para Copa de Bronce */}
              {configuracionClasificacion.equipos_bronce > 0 && (
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#CD7F32', borderColor: '#8B4513' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>Posiciones {configuracionClasificacion.posiciones_bronce}:</Text>{' '}
                    Clasifican a Copa de Bronce ({configuracionClasificacion.equipos_bronce}{' '}
                    {configuracionClasificacion.equipos_bronce === 1 ? 'equipo' : 'equipos'})
                  </Text>
                </View>
              )}

              {/* Equipos eliminados */}
              {(configuracionClasificacion.equipos_oro + configuracionClasificacion.equipos_plata + configuracionClasificacion.equipos_bronce) < (grupo.cantidad_equipos || 0) && (
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#F5F5F5', borderColor: colors.border }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>Resto:</Text> No clasifican
                  </Text>
                </View>
              )}
            </View>

            {/* Descripción desde la base de datos */}
            {configuracionClasificacion.descripcion && (
              <View style={[styles.rulesSection, { marginTop: 12 }]}>
                <Text style={styles.rulesSubtitle}>Criterios:</Text>
                <Text style={styles.ruleText}>{configuracionClasificacion.descripcion}</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando grupos...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar equipo en grupos..."
          onClear={() => setSearchQuery('')}
        />
      </View>

      <FlatList
        data={grupos}
        keyExtractor={(item) => item.id_grupo.toString()}
        renderItem={({ item }) => renderGrupo(item)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB para crear nuevo grupo y editar reglas (solo admin) */}
      {isAdmin && (
        <>
          {/* Botón para editar reglas de clasificación */}
          {configuracionClasificacion && (
            <FAB
              onPress={handleEditReglas}
              icon="cog"
              color={colors.warning}
              style={{ bottom: 90 }}
            />
          )}

          {/* Botón para crear nuevo grupo */}
          <FAB
            onPress={handleCreateGroup}
            icon="add-circle"
            color={colors.success}
            style={{ bottom: 20 }}
          />
        </>
      )}

      {/* Modal para agregar equipo al grupo */}
      {selectedGrupoId && (
        <AddTeamToGroupModal
          visible={addTeamModalVisible}
          onClose={() => {
            setAddTeamModalVisible(false);
            setSelectedGrupoId(null);
          }}
          grupoId={selectedGrupoId}
          grupoNombre={grupos.find(g => g.id_grupo === selectedGrupoId)?.nombre || ''}
          equiposEnGrupo={getEquiposByGrupo(selectedGrupoId).map(c => c.id_equipo)}
          onAddTeam={handleAddTeam}
          idEdicionCategoria={idEdicionCategoria || 1}
        />
      )}

      {/* Modal para asignar múltiples equipos al grupo */}
      {selectedGrupoId && (
        <AsignarEquiposModal
          visible={asignarEquiposModalVisible}
          onClose={() => {
            setAsignarEquiposModalVisible(false);
            setSelectedGrupoId(null);
            setSelectedGrupoNombre('');
          }}
          grupoId={selectedGrupoId}
          grupoNombre={selectedGrupoNombre}
          idEdicionCategoria={idEdicionCategoria || 1}
          onSuccess={() => {
            loadGruposAndClasificacion();
          }}
        />
      )}

      {/* Modal para mover equipo a otro grupo */}
      {selectedClasificacion && (
        <MoveTeamToGroupModal
          visible={moveTeamModalVisible}
          onClose={() => {
            setMoveTeamModalVisible(false);
            setSelectedClasificacion(null);
          }}
          onSelectGroup={handleConfirmMoveTeam}
          grupos={grupos}
          currentGrupoId={selectedClasificacion.id_grupo}
          equipoNombre={selectedClasificacion.equipo.nombre}
        />
      )}

      {/* Modal para editar reglas de clasificación */}
      <Modal
        visible={editReglasModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditReglasModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Reglas de Clasificación</Text>
              <TouchableOpacity onPress={() => setEditReglasModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Equipos a Oro */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Oro</Text>
                <TextInput
                  style={styles.input}
                  value={equiposOro}
                  onChangeText={setEquiposOro}
                  keyboardType="number-pad"
                  placeholder="Ej: 2"
                />
              </View>

              {/* Posiciones Oro */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Oro (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posicionesOro}
                  onChangeText={setPosicionesOro}
                  placeholder="Ej: 1,2 o 1-2"
                />
              </View>

              {/* Equipos a Plata */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Plata</Text>
                <TextInput
                  style={styles.input}
                  value={equiposPlata}
                  onChangeText={setEquiposPlata}
                  keyboardType="number-pad"
                  placeholder="Ej: 2"
                />
              </View>

              {/* Posiciones Plata */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Plata (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posicionesPlata}
                  onChangeText={setPosicionesPlata}
                  placeholder="Ej: 3,4 o 3-4"
                />
              </View>

              {/* Equipos a Bronce */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Bronce</Text>
                <TextInput
                  style={styles.input}
                  value={equiposBronce}
                  onChangeText={setEquiposBronce}
                  keyboardType="number-pad"
                  placeholder="Ej: 2"
                />
              </View>

              {/* Posiciones Bronce */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Bronce (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posicionesBronce}
                  onChangeText={setPosicionesBronce}
                  placeholder="Ej: 5,6 o 5-6"
                />
              </View>

              {/* Descripción */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción de las Reglas</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descripcionReglas}
                  onChangeText={setDescripcionReglas}
                  placeholder="Describe las reglas de clasificación..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditReglasModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveReglas}
                disabled={savingReglas}
              >
                {savingReglas ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.backgroundGray,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: colors.backgroundGray,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  grupoCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  grupoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
  },
  grupoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grupoNombreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  grupoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  table: {
    paddingTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  posicionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  posicionText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  clasificacionDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  posCol: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipoCol: {
    flex: 1,
    minWidth: 0,
  },
  statCol: {
    width: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  equipoCell: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipoLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    marginRight: 8,
  },
  equipoLogoEmoji: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  equipoLogoEmojiText: {
    fontSize: 18,
  },
  equipoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    flexWrap: 'wrap',
  },
  rulesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  rulesToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rulesContent: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  rulesSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  rulesText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  rulesSection: {
    marginTop: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  ruleText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  ruleBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  swipeActionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginLeft: 8,
  },
  swipeMoveButton: {
    backgroundColor: colors.warning,
  },
  swipeDeleteButton: {
    backgroundColor: colors.error,
  },
  swipeActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  // Estilos del modal de edición de reglas
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
  

