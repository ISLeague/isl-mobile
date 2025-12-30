import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button, Card, GradientHeader, Input } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import {
  FixtureSinPartido,
  JornadaConFixturesSinPartido,
  CreateFixtureRequest
} from '../../api/types/rondas.types';
import { Grupo, GrupoDetallado, EquipoGrupo } from '../../api/types/grupos.types';
import { Equipo, Local, Cancha } from '../../api/types';
import { safeAsync } from '../../utils';

export const CreatePartidoScreen = ({ navigation, route }: any) => {
  const { ronda, idEdicionCategoria, idFase } = route.params;
  const { showSuccess, showError, showInfo } = useToast();

  // Estados para fixtures sin partido
  const [fixturesSinPartido, setFixturesSinPartido] = useState<JornadaConFixturesSinPartido[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fixtureDetails, setFixtureDetails] = useState<{
    [fixtureId: number]: {
      fecha: string;
      hora: string;
      id_cancha: number | null;
    };
  }>({});
  const [allCanchas, setAllCanchas] = useState<Cancha[]>([]);

  // Estados para crear fixture manual
  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [equipoLocalId, setEquipoLocalId] = useState<number | null>(null);
  const [equipoVisitanteId, setEquipoVisitanteId] = useState<number | null>(null);
  const [jornada, setJornada] = useState('1');
  const [tipoEncuentro, setTipoEncuentro] = useState<'unico' | 'ida' | 'vuelta'>('unico');
  const [ordenDentroJornada, setOrdenDentroJornada] = useState('1');
  const [esIdaVuelta, setEsIdaVuelta] = useState(false);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [localId, setLocalId] = useState<number | null>(null);
  const [canchaId, setCanchaId] = useState<number | null>(null);

  // Estados de datos
  const [grupos, setGrupos] = useState<GrupoDetallado[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);

  // Estados de modales
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showEquipoLocalModal, setShowEquipoLocalModal] = useState(false);
  const [showEquipoVisitanteModal, setShowEquipoVisitanteModal] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [showCanchaModal, setShowCanchaModal] = useState(false);

  // Estados de búsqueda
  const [searchEquipoLocal, setSearchEquipoLocal] = useState('');
  const [searchEquipoVisitante, setSearchEquipoVisitante] = useState('');

  // Estado de creación
  const [creating, setCreating] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadFixturesSinPartido(),
      loadGrupos(),
      loadLocales(),
      loadAllCanchas(),
    ]);
  };

  const loadFixturesSinPartido = async () => {
    console.log('📋 [CreatePartido] Loading fixtures sin partido for ronda:', ronda.id_ronda);
    setLoadingFixtures(true);

    const result = await safeAsync(
      async () => {
        const response = await api.rondas.fixturesSinPartido(ronda.id_ronda);
        return response.success && response.data ? response.data.jornadas : [];
      },
      'loadFixturesSinPartido',
      { fallbackValue: [], onError: () => showError('Error al cargar fixtures sin partido') }
    );

    setFixturesSinPartido(result || []);
    setLoadingFixtures(false);
  };

  const loadGrupos = async () => {
    console.log('🏆 [CreatePartido] Loading grupos for fase:', idFase);

    const result = await safeAsync(
      async () => {
        const response = await api.grupos.get(idFase);
        return response.success && response.data ? response.data.grupos : [];
      },
      'loadGrupos',
      { fallbackValue: [], onError: () => showError('Error al cargar grupos') }
    );

    setGrupos(result || []);
  };

  const loadLocales = async () => {
    console.log('📍 [CreatePartido] Loading locales for edicion:', idEdicionCategoria);

    const result = await safeAsync(
      async () => {
        const response = await api.locales.list(idEdicionCategoria);
        return response.success && response.data?.locales ? response.data.locales : [];
      },
      'loadLocales',
      { fallbackValue: [], onError: () => showError('Error al cargar locales') }
    );

    setLocales(result || []);
  };

  const loadCanchasForLocal = async (localIdParam: number) => {
    console.log('⚽ [CreatePartido] Loading canchas for local:', localIdParam);

    const result = await safeAsync(
      async () => {
        const response = await api.canchas.list(localIdParam);
        return response.success && response.data?.canchas ? response.data.canchas : [];
      },
      'loadCanchasForLocal',
      { fallbackValue: [], onError: () => showError('Error al cargar canchas') }
    );

    setCanchas(result || []);
  };

  const loadAllCanchas = async () => {
    console.log('⚽ [CreatePartido] Loading all canchas for edicion:', idEdicionCategoria);

    const result = await safeAsync(
      async () => {
        const localesResponse = await api.locales.list(idEdicionCategoria);
        const allLocales = localesResponse.success && localesResponse.data?.locales ? localesResponse.data.locales : [];

        const canchasPromises = allLocales.map(async (local: Local) => {
          const canchasResponse = await api.canchas.list(local.id_local);
          return canchasResponse.success && canchasResponse.data?.canchas ? canchasResponse.data.canchas : [];
        });

        const canchasArrays = await Promise.all(canchasPromises);
        return canchasArrays.flat();
      },
      'loadAllCanchas',
      { fallbackValue: [], onError: () => showError('Error al cargar canchas') }
    );

    setAllCanchas(result || []);
  };

  const handleFixtureDetailChange = (fixtureId: number, field: 'fecha' | 'hora' | 'id_cancha', value: any) => {
    setFixtureDetails(prev => ({
      ...prev,
      [fixtureId]: {
        fecha: prev[fixtureId]?.fecha || '',
        hora: prev[fixtureId]?.hora || '',
        id_cancha: prev[fixtureId]?.id_cancha || null,
        [field]: value,
      },
    }));
  };

  // Efecto para cargar equipos cuando se selecciona un grupo
  useEffect(() => {
    if (grupoId) {
      const grupo = grupos.find(g => g.id_grupo === grupoId);
      if (grupo && grupo.equipos) {
        const equiposDelGrupo = grupo.equipos.map((eg: EquipoGrupo) => eg.equipo);
        setEquipos(equiposDelGrupo);
        console.log('👥 [CreatePartido] Loaded equipos for grupo:', grupoId, equiposDelGrupo.length);
      }
    } else {
      setEquipos([]);
    }
    // Reset equipo selections when grupo changes
    setEquipoLocalId(null);
    setEquipoVisitanteId(null);
  }, [grupoId, grupos]);

  // Efecto para cargar canchas cuando se selecciona un local
  useEffect(() => {
    if (localId) {
      loadCanchasForLocal(localId);
    } else {
      setCanchas([]);
    }
    // Reset cancha selection when local changes
    setCanchaId(null);
  }, [localId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

  const handleCreateFromFixture = async (fixture: FixtureSinPartido) => {
    const details = fixtureDetails[fixture.id_fixture];

    if (!details || !details.fecha || !details.hora || !details.id_cancha) {
      showError('Por favor completa todos los campos (fecha, hora y cancha) antes de crear el partido');
      return;
    }

    Alert.alert(
      'Crear Partido',
      `¿Deseas crear un partido para ${fixture.local} vs ${fixture.visitante}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async () => {
            setCreating(true);

            const partidoData = {
              id_fixture: fixture.id_fixture,
              id_equipo_local: fixture.id_equipo_local,
              id_equipo_visitante: fixture.id_equipo_visitante,
              id_ronda: ronda.id_ronda,
              id_fase: idFase,
              tipo_partido: (ronda.tipo === 'amistosa' ? 'amistoso' : 'clasificacion') as 'amistoso' | 'clasificacion' | 'eliminatoria',
              afecta_clasificacion: ronda.tipo !== 'amistosa',
              id_cancha: details.id_cancha!,
              fecha: details.fecha,
              hora: details.hora,
            };

            const result = await safeAsync(
              async () => {
                const response = await api.partidos.createFromFixture(partidoData);
                return response;
              },
              'createPartidoFromFixture',
              { fallbackValue: null, onError: () => showError('Error al crear partido') }
            );

            setCreating(false);

            if (result && result.success) {
              showSuccess('Partido creado exitosamente');

              // Limpiar los detalles del fixture
              setFixtureDetails(prev => {
                const newDetails = { ...prev };
                delete newDetails[fixture.id_fixture];
                return newDetails;
              });

              await loadFixturesSinPartido();
            }
          },
        },
      ]
    );
  };

  const handleCreateManual = async () => {
    // Validaciones
    if (!grupoId) {
      showError('Debes seleccionar un grupo');
      return;
    }

    if (!equipoLocalId || !equipoVisitanteId) {
      showError('Debes seleccionar ambos equipos');
      return;
    }

    if (equipoLocalId === equipoVisitanteId) {
      showError('Los equipos deben ser diferentes');
      return;
    }

    if (!jornada || isNaN(parseInt(jornada)) || parseInt(jornada) < 1) {
      showError('La jornada debe ser un número mayor a 0');
      return;
    }

    if (!ordenDentroJornada || isNaN(parseInt(ordenDentroJornada)) || parseInt(ordenDentroJornada) < 1) {
      showError('El orden debe ser un número mayor a 0');
      return;
    }

    // Validar formato de fecha si no está vacía
    if (fecha.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fecha)) {
        showError('El formato de la fecha debe ser YYYY-MM-DD');
        return;
      }
    }

    // Validar formato de hora si no está vacía
    if (hora.trim()) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(hora)) {
        showError('El formato de la hora debe ser HH:MM');
        return;
      }
    }

    Alert.alert(
      'Confirmar Creación',
      '¿Deseas crear este fixture y partido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async () => {
            setCreating(true);

            try {
              // Paso 1: Crear fixture
              console.log('📝 [CreatePartido] Creating fixture...');
              const fixtureData: CreateFixtureRequest = {
                id_ronda: ronda.id_ronda,
                id_grupo: grupoId!,
                id_equipo_local: equipoLocalId!,
                id_equipo_visitante: equipoVisitanteId!,
                jornada: parseInt(jornada),
                tipo_encuentro: tipoEncuentro,
                orden_dentro_jornada: parseInt(ordenDentroJornada),
                es_ida_vuelta: esIdaVuelta,
              };

              const fixtureResult = await safeAsync(
                async () => {
                  const response = await api.rondas.createFixture(fixtureData);
                  return response;
                },
                'createFixture',
                { fallbackValue: null, onError: () => showError('Error al crear fixture') }
              );

              if (!fixtureResult || !fixtureResult.success) {
                setCreating(false);
                return;
              }

              const idFixture = fixtureResult.data.id_fixture;
              console.log('✅ [CreatePartido] Fixture created:', idFixture);
              showInfo('Fixture creado, ahora creando partido...');

              // Paso 2: Crear partido desde el fixture
              const partidoData: any = {
                id_fixture: idFixture,
                id_equipo_local: equipoLocalId!,
                id_equipo_visitante: equipoVisitanteId!,
                id_ronda: ronda.id_ronda,
                id_fase: idFase,
                tipo_partido: (ronda.tipo === 'amistosa' ? 'amistoso' : 'clasificacion') as 'amistoso' | 'clasificacion' | 'eliminatoria',
                afecta_clasificacion: ronda.tipo !== 'amistosa',
              };

              // Agregar fecha, hora y cancha si están presentes
              if (fecha.trim()) partidoData.fecha = fecha;
              if (hora.trim()) partidoData.hora = hora;
              if (canchaId) partidoData.id_cancha = canchaId;

              const partidoResult = await safeAsync(
                async () => {
                  const response = await api.partidos.createFromFixture(partidoData);
                  return response;
                },
                'createPartidoFromFixture',
                { fallbackValue: null, onError: () => showError('Error al crear partido') }
              );

              setCreating(false);

              if (partidoResult && partidoResult.success) {
                showSuccess('Fixture y partido creados exitosamente');

                // Reset form
                setGrupoId(null);
                setEquipoLocalId(null);
                setEquipoVisitanteId(null);
                setJornada('1');
                setTipoEncuentro('unico');
                setOrdenDentroJornada('1');
                setEsIdaVuelta(false);
                setFecha('');
                setHora('');
                setLocalId(null);
                setCanchaId(null);

                // Reload fixtures
                await loadFixturesSinPartido();
              }
            } catch (error) {
              setCreating(false);
              showError('Error en el proceso de creación');
              console.error('❌ [CreatePartido] Error:', error);
            }
          },
        },
      ]
    );
  };

  // Filtrar equipos según búsqueda
  const equiposLocalesFiltrados = equipos
    .filter(equipo => equipo.nombre.toLowerCase().includes(searchEquipoLocal.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const equiposVisitantesFiltrados = equipos
    .filter(equipo => equipo.nombre.toLowerCase().includes(searchEquipoVisitante.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Canchas filtradas por local seleccionado
  const canchasDelLocal = localId
    ? canchas.filter(cancha => cancha.id_local === localId)
    : [];

  const getGrupoNombre = (id: number | null) => {
    if (!id) return 'Seleccionar grupo';
    return grupos.find(g => g.id_grupo === id)?.nombre || 'Grupo no encontrado';
  };

  const getEquipoNombre = (id: number | null) => {
    if (!id) return 'Seleccionar equipo';
    if (!grupoId) return 'Primero selecciona un grupo';
    return equipos.find(e => e.id_equipo === id)?.nombre || 'Equipo no encontrado';
  };

  const getLocalNombre = (id: number | null) => {
    if (!id) return 'Seleccionar local (opcional)';
    return locales.find(l => l.id_local === id)?.nombre || 'Local no encontrado';
  };

  const getCanchaNombre = (id: number | null) => {
    if (!id) return 'Seleccionar cancha (opcional)';
    if (!localId) return 'Primero selecciona un local';
    const cancha = canchas.find(c => c.id_cancha === id);
    if (!cancha) return 'Cancha no encontrada';
    const local = locales.find(l => l.id_local === cancha.id_local);
    return `${cancha.nombre} - ${local?.nombre || ''}`;
  };

  const totalFixturesSinPartido = fixturesSinPartido.reduce((sum, jornada) => sum + jornada.fixtures.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Crear Partido"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Fixtures Sin Partido */}
        {loadingFixtures ? (
          <Card style={styles.card}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando fixtures...</Text>
          </Card>
        ) : totalFixturesSinPartido > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>
              Fixtures Sin Partido ({totalFixturesSinPartido})
            </Text>
            <Text style={styles.helpText}>
              Estos fixtures ya fueron generados y están esperando ser convertidos en partidos.
            </Text>

            {fixturesSinPartido.map((jornada) => (
              <View key={jornada.jornada} style={styles.jornadaContainer}>
                <Text style={styles.jornadaTitle}>Jornada {jornada.jornada}</Text>

                {jornada.fixtures.map((fixture) => {
                  const details = fixtureDetails[fixture.id_fixture] || { fecha: '', hora: '', id_cancha: null };
                  const isComplete = details.fecha && details.hora && details.id_cancha;

                  return (
                    <View key={fixture.id_fixture} style={styles.fixtureCard}>
                      <View style={styles.fixtureHeader}>
                        <Text style={styles.fixtureTeams}>
                          {fixture.local} vs {fixture.visitante}
                        </Text>
                        {fixture.nombre_grupo && (
                          <Text style={styles.fixtureGrupo}>{fixture.nombre_grupo}</Text>
                        )}
                      </View>

                      <View style={styles.fixtureDetails}>
                        <Text style={styles.fixtureDetail}>
                          <MaterialCommunityIcons name="swap-horizontal" size={14} color={colors.textSecondary} />
                          {' '}{fixture.tipo_encuentro}
                        </Text>
                        <Text style={styles.fixtureDetail}>
                          <MaterialCommunityIcons name="sort-numeric-ascending" size={14} color={colors.textSecondary} />
                          {' '}Orden: {fixture.orden_dentro_jornada}
                        </Text>
                      </View>

                      {/* Inputs de Fecha y Hora */}
                      <View style={styles.fixtureInputRow}>
                        <View style={styles.inputHalf}>
                          <Text style={styles.fixtureInputLabel}>Fecha *</Text>
                          <Input
                            placeholder="YYYY-MM-DD"
                            value={details.fecha}
                            onChangeText={(text) => handleFixtureDetailChange(fixture.id_fixture, 'fecha', text)}
                            leftIcon={<MaterialCommunityIcons name="calendar" size={18} color={colors.textSecondary} />}
                          />
                        </View>

                        <View style={styles.inputHalf}>
                          <Text style={styles.fixtureInputLabel}>Hora *</Text>
                          <Input
                            placeholder="HH:MM"
                            value={details.hora}
                            onChangeText={(text) => handleFixtureDetailChange(fixture.id_fixture, 'hora', text)}
                            leftIcon={<MaterialCommunityIcons name="clock-outline" size={18} color={colors.textSecondary} />}
                          />
                        </View>
                      </View>

                      {/* Selector de Cancha */}
                      <View style={styles.canchaSelector}>
                        <Text style={styles.fixtureInputLabel}>Cancha *</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.canchaScrollView}
                        >
                          {allCanchas.map((cancha) => (
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

                      {/* Botón Crear Partido - solo cuando está completo */}
                      {isComplete && (
                        <Button
                          title="Crear Partido"
                          onPress={() => handleCreateFromFixture(fixture)}
                          disabled={creating}
                          style={styles.createButton}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay fixtures sin partido</Text>
              <Text style={styles.helpText}>Crea un fixture manualmente a continuación</Text>
            </View>
          </Card>
        )}

        {/* Crear Fixture y Partido Manual */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Crear Fixture y Partido Manual</Text>
          <Text style={styles.helpText}>
            Crea un nuevo enfrentamiento desde cero. Primero se creará el fixture, luego el partido.
          </Text>

          {/* Grupo */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Grupo *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowGrupoModal(true)}
            >
              <Text style={[styles.selectButtonText, grupoId ? styles.selectButtonTextSelected : null]}>
                {getGrupoNombre(grupoId)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Equipo Local */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Equipo Local *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => grupoId && setShowEquipoLocalModal(true)}
              disabled={!grupoId}
            >
              <Text style={[styles.selectButtonText, equipoLocalId ? styles.selectButtonTextSelected : null]}>
                {getEquipoNombre(equipoLocalId)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Equipo Visitante */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Equipo Visitante *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => grupoId && setShowEquipoVisitanteModal(true)}
              disabled={!grupoId}
            >
              <Text style={[styles.selectButtonText, equipoVisitanteId ? styles.selectButtonTextSelected : null]}>
                {getEquipoNombre(equipoVisitanteId)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Jornada */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Jornada *</Text>
            <TextInput
              style={styles.input}
              value={jornada}
              onChangeText={setJornada}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Tipo Encuentro */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Tipo Encuentro *</Text>
            <View style={styles.chipContainer}>
              {['unico', 'ida', 'vuelta'].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.chip, tipoEncuentro === tipo && styles.chipSelected]}
                  onPress={() => setTipoEncuentro(tipo as 'unico' | 'ida' | 'vuelta')}
                >
                  <Text style={[styles.chipText, tipoEncuentro === tipo && styles.chipTextSelected]}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Orden dentro de jornada */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Orden dentro de Jornada *</Text>
            <TextInput
              style={styles.input}
              value={ordenDentroJornada}
              onChangeText={setOrdenDentroJornada}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Es Ida y Vuelta */}
          <View style={styles.fieldContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setEsIdaVuelta(!esIdaVuelta)}
            >
              <MaterialCommunityIcons
                name={esIdaVuelta ? "checkbox-marked" : "checkbox-blank-outline"}
                size={24}
                color={esIdaVuelta ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.checkboxLabel}>Es Ida y Vuelta</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Datos del Partido (Opcionales) */}
          <Text style={styles.subsectionTitle}>Datos del Partido (Opcional)</Text>

          {/* Fecha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Fecha (opcional)</Text>
            <TextInput
              style={styles.input}
              value={fecha}
              onChangeText={setFecha}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Hora */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Hora (opcional)</Text>
            <TextInput
              style={styles.input}
              value={hora}
              onChangeText={setHora}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Local */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Local (opcional)</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowLocalModal(true)}
            >
              <Text style={[styles.selectButtonText, localId ? styles.selectButtonTextSelected : null]}>
                {getLocalNombre(localId)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Cancha */}
          {localId && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Cancha (opcional)</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowCanchaModal(true)}
              >
                <Text style={[styles.selectButtonText, canchaId ? styles.selectButtonTextSelected : null]}>
                  {getCanchaNombre(canchaId)}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {canchasDelLocal.length === 0 && (
                <Text style={styles.helpText}>Este local no tiene canchas registradas</Text>
              )}
            </View>
          )}
        </Card>

        {/* Botón de creación */}
        <View style={styles.actionsContainer}>
          <Button
            title={creating ? "Creando..." : "Crear Fixture y Partido"}
            onPress={handleCreateManual}
            disabled={creating}
            loading={creating}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: Seleccionar Grupo */}
      {showGrupoModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Grupo</Text>
              <TouchableOpacity onPress={() => setShowGrupoModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {grupos.length === 0 ? (
                <View style={[styles.modalItem, { alignItems: 'center' }]}>
                  <Text style={styles.helpText}>No hay grupos disponibles</Text>
                </View>
              ) : (
                grupos.map(grupo => (
                  <TouchableOpacity
                    key={grupo.id_grupo}
                    style={[
                      styles.modalItem,
                      grupoId === grupo.id_grupo && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setGrupoId(grupo.id_grupo);
                      setShowGrupoModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{grupo.nombre}</Text>
                    <Text style={styles.modalItemSubtext}>
                      {grupo.total_equipos_inscritos} equipos
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Modal: Seleccionar Equipo Local */}
      {showEquipoLocalModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Equipo Local</Text>
              <TouchableOpacity onPress={() => {
                setShowEquipoLocalModal(false);
                setSearchEquipoLocal('');
              }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar equipo..."
                value={searchEquipoLocal}
                onChangeText={setSearchEquipoLocal}
                placeholderTextColor={colors.textSecondary}
              />
              {searchEquipoLocal.length > 0 && (
                <TouchableOpacity onPress={() => setSearchEquipoLocal('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalList}>
              {equiposLocalesFiltrados.length === 0 ? (
                <View style={[styles.modalItem, { alignItems: 'center' }]}>
                  <Text style={styles.helpText}>
                    {equipos.length === 0 ? 'Este grupo no tiene equipos asignados' : 'No se encontraron equipos'}
                  </Text>
                </View>
              ) : (
                equiposLocalesFiltrados.map(equipo => (
                  <TouchableOpacity
                    key={equipo.id_equipo}
                    style={[
                      styles.modalItem,
                      equipoLocalId === equipo.id_equipo && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setEquipoLocalId(equipo.id_equipo);
                      setShowEquipoLocalModal(false);
                      setSearchEquipoLocal('');
                    }}
                  >
                    <Text style={styles.modalItemText}>{equipo.nombre}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Modal: Seleccionar Equipo Visitante */}
      {showEquipoVisitanteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Equipo Visitante</Text>
              <TouchableOpacity onPress={() => {
                setShowEquipoVisitanteModal(false);
                setSearchEquipoVisitante('');
              }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar equipo..."
                value={searchEquipoVisitante}
                onChangeText={setSearchEquipoVisitante}
                placeholderTextColor={colors.textSecondary}
              />
              {searchEquipoVisitante.length > 0 && (
                <TouchableOpacity onPress={() => setSearchEquipoVisitante('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalList}>
              {equiposVisitantesFiltrados.length === 0 ? (
                <View style={[styles.modalItem, { alignItems: 'center' }]}>
                  <Text style={styles.helpText}>
                    {equipos.length === 0 ? 'Este grupo no tiene equipos asignados' : 'No se encontraron equipos'}
                  </Text>
                </View>
              ) : (
                equiposVisitantesFiltrados.map(equipo => (
                  <TouchableOpacity
                    key={equipo.id_equipo}
                    style={[
                      styles.modalItem,
                      equipoVisitanteId === equipo.id_equipo && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setEquipoVisitanteId(equipo.id_equipo);
                      setShowEquipoVisitanteModal(false);
                      setSearchEquipoVisitante('');
                    }}
                  >
                    <Text style={styles.modalItemText}>{equipo.nombre}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Modal: Seleccionar Local */}
      {showLocalModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Local</Text>
              <TouchableOpacity onPress={() => setShowLocalModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[styles.modalItem, !localId && styles.modalItemSelected]}
                onPress={() => {
                  setLocalId(null);
                  setCanchaId(null);
                  setShowLocalModal(false);
                }}
              >
                <Text style={styles.modalItemText}>Sin local</Text>
              </TouchableOpacity>
              {locales.map(local => (
                <TouchableOpacity
                  key={local.id_local}
                  style={[
                    styles.modalItem,
                    localId === local.id_local && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setLocalId(local.id_local);
                    setCanchaId(null);
                    setShowLocalModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{local.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Modal: Seleccionar Cancha */}
      {showCanchaModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cancha</Text>
              <TouchableOpacity onPress={() => setShowCanchaModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {canchasDelLocal.length === 0 ? (
                <View style={[styles.modalItem, { alignItems: 'center' }]}>
                  <Text style={styles.helpText}>
                    {localId
                      ? 'Este local no tiene canchas registradas'
                      : 'Primero debes seleccionar un local'}
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.modalItem, !canchaId && styles.modalItemSelected]}
                    onPress={() => {
                      setCanchaId(null);
                      setShowCanchaModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>Sin cancha</Text>
                  </TouchableOpacity>
                  {canchasDelLocal.map(cancha => {
                    const localNombre = locales.find(l => l.id_local === cancha.id_local)?.nombre || '';
                    return (
                      <TouchableOpacity
                        key={cancha.id_cancha}
                        style={[
                          styles.modalItem,
                          canchaId === cancha.id_cancha && styles.modalItemSelected
                        ]}
                        onPress={() => {
                          setCanchaId(cancha.id_cancha);
                          setShowCanchaModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{cancha.nombre} - {localNombre}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>
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
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  jornadaContainer: {
    marginTop: 16,
  },
  jornadaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
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
  fixtureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fixtureTeams: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  fixtureGrupo: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fixtureDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  fixtureDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  createButton: {
    marginTop: 8,
  },
  fixtureInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  inputHalf: {
    flex: 1,
  },
  fixtureInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  canchaSelector: {
    marginBottom: 12,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectButtonTextSelected: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  modalItemSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
