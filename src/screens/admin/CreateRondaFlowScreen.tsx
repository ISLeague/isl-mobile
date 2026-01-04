import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Input, Button } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import { Partido, Cancha } from '../../api/types';
import { FixtureGenerateResponse, EnfrentamientoFixture } from '../../api/types/rondas.types';
import api from '../../api';

interface CreateRondaFlowScreenProps {
  navigation: any;
  route: any;
}

type FlowStep = 'create' | 'generate' | 'assign';

export const CreateRondaFlowScreen: React.FC<CreateRondaFlowScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria } = route.params || {};
  const { showSuccess, showError } = useToast();

  // Flow control
  const [currentStep, setCurrentStep] = useState<FlowStep>('create');
  const [loading, setLoading] = useState(false);

  // Step 1: Create Ronda
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'fase_grupos' | 'eliminatorias' | 'amistosa'>('fase_grupos');
  const [subtipoEliminatoria, setSubtipoEliminatoria] = useState<'oro' | 'plata' | 'bronce'>('oro');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [orden, setOrden] = useState('1');

  // Step 2: Generate Fixture
  const [createdRondaId, setCreatedRondaId] = useState<number | null>(null);
  const [createdFaseId, setCreatedFaseId] = useState<number | null>(null);
  const [tipoGeneracion, setTipoGeneracion] = useState<'round_robin' | 'amistoso_aleatorio' | 'amistoso_intergrupos'>('round_robin');
  const [idaVuelta, setIdaVuelta] = useState(false);
  const [cantidadPartidos, setCantidadPartidos] = useState('');
  const [fixtureResponse, setFixtureResponse] = useState<FixtureGenerateResponse | null>(null);

  // Step 3: Assign Details to Fixtures
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [fixtureDetails, setFixtureDetails] = useState<{
    [fixtureId: number]: {
      fecha: string;
      hora: string;
      id_cancha: number | null;
    };
  }>({});

  useEffect(() => {
    if (currentStep === 'assign') {
      loadCanchas();
    }
  }, [currentStep]);

  // Restore state when coming back from creating locales/canchas
  useEffect(() => {
    if (route.params?.returnFromCanchas) {
      const {
        savedRondaId,
        savedFaseId,
        savedFixtureResponse,
        savedFixtureDetails,
        savedNombre,
        savedTipo,
      } = route.params;

      if (savedRondaId && savedFaseId && savedFixtureResponse) {
        setCreatedRondaId(savedRondaId);
        setCreatedFaseId(savedFaseId);
        setFixtureResponse(savedFixtureResponse);
        setFixtureDetails(savedFixtureDetails || {});
        setNombre(savedNombre || '');
        setTipo(savedTipo || 'fase_grupos');
        setCurrentStep('assign');
        loadCanchas();
      }
    }
  }, [route.params?.returnFromCanchas]);

  const loadCanchas = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        // First get locales for this edicion
        const localesResponse = await api.locales.list(idEdicionCategoria);
        if (!localesResponse.success || !localesResponse.data?.locales) {
          return [];
        }

        // Then get all canchas for each local
        const allCanchas: Cancha[] = [];
        for (const local of localesResponse.data.locales) {
          const canchasResponse = await api.canchas.list(local.id_local);
          if (canchasResponse.success && canchasResponse.data?.canchas) {
            allCanchas.push(...canchasResponse.data.canchas);
          }
        }

        return allCanchas;
      },
      'CreateRondaFlow - loadCanchas',
      {
        fallbackValue: [],
        onError: () => showError('Error al cargar las canchas'),
      }
    );

    setCanchas(result || []);
    setLoading(false);
  };

  const handleNavigateToCreateLocal = () => {
    // Save current state
    const savedState = {
      returnFromCanchas: true,
      savedRondaId: createdRondaId,
      savedFaseId: createdFaseId,
      savedFixtureResponse: fixtureResponse,
      savedFixtureDetails: fixtureDetails,
      savedNombre: nombre,
      savedTipo: tipo,
    };

    // Navigate to create local screen with return params
    navigation.navigate('CreateLocal', {
      idEdicionCategoria,
      returnTo: 'CreateRondaFlow',
      returnParams: savedState,
    });
  };

  const handleCreateRonda = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la ronda es requerido');
      return;
    }

    if (!orden.trim() || isNaN(parseInt(orden))) {
      Alert.alert('Error', 'El orden debe ser un número');
      return;
    }

    setLoading(true);

    // Get fase for this edicion
    const fasesResult = await safeAsync(
      async () => {
        const response = await api.fases.list(idEdicionCategoria);

        const fase = response.success && response.data && response.data.length > 0
          ? response.data.find((f: any) => f.tipo === 'grupo') || response.data[0]
          : null;

        return fase;
      },
      'CreateRondaFlow - getFase',
      {
        fallbackValue: null,
        onError: (error) => {
          showError('Error al obtener la fase');
        },
      }
    );

    if (!fasesResult || !fasesResult.id_fase) {
      showError('No se encontró una fase válida para esta edición');
      setLoading(false);
      return;
    }

    const rondaData = {
      nombre: nombre.trim(),
      id_fase: fasesResult.id_fase,
      tipo,
      subtipo_eliminatoria: tipo === 'eliminatorias' ? subtipoEliminatoria : undefined,
      es_amistosa: tipo === 'amistosa',
      fecha_inicio: fechaInicio.trim() || undefined,
      fecha_fin: fechaFin.trim() || undefined,
      orden: parseInt(orden),
    };

    const result = await safeAsync(
      async () => {
        const response = await api.rondas.create(rondaData);
        return response;
      },
      'CreateRondaFlow - createRonda',
      {
        fallbackValue: null,
        onError: (error) => {
          showError('Error al crear la ronda');
        },
      }
    );

    setLoading(false);

    if (result && result.success && result.data) {
      const rondaId = result.data.id_ronda || result.data.id;
      setCreatedRondaId(rondaId);
      setCreatedFaseId(fasesResult.id_fase);
      showSuccess(`Ronda "${nombre}" creada exitosamente`);
      setCurrentStep('generate');
    }
  };

  const handleGenerateFixture = async () => {
    if (!createdRondaId) {
      return;
    }

    if (tipo === 'amistosa' && (!cantidadPartidos || parseInt(cantidadPartidos) <= 0)) {
      Alert.alert('Error', 'Para amistosos, especifica la cantidad de partidos');
      return;
    }

    setLoading(true);

    const fixtureData: any = {
      id_ronda: createdRondaId,
      tipo_generacion: tipoGeneracion,
      ida_vuelta: tipo === 'fase_grupos' ? idaVuelta : false,
    };

    // Solo agregar cantidad_partidos si es amistosa
    if (tipo === 'amistosa' && cantidadPartidos) {
      fixtureData.cantidad_partidos = parseInt(cantidadPartidos);
    }

    const result = await safeAsync(
      async () => {
        const response = await api.rondas.generarFixture(fixtureData);
        return response;
      },
      'CreateRondaFlow - generateFixture',
      {
        fallbackValue: null,
        onError: (error) => {
          showError('Error al generar el fixture');
        },
      }
    );

    setLoading(false);

    if (result && result.success) {

      // Store the fixture response for Step 3
      setFixtureResponse(result);

      // Initialize fixture details with empty values
      const initialDetails: { [fixtureId: number]: { fecha: string; hora: string; id_cancha: number | null } } = {};
      result.data.jornadas.forEach((jornada: any) => {
        jornada.enfrentamientos.forEach((enfrentamiento: any) => {
          initialDetails[enfrentamiento.fixture_id] = {
            fecha: '',
            hora: '',
            id_cancha: null,
          };
        });
      });
      setFixtureDetails(initialDetails);

      showSuccess('Fixture generado exitosamente');
      setCurrentStep('assign');
    }
  };

  const handleCreatePartidos = async () => {
    if (!fixtureResponse || !createdRondaId || !createdFaseId) {
      showError('No hay datos de fixture disponibles');
      return;
    }

    // Validate all fixtures have required data
    const allFixtures: any[] = [];
    fixtureResponse.data.jornadas.forEach((jornada) => {
      jornada.enfrentamientos.forEach((enfrentamiento) => {
        allFixtures.push(enfrentamiento);
      });
    });

    // Check if all fixtures have fecha, hora, and cancha assigned
    const missingData = allFixtures.some((fixture) => {
      const details = fixtureDetails[fixture.fixture_id];
      return !details || !details.fecha || !details.hora || !details.id_cancha;
    });

    if (missingData) {
      Alert.alert('Error', 'Por favor asigna fecha, hora y cancha a todos los partidos');
      return;
    }

    setLoading(true);

    let createdCount = 0;
    let errorCount = 0;

    // Create partidos one by one
    for (const fixture of allFixtures) {
      const details = fixtureDetails[fixture.fixture_id];

      const tipoPartido: 'clasificacion' | 'eliminatoria' | 'amistoso' =
        tipo === 'amistosa' ? 'amistoso' : tipo === 'eliminatorias' ? 'eliminatoria' : 'clasificacion';

      const partidoData = {
        id_fixture: fixture.fixture_id,
        id_equipo_local: fixture.id_equipo_local,
        id_equipo_visitante: fixture.id_equipo_visitante,
        id_ronda: createdRondaId,
        id_fase: createdFaseId,
        id_cancha: details.id_cancha!,
        fecha: details.fecha,
        hora: details.hora,
        tipo_partido: tipoPartido,
        afecta_clasificacion: tipo !== 'amistosa',
        observaciones: fixture.nombre_grupo
          ? `Partido de ${tipo === 'amistosa' ? 'amistoso' : 'clasificación'} - Grupo ${fixture.nombre_grupo}`
          : `Partido de ${tipo === 'amistosa' ? 'amistoso' : tipo}`,
      };

      const result = await safeAsync(
        async () => {
          const response = await api.partidos.createFromFixture(partidoData);
          return response;
        },
        'CreateRondaFlow - createPartido',
        {
          fallbackValue: null,
          onError: (error) => {
            errorCount++;
          },
        }
      );

      if (result && result.success) {
        createdCount++;
      }
    }

    setLoading(false);

    if (errorCount > 0) {
      showError(`Se crearon ${createdCount} partidos con ${errorCount} errores`);
    } else {
      showSuccess(`${createdCount} partidos creados exitosamente`);
      navigation.goBack();
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, currentStep === 'create' && styles.stepCircleActive]}>
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <Text style={styles.stepLabel}>Crear Ronda</Text>
      </View>

      <View style={styles.stepLine} />

      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, currentStep === 'generate' && styles.stepCircleActive]}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <Text style={styles.stepLabel}>Generar Fixture</Text>
      </View>

      <View style={styles.stepLine} />

      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, currentStep === 'assign' && styles.stepCircleActive]}>
          <Text style={styles.stepNumber}>3</Text>
        </View>
        <Text style={styles.stepLabel}>Asignar Detalles</Text>
      </View>
    </View>
  );

  const renderCreateStep = () => (
    <ScrollView
      style={styles.stepContent}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.sectionTitle}>Información de la Ronda</Text>

      <Input
        label="Nombre de la Ronda *"
        placeholder="Ej: Jornada 1"
        value={nombre}
        onChangeText={setNombre}
        leftIcon={<MaterialCommunityIcons name="trophy" size={20} color={colors.textLight} />}
      />

      <Text style={styles.fieldLabel}>Tipo de Ronda *</Text>
      <View style={styles.tipoButtons}>
        <TouchableOpacity
          style={[styles.tipoButton, tipo === 'fase_grupos' && styles.tipoButtonActive]}
          onPress={() => setTipo('fase_grupos')}
        >
          <MaterialCommunityIcons
            name="group"
            size={24}
            color={tipo === 'fase_grupos' ? colors.white : colors.primary}
          />
          <Text style={[styles.tipoButtonText, tipo === 'fase_grupos' && styles.tipoButtonTextActive]}>
            Fase de Grupos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tipoButton, tipo === 'eliminatorias' && styles.tipoButtonActive]}
          onPress={() => setTipo('eliminatorias')}
        >
          <MaterialCommunityIcons
            name="trophy-variant"
            size={24}
            color={tipo === 'eliminatorias' ? colors.white : colors.primary}
          />
          <Text style={[styles.tipoButtonText, tipo === 'eliminatorias' && styles.tipoButtonTextActive]}>
            Eliminatorias
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tipoButton, tipo === 'amistosa' && styles.tipoButtonActive]}
          onPress={() => setTipo('amistosa')}
        >
          <MaterialCommunityIcons
            name="hand-heart"
            size={24}
            color={tipo === 'amistosa' ? colors.white : colors.primary}
          />
          <Text style={[styles.tipoButtonText, tipo === 'amistosa' && styles.tipoButtonTextActive]}>
            Amistosa
          </Text>
        </TouchableOpacity>
      </View>

      {tipo === 'eliminatorias' && (
        <>
          <Text style={styles.fieldLabel}>Subtipo de Eliminatoria *</Text>
          <View style={styles.subtipoButtons}>
            <TouchableOpacity
              style={[styles.subtipoButton, subtipoEliminatoria === 'oro' && styles.subtipoButtonOro]}
              onPress={() => setSubtipoEliminatoria('oro')}
            >
              <Text style={styles.subtipoButtonText}>Oro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subtipoButton, subtipoEliminatoria === 'plata' && styles.subtipoButtonPlata]}
              onPress={() => setSubtipoEliminatoria('plata')}
            >
              <Text style={styles.subtipoButtonText}>Plata</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subtipoButton, subtipoEliminatoria === 'bronce' && styles.subtipoButtonBronce]}
              onPress={() => setSubtipoEliminatoria('bronce')}
            >
              <Text style={styles.subtipoButtonText}>Bronce</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Input
        label="Fecha de Inicio"
        placeholder="YYYY-MM-DD"
        value={fechaInicio}
        onChangeText={setFechaInicio}
        leftIcon={<MaterialCommunityIcons name="calendar" size={20} color={colors.textLight} />}
      />

      <Input
        label="Fecha de Fin"
        placeholder="YYYY-MM-DD"
        value={fechaFin}
        onChangeText={setFechaFin}
        leftIcon={<MaterialCommunityIcons name="calendar-end" size={20} color={colors.textLight} />}
      />

      <Input
        label="Orden *"
        placeholder="Ej: 1"
        value={orden}
        onChangeText={setOrden}
        keyboardType="numeric"
        leftIcon={<MaterialCommunityIcons name="sort-numeric-ascending" size={20} color={colors.textLight} />}
      />

      <Button
        title="Siguiente: Generar Fixture"
        onPress={handleCreateRonda}
        loading={loading}
        disabled={loading}
        style={styles.button}
      />
    </ScrollView>
  );

  const renderGenerateStep = () => (
    <ScrollView
      style={styles.stepContent}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.sectionTitle}>Generar Fixture</Text>

      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information" size={24} color={colors.info} />
        <Text style={styles.infoText}>
          Selecciona cómo quieres generar los partidos de esta ronda
        </Text>
      </View>

      <Text style={styles.fieldLabel}>Tipo de Generación *</Text>
      <View style={styles.generacionButtons}>
        <TouchableOpacity
          style={[styles.generacionButton, tipoGeneracion === 'round_robin' && styles.generacionButtonActive]}
          onPress={() => setTipoGeneracion('round_robin')}
          disabled={tipo === 'amistosa'}
        >
          <MaterialCommunityIcons
            name="group"
            size={28}
            color={tipoGeneracion === 'round_robin' ? colors.white : tipo === 'amistosa' ? colors.textLight : colors.primary}
          />
          <Text style={[
            styles.generacionButtonText,
            tipoGeneracion === 'round_robin' && styles.generacionButtonTextActive,
            tipo === 'amistosa' && styles.generacionButtonTextDisabled
          ]}>
            Round Robin
          </Text>
          <Text style={[
            styles.generacionButtonDesc,
            tipoGeneracion === 'round_robin' && styles.generacionButtonDescActive,
            tipo === 'amistosa' && styles.generacionButtonTextDisabled
          ]}>
            Todos contra todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.generacionButton, tipoGeneracion === 'amistoso_aleatorio' && styles.generacionButtonActive]}
          onPress={() => setTipoGeneracion('amistoso_aleatorio')}
        >
          <MaterialCommunityIcons
            name="shuffle-variant"
            size={28}
            color={tipoGeneracion === 'amistoso_aleatorio' ? colors.white : colors.primary}
          />
          <Text style={[styles.generacionButtonText, tipoGeneracion === 'amistoso_aleatorio' && styles.generacionButtonTextActive]}>
            Aleatorio
          </Text>
          <Text style={[styles.generacionButtonDesc, tipoGeneracion === 'amistoso_aleatorio' && styles.generacionButtonDescActive]}>
            Emparejamientos al azar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.generacionButton,
            tipoGeneracion === 'amistoso_intergrupos' && styles.generacionButtonActive,
            tipo !== 'amistosa' && styles.generacionButtonDisabled
          ]}
          onPress={() => setTipoGeneracion('amistoso_intergrupos')}
          disabled={tipo !== 'amistosa'}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={28}
            color={tipoGeneracion === 'amistoso_intergrupos' ? colors.white : tipo !== 'amistosa' ? colors.textLight : colors.primary}
          />
          <Text style={[
            styles.generacionButtonText,
            tipoGeneracion === 'amistoso_intergrupos' && styles.generacionButtonTextActive,
            tipo !== 'amistosa' && styles.generacionButtonTextDisabled
          ]}>
            Inter-Grupos
          </Text>
          <Text style={[
            styles.generacionButtonDesc,
            tipoGeneracion === 'amistoso_intergrupos' && styles.generacionButtonDescActive,
            tipo !== 'amistosa' && styles.generacionButtonTextDisabled
          ]}>
            Cruces entre grupos
          </Text>
        </TouchableOpacity>
      </View>

      {tipo === 'fase_grupos' && tipoGeneracion === 'round_robin' && (
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <MaterialCommunityIcons name="repeat" size={24} color={colors.textPrimary} />
            <View>
              <Text style={styles.switchText}>Ida y Vuelta</Text>
              <Text style={styles.switchSubtext}>Genera partidos de ida y vuelta</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setIdaVuelta(!idaVuelta)}>
            <View style={[styles.customSwitch, idaVuelta && styles.customSwitchActive]}>
              <View style={[styles.customSwitchThumb, idaVuelta && styles.customSwitchThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {tipo === 'amistosa' && (
        <Input
          label="Cantidad de Partidos *"
          placeholder="Ej: 10"
          value={cantidadPartidos}
          onChangeText={setCantidadPartidos}
          keyboardType="numeric"
          leftIcon={<MaterialCommunityIcons name="soccer-field" size={20} color={colors.textLight} />}
        />
      )}

      <View style={styles.buttonRow}>
        <Button
          title="Atrás"
          onPress={() => setCurrentStep('create')}
          variant="secondary"
          style={styles.buttonHalf}
        />
        <Button
          title="Generar Partidos"
          onPress={handleGenerateFixture}
          loading={loading}
          disabled={loading}
          style={styles.buttonHalf}
        />
      </View>
    </ScrollView>
  );

  const renderAssignStep = () => {
    if (!fixtureResponse) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No hay fixtures generados</Text>
        </View>
      );
    }

    // Flatten all fixtures
    const allFixtures: any[] = [];
    fixtureResponse.data.jornadas.forEach((jornada) => {
      jornada.enfrentamientos.forEach((enfrentamiento) => {
        allFixtures.push({
          ...enfrentamiento,
          jornada: jornada.jornada,
        });
      });
    });

    return (
      <ScrollView
        style={styles.stepContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.sectionTitle}>Asignar Detalles a los Partidos</Text>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Asigna fecha, hora y cancha a cada partido generado
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando canchas...</Text>
          </View>
        ) : canchas.length === 0 ? (
          <View style={styles.emptyCanchasContainer}>
            <MaterialCommunityIcons name="soccer-field" size={64} color={colors.textLight} />
            <Text style={styles.emptyCanchasTitle}>No hay canchas disponibles</Text>
            <Text style={styles.emptyCanchasText}>
              Para continuar necesitas crear al menos un local y una cancha
            </Text>
            <Button
              title="Crear Local y Canchas"
              onPress={handleNavigateToCreateLocal}
              style={styles.createLocalButton}
            />
            <Button
              title="Reintentar"
              onPress={loadCanchas}
              variant="secondary"
              style={styles.retryButton}
            />
          </View>
        ) : (
          <View>
            {allFixtures.map((fixture, index) => {
              const details = fixtureDetails[fixture.fixture_id] || { fecha: '', hora: '', id_cancha: null };
              const selectedCancha = canchas.find(c => c.id_cancha === details.id_cancha);

              return (
                <View key={fixture.fixture_id} style={styles.fixtureCard}>
                  {/* Header */}
                  <View style={styles.fixtureHeader}>
                    <View style={styles.fixtureHeaderLeft}>
                      <MaterialCommunityIcons name="soccer" size={20} color={colors.primary} />
                      <Text style={styles.fixtureTitle}>
                        Jornada {fixture.jornada} - Partido {index + 1}
                      </Text>
                    </View>
                    {fixture.nombre_grupo && (
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>Grupo {fixture.nombre_grupo}</Text>
                      </View>
                    )}
                  </View>

                  {/* Teams */}
                  <View style={styles.fixtureTeams}>
                    <Text style={styles.teamName}>{fixture.local}</Text>
                    <Text style={styles.vsText}>VS</Text>
                    <Text style={styles.teamName}>{fixture.visitante}</Text>
                  </View>

                  {/* Inputs */}
                  <View style={styles.fixtureInputs}>
                    <View style={styles.inputRow}>
                      <View style={styles.inputHalf}>
                        <Text style={styles.inputLabel}>Fecha *</Text>
                        <Input
                          placeholder="YYYY-MM-DD"
                          value={details.fecha}
                          onChangeText={(text) => {
                            setFixtureDetails({
                              ...fixtureDetails,
                              [fixture.fixture_id]: {
                                ...details,
                                fecha: text,
                              },
                            });
                          }}
                          leftIcon={<MaterialCommunityIcons name="calendar" size={18} color={colors.textLight} />}
                        />
                      </View>

                      <View style={styles.inputHalf}>
                        <Text style={styles.inputLabel}>Hora *</Text>
                        <Input
                          placeholder="HH:MM"
                          value={details.hora}
                          onChangeText={(text) => {
                            setFixtureDetails({
                              ...fixtureDetails,
                              [fixture.fixture_id]: {
                                ...details,
                                hora: text,
                              },
                            });
                          }}
                          leftIcon={<MaterialCommunityIcons name="clock-outline" size={18} color={colors.textLight} />}
                        />
                      </View>
                    </View>

                    {/* Cancha Selector */}
                    <View style={styles.canchaSelector}>
                      <Text style={styles.inputLabel}>Cancha *</Text>
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
                            onPress={() => {
                              setFixtureDetails({
                                ...fixtureDetails,
                                [fixture.fixture_id]: {
                                  ...details,
                                  id_cancha: cancha.id_cancha,
                                },
                              });
                            }}
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

                    {/* Status indicator */}
                    {details.fecha && details.hora && details.id_cancha && (
                      <View style={styles.completeIndicator}>
                        <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                        <Text style={styles.completeText}>Completo</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button
            title="Atrás"
            onPress={() => setCurrentStep('generate')}
            variant="secondary"
            style={styles.buttonHalf}
          />
          <Button
            title="Crear Partidos"
            onPress={handleCreatePartidos}
            loading={loading}
            disabled={loading}
            style={styles.buttonHalf}
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep === 'create') {
              navigation.goBack();
            } else {
              Alert.alert(
                'Salir del flujo',
                '¿Estás seguro? Se perderá el progreso actual.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Salir', onPress: () => navigation.goBack() },
                ]
              );
            }
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          <Text style={styles.backButtonText}>
            {currentStep === 'create' ? 'Volver' : 'Salir'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crear Ronda</Text>
      </View>

      {renderStepIndicator()}

      {currentStep === 'create' && renderCreateStep()}
      {currentStep === 'generate' && renderGenerateStep()}
      {currentStep === 'assign' && renderAssignStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
    marginBottom: 32,
  },
  stepContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  tipoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  tipoButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tipoButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tipoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  tipoButtonTextActive: {
    color: colors.white,
  },
  subtipoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  subtipoButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  subtipoButtonOro: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  subtipoButtonPlata: {
    borderColor: '#C0C0C0',
    backgroundColor: '#C0C0C0',
  },
  subtipoButtonBronce: {
    borderColor: '#CD7F32',
    backgroundColor: '#CD7F32',
  },
  subtipoButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  generacionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  generacionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  generacionButtonDisabled: {
    backgroundColor: colors.backgroundGray,
    borderColor: colors.border,
  },
  generacionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  generacionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
  },
  generacionButtonTextActive: {
    color: colors.white,
  },
  generacionButtonTextDisabled: {
    color: colors.textLight,
  },
  generacionButtonDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  generacionButtonDescActive: {
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  customSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.backgroundGray,
    padding: 2,
    justifyContent: 'center',
  },
  customSwitchActive: {
    backgroundColor: colors.success,
  },
  customSwitchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  customSwitchThumbActive: {
    alignSelf: 'flex-end',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    marginTop: 24,
  },
  buttonHalf: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  partidoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partidoInfo: {
    flex: 1,
  },
  partidoEquipos: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  canchaAsignada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  canchaAsignadaText: {
    fontSize: 13,
    color: colors.success,
  },
  asignarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
  },
  asignarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  canchasList: {
    padding: 20,
  },
  canchaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  canchaItemInfo: {
    flex: 1,
  },
  canchaItemNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  canchaItemDetalle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // New styles for fixture cards
  fixtureCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fixtureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fixtureHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixtureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  groupBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.white,
  },
  fixtureTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textLight,
    paddingHorizontal: 8,
  },
  fixtureInputs: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
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
  completeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  completeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  emptyCanchasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyCanchasTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyCanchasText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  createLocalButton: {
    width: '100%',
    marginTop: 8,
  },
  retryButton: {
    width: '100%',
    marginTop: 8,
  },
});
