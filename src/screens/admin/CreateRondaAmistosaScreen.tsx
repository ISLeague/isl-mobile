import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button, Modal, SearchBar } from '../../components/common';
import { Equipo, Clasificacion, Grupo } from '../../api/types';
import { generarPartidosAmistososAutomaticos } from '../../utils/fixtureGenerator';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';

interface CreateRondaAmistosaScreenProps {
  navigation: any;
  route: any;
}

interface PartidoAmistoso {
  id_temporal: string;
  id_equipo_local: number;
  id_equipo_visitante: number;
  fecha: string;
  hora: string;
  id_cancha?: number;
}

export const CreateRondaAmistosaScreen: React.FC<CreateRondaAmistosaScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria } = route.params || {};
  const { showSuccess, showError, showInfo } = useToast();

  const [nombre, setNombre] = useState('Amistosos - Fecha 1');
  const [fechaInicio, setFechaInicio] = useState('');
  const [partidos, setPartidos] = useState<PartidoAmistoso[]>([]);
  const [showAddPartidoModal, setShowAddPartidoModal] = useState(false);

  // Estados para agregar partido
  const [selectedLocal, setSelectedLocal] = useState<Equipo | null>(null);
  const [selectedVisitante, setSelectedVisitante] = useState<Equipo | null>(null);
  const [fechaPartido, setFechaPartido] = useState('');
  const [horaPartido, setHoraPartido] = useState('');
  const [selectingTeamFor, setSelectingTeamFor] = useState<'local' | 'visitante' | null>(null);

  // Estados para datos de API
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para búsqueda manual
  const [searchQueryLocal, setSearchQueryLocal] = useState('');
  const [searchQueryVisitante, setSearchQueryVisitante] = useState('');

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!idEdicionCategoria) {
        setLoading(false);
        return;
      }

      const result = await safeAsync(
        async () => {
          const equiposResponse = await api.equipos.list(idEdicionCategoria);
          const equiposData = equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];

          // TODO: Load grupos and clasificaciones when available
          return { equipos: equiposData, grupos: [], clasificaciones: [] };
        },
        'CreateRondaAmistosaScreen - loadData',
        { fallbackValue: { equipos: [], grupos: [], clasificaciones: [] } }
      );

      if (result) {
        setEquipos(result.equipos);
        setGrupos(result.grupos);
        setClasificaciones(result.clasificaciones);
      }
      setLoading(false);
    };

    loadData();
  }, [idEdicionCategoria]);

  // Obtener equipos de diferentes grupos para amistosos (memoizado)
  const getEquiposDisponiblesParaAmistosos = useCallback((equipoSeleccionado?: Equipo): Equipo[] => {
    if (!equipoSeleccionado) return equipos;

    // Encontrar el grupo del equipo seleccionado
    const clasificacion = clasificaciones.find(c => c.id_equipo === equipoSeleccionado.id_equipo);
    if (!clasificacion) return equipos;

    // Filtrar equipos que NO están en el mismo grupo
    const equiposOtrosGrupos = equipos.filter(equipo => {
      const clasifEquipo = clasificaciones.find(c => c.id_equipo === equipo.id_equipo);
      return clasifEquipo && clasifEquipo.id_grupo !== clasificacion.id_grupo;
    });

    return equiposOtrosGrupos;
  }, [equipos, clasificaciones]);

  // Generar automáticamente partidos amistosos
  const handleGenerarAutomaticamente = () => {
    Alert.alert(
      '🤖 Generación Automática',
      'Se generarán partidos entre equipos de diferentes grupos basándose en su posición (1° vs último, 2° vs penúltimo, etc.).\n\n¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          style: 'default',
          onPress: () => {
            try {
              const partidosGenerados = generarPartidosAmistososAutomaticos(
                grupos,
                clasificaciones,
                equipos,
                fechaInicio || '2025-01-01'
              );

              if (partidosGenerados.length === 0) {
                showInfo('No se pudieron generar partidos. Verifica que haya equipos en diferentes grupos.');
                return;
              }

              // Convertir a formato PartidoAmistoso
              const partidosAmistosos: PartidoAmistoso[] = partidosGenerados.map((p, idx) => ({
                id_temporal: `auto_${Date.now()}_${idx}`,
                id_equipo_local: p.id_equipo_local,
                id_equipo_visitante: p.id_equipo_visitante,
                fecha: p.fecha,
                hora: p.hora,
              }));

              setPartidos(partidosAmistosos);
              showSuccess(`Se generaron ${partidosAmistosos.length} partidos automáticamente`);
            } catch (error) {
              console.error('Error generando partidos:', error);
              showError('Error al generar partidos automáticamente');
            }
          },
        },
      ]
    );
  };

  const handleAddPartido = () => {
    if (!selectedLocal || !selectedVisitante) {
      Alert.alert('Error', 'Debes seleccionar ambos equipos');
      return;
    }

    if (selectedLocal.id_equipo === selectedVisitante.id_equipo) {
      Alert.alert('Error', 'Un equipo no puede jugar contra sí mismo');
      return;
    }

    if (!fechaPartido.trim()) {
      Alert.alert('Error', 'Debes especificar la fecha del partido');
      return;
    }

    if (!horaPartido.trim()) {
      Alert.alert('Error', 'Debes especificar la hora del partido');
      return;
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fechaPartido)) {
      Alert.alert('Error', 'El formato de la fecha debe ser YYYY-MM-DD (ej: 2025-12-25)');
      return;
    }

    // Validar formato de hora
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(horaPartido)) {
      Alert.alert('Error', 'El formato de la hora debe ser HH:MM (ej: 15:00)');
      return;
    }

    const nuevoPartido: PartidoAmistoso = {
      id_temporal: Date.now().toString(),
      id_equipo_local: selectedLocal.id_equipo,
      id_equipo_visitante: selectedVisitante.id_equipo,
      fecha: fechaPartido,
      hora: horaPartido,
    };

    setPartidos([...partidos, nuevoPartido]);
    
    // Limpiar formulario
    setSelectedLocal(null);
    setSelectedVisitante(null);
    setFechaPartido('');
    setHoraPartido('');
    setShowAddPartidoModal(false);
    
    Alert.alert('Éxito', 'Partido agregado a la ronda');
  };

  const handleRemovePartido = (idTemporal: string) => {
    Alert.alert(
      'Confirmar',
      '¿Deseas eliminar este partido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPartidos(partidos.filter(p => p.id_temporal !== idTemporal));
          },
        },
      ]
    );
  };

  const handleCreateRonda = () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la ronda es requerido');
      return;
    }

    if (!fechaInicio.trim()) {
      Alert.alert('Error', 'La fecha de inicio es requerida');
      return;
    }

    if (partidos.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un partido');
      return;
    }

    const rondaData = {
      nombre,
      fecha_inicio: fechaInicio,
      id_fase: 1, // TODO: Obtener el ID de fase correcto
      id_edicion_categoria: idEdicionCategoria,
      es_amistosa: true,
      partidos: partidos,
    };

    console.log('Crear ronda amistosa:', rondaData);
    
    // TODO: Llamar a la API para crear la ronda y los partidos
    // await api.fixture.createRondaAmistosa(rondaData);
    
    Alert.alert('Éxito', `Ronda amistosa "${nombre}" creada con ${partidos.length} partidos`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const getEquipoById = (id: number): Equipo | undefined => {
    return equipos.find(e => e.id_equipo === id);
  };

  const renderPartidoItem = (partido: PartidoAmistoso) => {
    const equipoLocal = getEquipoById(partido.id_equipo_local);
    const equipoVisitante = getEquipoById(partido.id_equipo_visitante);

    if (!equipoLocal || !equipoVisitante) return null;

    return (
      <View key={partido.id_temporal} style={styles.partidoCard}>
        <View style={styles.partidoInfo}>
          <View style={styles.partidoEquipos}>
            <View style={styles.equipoRow}>
              <Image
                source={require('../../assets/InterLOGO.png')}
                style={styles.equipoLogo}
                resizeMode="contain"
              />
              <Text style={styles.equipoNombre}>{equipoLocal.nombre}</Text>
            </View>
            
            <Text style={styles.vsText}>VS</Text>
            
            <View style={styles.equipoRow}>
              <Image
                source={require('../../assets/InterLOGO.png')}
                style={styles.equipoLogo}
                resizeMode="contain"
              />
              <Text style={styles.equipoNombre}>{equipoVisitante.nombre}</Text>
            </View>
          </View>

          <View style={styles.partidoDetalles}>
            <Text style={styles.partidoDetalle}>
              <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
              {' '}{partido.fecha} - {partido.hora}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemovePartido(partido.id_temporal)}
        >
          <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderTeamSelector = (type: 'local' | 'visitante') => {
    const isLocal = type === 'local';
    const selectedEquipo = isLocal ? selectedLocal : selectedVisitante;
    const searchQuery = isLocal ? searchQueryLocal : searchQueryVisitante;
    const setSearchQuery = isLocal ? setSearchQueryLocal : setSearchQueryVisitante;
    const otherTeam = isLocal ? selectedVisitante : selectedLocal;

    // Filtrar equipos disponibles basado en reglas de amistosos
    const equiposDisponibles = getEquiposDisponiblesParaAmistosos(otherTeam || undefined);

    // Manual search filtering
    const filteredEquipos = equiposDisponibles.filter((e: Equipo) => {
      if (!searchQuery) return true;
      const equipoNombre = e.nombre?.toLowerCase() || '';
      return equipoNombre.includes(searchQuery.toLowerCase());
    });

    const equiposFiltrados = filteredEquipos.filter((e: Equipo) =>
      !otherTeam || e.id_equipo !== otherTeam.id_equipo
    );

    return (
      <View style={styles.teamSelector}>
        <Text style={styles.teamSelectorLabel}>
          {isLocal ? 'Equipo Local' : 'Equipo Visitante'}
        </Text>
        
        {selectedEquipo ? (
          <View style={styles.selectedTeam}>
            <Image
              source={require('../../assets/InterLOGO.png')}
              style={styles.selectedTeamLogo}
              resizeMode="contain"
            />
            <Text style={styles.selectedTeamName}>{selectedEquipo.nombre}</Text>
            <TouchableOpacity
              onPress={() => isLocal ? setSelectedLocal(null) : setSelectedVisitante(null)}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar equipo..."
              onClear={() => setSearchQuery('')}
            />

            <ScrollView style={styles.teamList} nestedScrollEnabled>
              {equiposFiltrados.map(equipo => (
                <TouchableOpacity
                  key={equipo.id_equipo}
                  style={styles.teamItem}
                  onPress={() => {
                    if (isLocal) {
                      setSelectedLocal(equipo);
                      setSearchQueryLocal('');
                    } else {
                      setSelectedVisitante(equipo);
                      setSearchQueryVisitante('');
                    }
                  }}
                >
                  <Image
                    source={require('../../assets/InterLOGO.png')}
                    style={styles.teamItemLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.teamItemName}>{equipo.nombre}</Text>
                </TouchableOpacity>
              ))}
              
              {equiposFiltrados.length === 0 && (
                <Text style={styles.noTeamsText}>
                  {searchQuery ? 'No se encontraron equipos' : 'No hay equipos disponibles'}
                </Text>
              )}
            </ScrollView>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Ronda Amistosa</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la Ronda *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Amistosos - Fecha 1"
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Fecha de Inicio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha de Inicio * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 2025-12-25"
              value={fechaInicio}
              onChangeText={setFechaInicio}
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Info de Amistosos */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              En rondas amistosas, los equipos se enfrentan contra equipos de otros grupos.
              Los resultados no afectan la tabla de posiciones.
            </Text>
          </View>

          {/* Lista de Partidos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Partidos ({partidos.length})</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.autoGenButton}
                  onPress={handleGenerarAutomaticamente}
                >
                  <MaterialCommunityIcons name="auto-fix" size={20} color={colors.white} />
                  <Text style={styles.autoGenButtonText}>Auto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddPartidoModal(true)}
                >
                  <MaterialCommunityIcons name="plus-circle" size={24} color={colors.success} />
                  <Text style={styles.addButtonText}>Manual</Text>
                </TouchableOpacity>
              </View>
            </View>

            {partidos.length === 0 ? (
              <View style={styles.emptyPartidos}>
                <MaterialCommunityIcons name="soccer" size={48} color={colors.textLight} />
                <Text style={styles.emptyText}>
                  No hay partidos agregados. Agrega al menos un partido para crear la ronda.
                </Text>
              </View>
            ) : (
              partidos.map(partido => renderPartidoItem(partido))
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón Crear */}
      <View style={styles.footer}>
        <Button
          title={`Crear Ronda con ${partidos.length} partido${partidos.length !== 1 ? 's' : ''}`}
          onPress={handleCreateRonda}
          disabled={partidos.length === 0}
          style={styles.createButton}
        />
      </View>

      {/* Modal para Agregar Partido */}
      <Modal
        visible={showAddPartidoModal}
        onClose={() => {
          setShowAddPartidoModal(false);
          setSelectedLocal(null);
          setSelectedVisitante(null);
          setFechaPartido('');
          setHoraPartido('');
          setSearchQueryLocal('');
          setSearchQueryVisitante('');
        }}
        title="Agregar Partido Amistoso"
        fullHeight
      >
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Selector de Equipos */}
          {renderTeamSelector('local')}
          {renderTeamSelector('visitante')}

          {/* Fecha y Hora */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha del Partido * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 2025-12-25"
              value={fechaPartido}
              onChangeText={setFechaPartido}
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hora del Partido * (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 15:00"
              value={horaPartido}
              onChangeText={setHoraPartido}
              placeholderTextColor={colors.textLight}
            />
          </View>

          <Button
            title="Agregar"
            onPress={handleAddPartido}
            style={styles.modalButton}
          />
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    lineHeight: 18,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoGenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  autoGenButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  emptyPartidos: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  partidoCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  partidoInfo: {
    flex: 1,
  },
  partidoEquipos: {
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
  },
  equipoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 4,
  },
  partidoDetalles: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  partidoDetalle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.info,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  teamSelector: {
    marginBottom: 24,
  },
  teamSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  selectedTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  selectedTeamLogo: {
    width: 40,
    height: 40,
  },
  selectedTeamName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  teamList: {
    maxHeight: 200,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginTop: 8,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamItemLogo: {
    width: 32,
    height: 32,
  },
  teamItemName: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  noTeamsText: {
    padding: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  modalButton: {
    marginTop: 8,
    backgroundColor: colors.success,
  },
});
