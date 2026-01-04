import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { GradientHeader, FAB, Card, SearchBar } from '../../components/common';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../hooks';
import { Grupo, Clasificacion, Equipo } from '../../types';
import { mockGrupos, mockClasificacion, mockEquipos } from '../../data/mockData';

interface GroupStageScreenProps {
  navigation: any;
  route: any;
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

export const GroupStageScreen: React.FC<GroupStageScreenProps> = ({ navigation, route }) => {
  const { isAdmin } = useAuth();
  const [grupos] = useState<Grupo[]>(mockGrupos);
  
  // Hook de búsqueda para filtrar equipos
  const {
    searchQuery,
    setSearchQuery,
    filteredData: filteredEquipos,
    clearSearch,
  } = useSearch<Equipo>(mockEquipos, 'nombre');

  const getEquiposByGrupo = (id_grupo: number): (Clasificacion & { equipo: Equipo })[] => {
    return mockClasificacion
      .filter((c) => c.id_grupo === id_grupo)
      .sort((a, b) => a.posicion - b.posicion)
      .map((c) => ({
        ...c,
        equipo: mockEquipos.find((e) => e.id_equipo === c.id_equipo)!,
      }))
      .filter((c) => {
        // Si hay búsqueda activa, filtrar por nombre de equipo
        if (searchQuery.trim() === '') return true;
        return filteredEquipos.some((eq) => eq.id_equipo === c.id_equipo);
      });
  };

  const handleTeamPress = (equipoId: number) => {
    navigation.navigate('TeamDetail', { equipoId });
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleEditGroup = (grupo: Grupo) => {
    navigation.navigate('EditGroup', { grupo });
  };

  const handleImportCSV = () => {
    // TODO: Implementar importación CSV
  };

  const handleExportCSV = () => {
    // TODO: Implementar exportación CSV
  };

  const renderClasificacionIndicator = (posicion: number, tipo_clasificacion?: string) => {
    const color = getClasificacionColor(posicion, tipo_clasificacion);
    
    if (color === 'transparent') return null;

    return (
      <View style={[styles.clasificacionDot, { backgroundColor: color }]} />
    );
  };

  const renderGrupo = (grupo: Grupo) => {
    const equipos = getEquiposByGrupo(grupo.id_grupo);

    return (
      <Card key={grupo.id_grupo} style={styles.grupoCard}>
        {/* Header del Grupo */}
        <View style={styles.grupoHeader}>
          <Text style={styles.grupoNombre}>{grupo.nombre}</Text>
          {isAdmin && (
            <View style={styles.grupoActions}>
              <TouchableOpacity
                onPress={() => handleEditGroup(grupo)}
                style={styles.iconButton}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabla de Clasificación */}
        <View style={styles.table}>
          {/* Header de la tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.posCol]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.equipoCol]}>Equipo</Text>
            <Text style={[styles.tableHeaderText, styles.statCol]}>P</Text>
            <Text style={[styles.tableHeaderText, styles.statCol]}>DIFF</Text>
            <Text style={[styles.tableHeaderText, styles.statCol]}>PTS</Text>
          </View>

          {/* Filas de equipos */}
          {equipos.map((clasificacion) => (
            <TouchableOpacity
              key={clasificacion.id_clasificacion}
              style={styles.tableRow}
              onPress={() => handleTeamPress(clasificacion.id_equipo)}
              activeOpacity={0.7}
            >
              {/* Indicador de clasificación */}
              {renderClasificacionIndicator(clasificacion.posicion, grupo.tipo_clasificacion)}
              
              {/* Posición */}
              <Text style={[styles.tableText, styles.posCol]}>{clasificacion.posicion}</Text>
              
              {/* Logo + Nombre */}
              <View style={[styles.equipoCell, styles.equipoCol]}>
                <Image
                  source={clasificacion.equipo.logo ? { uri: clasificacion.equipo.logo } : require('../../assets/InterLOGO.png')}
                  style={styles.equipoLogo}
                  resizeMode="contain"
                />
                <Text style={styles.equipoNombre}>
                  {clasificacion.equipo.nombre}
                </Text>
              </View>
              
              {/* Partidos Jugados */}
              <Text style={[styles.tableText, styles.statCol]}>{clasificacion.pj}</Text>
              
              {/* Diferencia de Goles */}
              <Text style={[styles.tableText, styles.statCol, clasificacion.dif > 0 && styles.positiveDiff]}>
                {clasificacion.dif > 0 ? `+${clasificacion.dif}` : clasificacion.dif}
              </Text>
              
              {/* Puntos */}
              <Text style={[styles.tableText, styles.statCol, styles.puntosText]}>
                {clasificacion.puntos}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leyenda de Clasificación */}
        {grupo.tipo_clasificacion && (
          <View style={styles.leyenda}>
            <View style={styles.leyendaItem}>
              <View style={[styles.leyendaDot, { backgroundColor: getClasificacionColor(1, grupo.tipo_clasificacion) }]} />
              <Text style={styles.leyendaText}>
                {grupo.tipo_clasificacion === 'pasa_copa_general' && '1º pasa a Copa Gral.'}
                {grupo.tipo_clasificacion === 'pasa_copa_oro' && '1º pasa a Copa Oro'}
                {grupo.tipo_clasificacion === 'pasa_copa_plata' && '1º pasa a Copa Plata'}
                {grupo.tipo_clasificacion === 'pasa_copa_bronce' && '1º pasa a Copa Bronce'}
              </Text>
            </View>
            {grupo.tipo_clasificacion !== 'pasa_copa_bronce' && (
              <View style={styles.leyendaItem}>
                <View style={[styles.leyendaDot, { backgroundColor: getClasificacionColor(2, grupo.tipo_clasificacion) }]} />
                <Text style={styles.leyendaText}>
                  {grupo.tipo_clasificacion === 'pasa_copa_general' && '2º pasa a Copa Oro'}
                  {grupo.tipo_clasificacion === 'pasa_copa_oro' && '2º pasa a Copa Plata'}
                  {grupo.tipo_clasificacion === 'pasa_copa_plata' && '2º pasa a Copa Bronce'}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Fase de Grupos"
        onBackPress={() => navigation.goBack()}
        rightElement={
          isAdmin ? (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleImportCSV} style={styles.headerButton}>
                <Ionicons name="cloud-upload" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExportCSV} style={styles.headerButton}>
                <Ionicons name="cloud-download" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      {/* Barra de búsqueda */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar equipo..."
        onClear={clearSearch}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {grupos.map((grupo) => renderGrupo(grupo))}
      </ScrollView>

      {isAdmin && (
        <FAB
          onPress={handleCreateGroup}
          icon="add"
          color={colors.success}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  grupoCard: {
    marginBottom: 20,
    padding: 16,
  },
  grupoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  grupoNombre: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  grupoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  table: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGray,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
    position: 'relative',
    minHeight: 56,
  },
  tableText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  posCol: {
    width: 30,
  },
  equipoCol: {
    flex: 1,
    minWidth: 0,
  },
  statCol: {
    width: 30,
  },
  equipoCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  equipoLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  equipoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    flexWrap: 'wrap',
  },
  positiveDiff: {
    color: colors.success,
  },
  puntosText: {
    fontWeight: '700',
    color: colors.primary,
  },
  clasificacionDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  leyenda: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  leyendaDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  leyendaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
