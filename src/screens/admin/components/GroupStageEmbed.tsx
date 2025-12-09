import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Card, SearchBar, FAB } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { Grupo, Clasificacion, Equipo } from '../../../types';
import { mockGrupos, mockClasificacion, mockEquipos } from '../../../data/mockData';
import { useSearch } from '../../../hooks';
import { AddTeamToGroupModal } from './AddTeamToGroupModal';
import { MoveTeamToGroupModal } from './MoveTeamToGroupModal';
import ImportTeamsModal from './ImportTeamsModal';
import { useToast } from '../../../contexts/ToastContext';

interface GroupStageEmbedProps {
  navigation: any;
  isAdmin?: boolean;
}

// Función helper para determinar el color de clasificación
const getClasificacionColor = (posicion: number, tipo_clasificacion?: string) => {
  if (!tipo_clasificacion) return 'transparent';
  
  switch (tipo_clasificacion) {
    case 'pasa_copa_general':
      return posicion === 1 ? '#4CAF50' : posicion === 2 ? '#2196F3' : 'transparent';
    case 'pasa_copa_oro':
      return posicion === 1 ? '#FFD700' : posicion === 2 ? '#C0C0C0' : 'transparent';
    case 'pasa_copa_plata':
      return posicion === 1 ? '#C0C0C0' : posicion === 2 ? '#CD7F32' : 'transparent';
    case 'pasa_copa_bronce':
      return posicion === 1 ? '#CD7F32' : 'transparent';
    default:
      return 'transparent';
  }
};

export const GroupStageEmbed: React.FC<GroupStageEmbedProps> = ({ navigation, isAdmin = false }) => {
  const [grupos] = useState<Grupo[]>(mockGrupos);
  const [expandedRules, setExpandedRules] = useState<{ [key: number]: boolean }>({});
  const [addTeamModalVisible, setAddTeamModalVisible] = useState(false);
  const [moveTeamModalVisible, setMoveTeamModalVisible] = useState(false);
  const [importTeamsModalVisible, setImportTeamsModalVisible] = useState(false);
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
  const [selectedClasificacion, setSelectedClasificacion] = useState<(Clasificacion & { equipo: Equipo }) | null>(null);
  const { showSuccess, showError, showWarning } = useToast();
  
  const {
    searchQuery,
    setSearchQuery,
    filteredData: filteredEquipos,
    clearSearch,
  } = useSearch(mockEquipos, 'nombre');

  const handleCreateGroup = () => {
    console.log('Crear nuevo grupo');
    navigation.navigate('CreateGroup', { idEdicionCategoria: 1 }); // TODO: Pasar el ID real
  };

  const handleEditGroup = (grupo: Grupo) => {
    console.log('Editar grupo:', grupo);
    navigation.navigate('EditGroup', { grupo });
  };

  const handleAddTeamToGroup = (grupoId: number) => {
    console.log('Agregar equipo al grupo:', grupoId);
    setSelectedGrupoId(grupoId);
    setAddTeamModalVisible(true);
  };

  const handleRemoveTeamFromGroup = (clasificacionId: number, equipoNombre: string) => {
    Alert.alert(
      'Eliminar Equipo',
      `¿Deseas remover "${equipoNombre}" del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            console.log('Remover equipo del grupo:', clasificacionId);
            // TODO: Llamar a la API para remover el equipo del grupo
            // await mockApi.groups.removeTeamFromGroup(clasificacionId);
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
      `¿Mover "${selectedClasificacion.equipo.nombre}" a "${targetGrupo?.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover',
          onPress: () => {
            console.log('Mover equipo', selectedClasificacion.id_equipo, 'al grupo', targetGrupoId);
            // TODO: Llamar a la API para mover el equipo
            // await mockApi.groups.moveTeamToGroup(selectedClasificacion.id_clasificacion, targetGrupoId);
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
    // await mockApi.groups.addTeamToGroup(selectedGrupoId, equipoId);
  };

  const handleImportTeams = () => {
    // Mostrar modal con selector de grupos
    if (grupos.length === 0) {
      showError('No hay grupos disponibles');
      return;
    }
    
    setImportTeamsModalVisible(true);
  };

  const handleConfirmImport = (teams: Partial<Equipo>[], grupoId: number) => {
    const grupo = grupos.find(g => g.id_grupo === grupoId);
    console.log('Importar equipos:', teams, 'al grupo', grupo?.nombre);
    // TODO: Llamar a la API para crear equipos e importarlos al grupo
    // await mockApi.teams.bulkCreate(teams);
    // await mockApi.groups.addMultipleTeamsToGroup(grupoId, teamIds);
    showSuccess(`${teams.length} equipos importados correctamente al grupo ${grupo?.nombre}`);
    setImportTeamsModalVisible(false);
  };

  const getEquiposByGrupo = (id_grupo: number): (Clasificacion & { equipo: Equipo })[] => {
    return mockClasificacion
      .filter((c) => {
        const equipo = mockEquipos.find((e) => e.id_equipo === c.id_equipo);
        // Filtrar por grupo y por búsqueda
        return c.id_grupo === id_grupo && 
               (!searchQuery || filteredEquipos.some(fe => fe.id_equipo === equipo?.id_equipo));
      })
      .sort((a, b) => a.posicion - b.posicion)
      .map((c) => ({
        ...c,
        equipo: mockEquipos.find((e) => e.id_equipo === c.id_equipo)!,
      }));
  };

  const handleTeamPress = (equipoId: number) => {
    console.log('GroupStageEmbed - handleTeamPress called, equipoId:', equipoId);
    try {
      navigation.navigate('TeamDetail', { equipoId });
    } catch (error) {
      console.error('GroupStageEmbed - Navigation error:', error);
    }
  };

  const renderClasificacionIndicator = (posicion: number, tipo_clasificacion?: string) => {
    const color = getClasificacionColor(posicion, tipo_clasificacion);
    const textColor = color !== 'transparent' ? colors.white : colors.textPrimary;
    
    return (
      <View style={[
        styles.posicionCircle, 
        color !== 'transparent' && { backgroundColor: color }
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
    const content = (
      <TouchableOpacity
        style={styles.tableRow}
        onPress={() => handleTeamPress(clasificacion.id_equipo)}
        activeOpacity={0.7}
        accessible={true}
      >
        {renderClasificacionIndicator(clasificacion.posicion, grupo.tipo_clasificacion)}
        {true ? (
          <TeamLogo uri={clasificacion.equipo.logo} size={32} />
        ) : (
          <View style={styles.equipoLogoEmoji}>
            <Text style={styles.equipoLogoEmojiText}>{clasificacion.equipo.logo || '⚽'}</Text>
          </View>
        )}
        <View style={[styles.equipoCell, styles.equipoCol]}>
          <Text style={styles.equipoNombre} numberOfLines={1}>
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
          key={clasificacion.id_clasificacion}
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

    return <View key={clasificacion.id_clasificacion}>{content}</View>;
  };

  const renderGrupo = (grupo: Grupo) => {
    const equipos = getEquiposByGrupo(grupo.id_grupo);

    return (
      <Card key={grupo.id_grupo} style={styles.grupoCard}>
        {/* Header del grupo */}
        <View style={styles.grupoHeader}>
          <Text style={styles.grupoNombre}>{grupo.nombre}</Text>
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
                onPress={() => handleEditGroup(grupo)}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.posCol]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.equipoCol]}>Equipo</Text>
            <Text style={[styles.tableHeaderText, styles.statCol]}>P</Text>
            <Text style={[styles.tableHeaderText, styles.statCol]}>DIFF</Text>
            <Text style={[styles.tableHeaderText, styles.statCol]}>PTS</Text>
          </View>

          {equipos.map((clasificacion) => renderEquipoRow(clasificacion, grupo))}
        </View>

        {/* Sección de Reglas - Collapsible */}
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

        {expandedRules[grupo.id_grupo] && (
          <View style={styles.rulesContent}>
            <Text style={styles.rulesTitle}>Sistema de Clasificación</Text>
            <Text style={styles.rulesText}>
              Los equipos clasifican según su posición en el grupo:
            </Text>

            {grupo.tipo_clasificacion === 'pasa_copa_general' && (
              <View style={styles.rulesSection}>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>1º Posición:</Text> Clasifica a Copa General
                  </Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>2º Posición:</Text> Clasifica a Copa General (repechaje)
                  </Text>
                </View>
              </View>
            )}

            {grupo.tipo_clasificacion === 'pasa_copa_oro' && (
              <View style={styles.rulesSection}>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#FFD700' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>1º Posición:</Text> Clasifica a Copa de Oro
                  </Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#C0C0C0' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>2º Posición:</Text> Clasifica a Copa de Oro (repechaje)
                  </Text>
                </View>
              </View>
            )}

            {grupo.tipo_clasificacion === 'pasa_copa_plata' && (
              <View style={styles.rulesSection}>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#C0C0C0' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>1º Posición:</Text> Clasifica a Copa de Plata
                  </Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#CD7F32' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>2º Posición:</Text> Clasifica a Copa de Plata (repechaje)
                  </Text>
                </View>
              </View>
            )}

            {grupo.tipo_clasificacion === 'pasa_copa_bronce' && (
              <View style={styles.rulesSection}>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleDot, { backgroundColor: '#CD7F32' }]} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>1º Posición:</Text> Clasifica a Copa de Bronce
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.rulesSection, { marginTop: 12 }]}>
              <Text style={styles.rulesSubtitle}>Criterios de Desempate:</Text>
              <Text style={styles.ruleText}>1. Puntos totales</Text>
              <Text style={styles.ruleText}>2. Diferencia de goles</Text>
              <Text style={styles.ruleText}>3. Goles a favor</Text>
              <Text style={styles.ruleText}>4. Partidos ganados</Text>
              <Text style={styles.ruleText}>5. Enfrentamiento directo</Text>
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar equipo en grupos..."
          onClear={clearSearch}
        />
      </View>

      <FlatList
        data={grupos}
        keyExtractor={(item) => item.id_grupo.toString()}
        renderItem={({ item }) => renderGrupo(item)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB para crear nuevo grupo (solo admin) */}
      {isAdmin && (
        <>
          <FAB
            onPress={handleCreateGroup}
            icon="add-circle"
            color={colors.success}
            style={{ bottom: 20 }}
          />
          <FAB
            onPress={handleImportTeams}
            icon="cloud-upload"
            color={colors.info}
            style={{ bottom: 90 }}
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

      {/* Modal para importar múltiples equipos CSV */}
      <ImportTeamsModal
        visible={importTeamsModalVisible}
        onClose={() => {
          setImportTeamsModalVisible(false);
        }}
        onImport={handleConfirmImport}
        grupos={grupos}
        initialGrupoId={selectedGrupoId || grupos[0]?.id_grupo}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
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
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    width: 32,
  },
  equipoCol: {
    flex: 1,
  },
  statCol: {
    width: 40,
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
  },
  equipoLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
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
});
  
