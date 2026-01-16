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
import { Input, Button, DatePickerInput, TimePickerInput } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import { Partido, Cancha, Equipo, Grupo, Clasificacion } from '../../api/types';
import { FixtureGenerateResponse, EnfrentamientoFixture } from '../../api/types/rondas.types';
import api from '../../api';

interface CreateRondaFlowScreenProps {
  navigation: any;
  route: any;
}

type FlowStep = 'create' | 'generate' | 'assign';

export const CreateRondaFlowScreen: React.FC<CreateRondaFlowScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria, step, rondaData } = route.params || {};
  const { showSuccess, showError } = useToast();

  // Flow control - inicializar según el paso proporcionado
  const getInitialStep = (): FlowStep => {
    if (step === 2 && rondaData) return 'generate';
    if (step === 3 && rondaData) return 'assign';
    return 'create';
  };

  const [currentStep, setCurrentStep] = useState<FlowStep>(getInitialStep());
  const [loading, setLoading] = useState(false);

  // Step 1: Create Ronda
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'fase_grupos' | 'amistosa'>('fase_grupos');
  const [vecesEnfrentamiento, setVecesEnfrentamiento] = useState('1');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [orden, setOrden] = useState('1');
  const [modoCreacion, setModoCreacion] = useState<'individual' | 'automatico'>('individual');

  // Step 2: Generate Fixture
  const [createdRondaId, setCreatedRondaId] = useState<number | null>(null);
  const [createdFaseId, setCreatedFaseId] = useState<number | null>(null);
  const [tipoGeneracion, setTipoGeneracion] = useState<'round_robin' | 'amistoso_aleatorio' | 'amistoso_intergrupos'>('round_robin');
  const [idaVuelta, setIdaVuelta] = useState(false);
  const [cantidadPartidos, setCantidadPartidos] = useState('');
  const [totalEquipos, setTotalEquipos] = useState<number>(0);
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

  // Inicializar con datos de ronda existente si se proporciona
  useEffect(() => {
    if (rondaData && step === 2) {
      // Configurar datos de la ronda existente
      setCreatedRondaId(rondaData.id_ronda);
      setCreatedFaseId(rondaData.id_fase);
      setNombre(rondaData.nombre);
      setTipo(rondaData.tipo === 'eliminatorias' ? 'fase_grupos' : rondaData.tipo);
      setFechaInicio(rondaData.fecha_inicio);
      setFechaFin(rondaData.fecha_fin);
      setOrden(rondaData.orden?.toString() || '1');

      console.log('🔧 Inicializando con ronda existente:', {
        id_ronda: rondaData.id_ronda,
        nombre: rondaData.nombre,
        tipo: rondaData.tipo,
        step: step
      });
    }
  }, [rondaData, step]);

  useEffect(() => {
    if (currentStep === 'assign') {
      loadCanchas();
    }
  }, [currentStep]);

  // Cargar número de equipos EN GRUPOS al inicio
  useEffect(() => {
    const loadEquiposEnGrupos = async () => {
      try {
        // Primero obtener la fase de grupos
        const fasesResponse = await api.fases.getFaseGrupos(idEdicionCategoria);
        if (fasesResponse.success && fasesResponse.data && fasesResponse.data.length > 0) {
          const idFase = fasesResponse.data[0].id_fase;
          // Obtener grupos con equipos
          const gruposResponse = await api.grupos.get(idFase);
          if (gruposResponse.success && gruposResponse.data?.grupos) {
            // Contar total de equipos en todos los grupos
            let totalEnGrupos = 0;
            gruposResponse.data.grupos.forEach((grupo: any) => {
              totalEnGrupos += grupo.equipos?.length || 0;
            });
            setTotalEquipos(totalEnGrupos);
          }
        }
      } catch (error) {
        console.log('Error cargando equipos en grupos:', error);
      }
    };
    if (idEdicionCategoria) {
      loadEquiposEnGrupos();
    }
  }, [idEdicionCategoria]);

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
          const canchasResponse = await api.canchas.listByEdicionCategoria(idEdicionCategoria);
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
    // Si es modo automático, no validar nombre
    if (tipo !== 'fase_grupos' || modoCreacion !== 'automatico') {
      if (!nombre.trim()) {
        Alert.alert('Error', 'El nombre de la ronda es requerido');
        return;
      }
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

    if (tipo === 'fase_grupos' && modoCreacion === 'automatico') {
      handleCreateAutomaticRondas(fasesResult.id_fase);
      return;
    }

    const rondaData = {
      nombre: nombre.trim(),
      id_fase: fasesResult.id_fase,
      tipo,
      cantidad_enfrentamientos: tipo === 'fase_grupos' ? parseInt(vecesEnfrentamiento) : undefined,
      es_amistosa: tipo === 'amistosa',
      fecha_inicio: tipo === 'amistosa' ? (fechaInicio.trim() || undefined) : undefined,
      fecha_fin: tipo === 'amistosa' ? (fechaFin.trim() || undefined) : undefined,
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

      if (tipo === 'fase_grupos' && modoCreacion === 'individual') {
        navigation.goBack();
      } else {
        setCurrentStep('generate');
      }
    }
  };

  const handleCreateAutomaticRondas = async (idFase: number) => {
    setLoading(true);

    try {
      // 1. Obtener grupos para saber cuántas rondas generar
      const gruposResult = await api.grupos.get(idFase);
      if (!gruposResult.success || !gruposResult.data?.grupos || gruposResult.data.grupos.length === 0) {
        showError('No hay grupos creados en esta fase.');
        setLoading(false);
        return;
      }

      const grupos = gruposResult.data.grupos;
      const numEquipos = grupos[0].equipos?.length || 0;

      // Validar que todos los grupos tengan el mismo tamaño
      const allSameSize = grupos.every((g: any) => (g.equipos?.length || 0) === numEquipos);
      if (!allSameSize) {
        Alert.alert('Error', 'Todos los grupos deben tener la misma cantidad de equipos.');
        setLoading(false);
        return;
      }

      if (numEquipos < 2) {
        Alert.alert('Error', 'Los grupos deben tener al menos 2 equipos.');
        setLoading(false);
        return;
      }

      // Calcular rondas necesarias basado en la lógica de enfrentamientos
      // Para 4 equipos: 3 rondas (1° vs 4°, 1° vs 3°, 1° vs 2°)
      // Si se enfrentan 2 veces, serían 6 rondas
      const veces = parseInt(vecesEnfrentamiento) || 1;
      const totalRondas = (numEquipos - 1) * veces;

      let rondasCreadas = 0;
      let partidosCreados = 0;

      // 2. Crear rondas, generar fixtures y crear partidos
      for (let i = 1; i <= totalRondas; i++) {
        // Crear Ronda
        const rondaData = {
          nombre: `Fecha ${i}`,
          id_fase: idFase,
          tipo: 'fase_grupos' as const,
          cantidad_enfrentamientos: veces,
          orden: i,
        };

        const rondaRes = await api.rondas.create(rondaData);
        if (rondaRes.success && rondaRes.data) {
          const rondaId = rondaRes.data.id_ronda || rondaRes.data.id;

          // Determinar la jornada actual dentro del ciclo de veces
          const jornadaActual = ((i - 1) % (numEquipos - 1)) + 1;

          // Generar Fixture para esta ronda con la lógica de posiciones
          const fixtureRes = await api.rondas.generarFixture({
            id_ronda: rondaId,
            tipo_generacion: 'round_robin',
            jornada: jornadaActual,
            ida_vuelta: veces > 1
          });

          rondasCreadas++;

          // Crear partidos automáticamente a partir de los fixtures generados
          console.log(`🔍 [AUTO] Fixture response para ronda ${rondaId}:`, JSON.stringify(fixtureRes.data, null, 2));

          if (fixtureRes.success && fixtureRes.data?.jornadas) {
            for (const jornada of fixtureRes.data.jornadas) {
              console.log(`📋 [AUTO] Procesando jornada ${jornada.jornada} con ${jornada.enfrentamientos?.length || 0} enfrentamientos`);

              for (const enfrentamiento of jornada.enfrentamientos) {
                console.log(`⚽ [AUTO] Enfrentamiento:`, enfrentamiento);

                const partidoData = {
                  id_fixture: enfrentamiento.fixture_id,
                  id_equipo_local: enfrentamiento.id_equipo_local,
                  id_equipo_visitante: enfrentamiento.id_equipo_visitante,
                  id_ronda: rondaId,
                  id_fase: idFase,
                  tipo_partido: 'clasificacion' as const,
                  afecta_clasificacion: true,
                  estado_partido: 'Pendiente',
                  observaciones: enfrentamiento.nombre_grupo
                    ? `Partido de clasificación - Grupo ${enfrentamiento.nombre_grupo}`
                    : 'Partido de clasificación',
                };

                console.log(`📤 [AUTO] Creando partido con datos:`, partidoData);
                const partidoRes = await api.partidos.createFromFixture(partidoData);
                console.log(`📥 [AUTO] Respuesta crear partido:`, partidoRes);

                if (partidoRes.success) {
                  partidosCreados++;
                } else {
                  console.error(`❌ [AUTO] Error creando partido:`, partidoRes.error);
                }
              }
            }
          } else {
            console.warn(`⚠️ [AUTO] No hay jornadas en fixtureRes:`, fixtureRes);
          }
        }
      }

      showSuccess(`Se crearon ${rondasCreadas} rondas y ${partidosCreados} partidos automáticamente.`);
      navigation.goBack();
    } catch (error) {
      showError('Error durante la creación automática de rondas.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFixture = async () => {
    console.log('🔍 [handleGenerateFixture] Validando datos iniciales...');
    console.log('📊 [handleGenerateFixture] Estado actual:', {
      createdRondaId,
      tipo,
      tipoGeneracion,
      idaVuelta,
      cantidadPartidos
    });

    if (!createdRondaId) {
      console.log('❌ [handleGenerateFixture] Error: createdRondaId es nulo');
      Alert.alert('Error', 'No se encontró la ronda creada');
      return;
    }

    if (tipo === 'amistosa' && (!cantidadPartidos || parseInt(cantidadPartidos) <= 0)) {
      console.log('❌ [handleGenerateFixture] Error: cantidad de partidos inválida para amistosos');
      Alert.alert('Error', 'Para amistosos, especifica la cantidad de partidos');
      return;
    }

    setLoading(true);

    const fixtureData: any = {
      id_ronda: createdRondaId,
      tipo_generacion: tipoGeneracion,
      ida_vuelta: tipo === 'fase_grupos' ? (parseInt(vecesEnfrentamiento) > 1) : false,
    };

    // Solo agregar cantidad_partidos si es amistosa
    if (tipo === 'amistosa' && cantidadPartidos) {
      fixtureData.cantidad_partidos = parseInt(cantidadPartidos);
    }

    console.log('🔍 [handleGenerateFixture] Validando fixtureData antes de enviar...');
    console.log('📋 [handleGenerateFixture] fixtureData completo:', JSON.stringify(fixtureData, null, 2));

    // Validaciones adicionales
    if (!fixtureData.id_ronda || !fixtureData.tipo_generacion) {
      console.log('❌ [handleGenerateFixture] Error: campos requeridos faltantes');
      Alert.alert('Error', 'Datos incompletos para generar fixture');
      setLoading(false);
      return;
    }

    const result = await safeAsync(
      async () => {
        try {
          console.log('🚀 [generateFixture] Enviando request con datos:', JSON.stringify(fixtureData, null, 2));
          const response = await api.rondas.generarFixture(fixtureData);
          console.log('✅ [generateFixture] Respuesta recibida:', JSON.stringify(response, null, 2));
          return response;
        } catch (error) {
          console.log('💥 [generateFixture] Error capturado:', error);
          if (error instanceof Error) {
            console.log('💥 [generateFixture] Error message:', error.message);
            console.log('💥 [generateFixture] Error stack:', error.stack);
          }
          // Re-throw el error para que safeAsync lo maneje
          throw error;
        }
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

      // Crear partidos automáticamente sin pedir detalles
      await handleCreatePartidosAutomatically(result.data.jornadas);
    }
  };

  const handleCreatePartidosAutomatically = async (jornadas: any[]) => {
    if (!createdRondaId || !createdFaseId) {
      showError('No hay datos de ronda disponibles');
      return;
    }

    setLoading(true);

    let createdCount = 0;
    let errorCount = 0;

    // Get all fixtures
    const allFixtures: any[] = [];
    jornadas.forEach((jornada) => {
      jornada.enfrentamientos.forEach((enfrentamiento: any) => {
        allFixtures.push(enfrentamiento);
      });
    });

    // Create partidos without fecha, hora, cancha
    for (const fixture of allFixtures) {
      const tipoPartido: 'clasificacion' | 'eliminatoria' | 'amistoso' =
        tipo === 'amistosa' ? 'amistoso' : 'clasificacion';

      const partidoData = {
        id_fixture: fixture.fixture_id,
        id_equipo_local: fixture.id_equipo_local,
        id_equipo_visitante: fixture.id_equipo_visitante,
        id_ronda: createdRondaId,
        id_fase: createdFaseId,
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
        'CreateRondaFlow - createPartidoAuto',
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
    }

    // Volver a la pantalla anterior
    navigation.goBack();
  };

  const validateFriendlyRoundDuplicates = () => {
    if (tipo !== 'amistosa') return true;

    const equiposEnJornadas: { [jornada: number]: Set<number> } = {};
    let isValid = true;

    if (!fixtureResponse?.data?.jornadas) return true;

    fixtureResponse.data.jornadas.forEach((jornada: any) => {
      const jornadaNum = jornada.jornada;
      if (!equiposEnJornadas[jornadaNum]) {
        equiposEnJornadas[jornadaNum] = new Set();
      }

      jornada.enfrentamientos.forEach((enfrentamiento: any) => {
        if (equiposEnJornadas[jornadaNum].has(enfrentamiento.id_equipo_local) ||
          equiposEnJornadas[jornadaNum].has(enfrentamiento.id_equipo_visitante)) {
          isValid = false;
        }
        equiposEnJornadas[jornadaNum].add(enfrentamiento.id_equipo_local);
        equiposEnJornadas[jornadaNum].add(enfrentamiento.id_equipo_visitante);
      });
    });

    return isValid;
  };

  const handleCreatePartidos = async () => {
    if (!fixtureResponse || !createdRondaId || !createdFaseId) {
      showError('No hay datos de fixture disponibles');
      return;
    }

    // Get all fixtures
    const allFixtures: any[] = [];
    fixtureResponse.data.jornadas.forEach((jornada) => {
      jornada.enfrentamientos.forEach((enfrentamiento) => {
        allFixtures.push(enfrentamiento);
      });
    });

    // Separate fixtures into complete and incomplete
    const completeFixtures = allFixtures.filter((fixture) => {
      const details = fixtureDetails[fixture.fixture_id];
      return details && details.fecha && details.hora && details.id_cancha;
    });

    const incompleteFixtures = allFixtures.filter((fixture) => {
      const details = fixtureDetails[fixture.fixture_id];
      return !details || !details.fecha || !details.hora || !details.id_cancha;
    });

    if (!validateFriendlyRoundDuplicates()) {
      Alert.alert(
        'Error de Validación',
        'Un equipo no puede jugar más de una vez en la misma jornada de amistosos. Revisa la generación del fixture.'
      );
      return;
    }

    setLoading(true);

    let createdCount = 0;
    let errorCount = 0;

    // Create partidos only for complete fixtures
    for (const fixture of completeFixtures) {
      const details = fixtureDetails[fixture.fixture_id];

      const tipoPartido: 'clasificacion' | 'eliminatoria' | 'amistoso' =
        tipo === 'amistosa' ? 'amistoso' : 'clasificacion';

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

    // Remove created fixtures from the response and fixtureDetails
    const createdFixtureIds = completeFixtures.map(f => f.fixture_id);
    const updatedJornadas = fixtureResponse.data.jornadas.map(jornada => ({
      ...jornada,
      enfrentamientos: jornada.enfrentamientos.filter(
        enf => !createdFixtureIds.includes(enf.fixture_id)
      )
    })).filter(jornada => jornada.enfrentamientos.length > 0);

    const updatedFixtureDetails = { ...fixtureDetails };
    createdFixtureIds.forEach(id => delete updatedFixtureDetails[id]);

    if (errorCount > 0) {
      showError(`Se crearon ${createdCount} partidos con ${errorCount} errores`);
      return;
    }

    showSuccess(`${createdCount} partidos creados exitosamente`);

    // If there are still incomplete fixtures, ask what to do
    if (incompleteFixtures.length > 0) {
      Alert.alert(
        'Partidos creados',
        `Se crearon ${createdCount} partidos. Quedan ${incompleteFixtures.length} fixtures pendientes.\n\n¿Qué deseas hacer?`,
        [
          {
            text: 'Continuar asignando',
            onPress: () => {
              // Update fixture response with remaining fixtures
              setFixtureResponse({
                ...fixtureResponse,
                data: {
                  ...fixtureResponse.data,
                  jornadas: updatedJornadas
                }
              });
              setFixtureDetails(updatedFixtureDetails);
            },
          },
          {
            text: 'Volver',
            onPress: () => navigation.navigate('AdminFixture', { idEdicionCategoria }),
          },
        ]
      );
    } else {
      // All fixtures were created, go to fixture
      navigation.navigate('AdminFixture', { idEdicionCategoria });
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
        <Text style={styles.stepLabel}>Generar y Crear Partidos</Text>
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

      {(tipo !== 'fase_grupos' || modoCreacion === 'individual') && (
        <Input
          label="Nombre de la Ronda *"
          placeholder="Ej: Jornada 1"
          value={nombre}
          onChangeText={setNombre}
          leftIcon={<MaterialCommunityIcons name="trophy" size={20} color={colors.textLight} />}
        />
      )}

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

      {tipo === 'fase_grupos' && (
        <>
          <View style={styles.tipoButtons}>
            <TouchableOpacity
              style={[styles.tipoButton, modoCreacion === 'individual' && styles.tipoButtonActive]}
              onPress={() => setModoCreacion('individual')}
            >
              <MaterialCommunityIcons
                name="account"
                size={24}
                color={modoCreacion === 'individual' ? colors.white : colors.primary}
              />
              <Text style={[styles.tipoButtonText, modoCreacion === 'individual' && styles.tipoButtonTextActive]}>
                Individual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tipoButton, modoCreacion === 'automatico' && styles.tipoButtonActive]}
              onPress={() => setModoCreacion('automatico')}
            >
              <MaterialCommunityIcons
                name="robot"
                size={24}
                color={modoCreacion === 'automatico' ? colors.white : colors.primary}
              />
              <Text style={[styles.tipoButtonText, modoCreacion === 'automatico' && styles.tipoButtonTextActive]}>
                Automático
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label="¿Cuántas veces se enfrentan los equipos? *"
            placeholder="Ej: 1 (Ida), 2 (Ida y Vuelta)"
            value={vecesEnfrentamiento}
            onChangeText={setVecesEnfrentamiento}
            keyboardType="numeric"
            leftIcon={<MaterialCommunityIcons name="repeat" size={20} color={colors.textLight} />}
          />
        </>
      )}



      {tipo === 'amistosa' && (
        <>
          <DatePickerInput
            label="Fecha de Inicio"
            value={fechaInicio}
            onChangeDate={setFechaInicio}
            placeholder="Seleccionar fecha de inicio"
            defaultToToday
          />

          <DatePickerInput
            label="Fecha de Fin"
            value={fechaFin}
            onChangeDate={setFechaFin}
            placeholder="Seleccionar fecha de fin"
            minimumDate={fechaInicio ? new Date(fechaInicio) : undefined}
            defaultToToday
          />
        </>
      )}

      <Input
        label="Orden *"
        placeholder="Ej: 1"
        value={orden}
        onChangeText={setOrden}
        keyboardType="numeric"
        leftIcon={<MaterialCommunityIcons name="sort-numeric-ascending" size={20} color={colors.textLight} />}
      />

      <Button
        title={
          tipo === 'fase_grupos' && modoCreacion === 'individual'
            ? 'Crear Ronda'
            : tipo === 'fase_grupos' && modoCreacion === 'automatico'
              ? 'Generar Rondas Automáticamente'
              : 'Siguiente: Generar Fixture'
        }
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
      <Text style={styles.sectionTitle}>
        {rondaData ? `Generar Fixtures - ${nombre}` : 'Generar Fixture'}
      </Text>

      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information" size={24} color={colors.info} />
        <Text style={styles.infoText}>
          {rondaData
            ? `Genera automáticamente los fixtures para la ronda "${nombre}"`
            : 'Selecciona cómo quieres generar los partidos de esta ronda'
          }
        </Text>
      </View>

      <Text style={styles.fieldLabel}>Tipo de Generación *</Text>
      <View style={styles.generacionButtons}>
        <TouchableOpacity
          style={[styles.generacionButton, tipoGeneracion === 'round_robin' && styles.generacionButtonActive]}
          onPress={() => setTipoGeneracion('round_robin')}
        >
          <MaterialCommunityIcons
            name="group"
            size={28}
            color={tipoGeneracion === 'round_robin' ? colors.white : colors.primary}
          />
          <Text style={[
            styles.generacionButtonText,
            tipoGeneracion === 'round_robin' && styles.generacionButtonTextActive,
          ]}>
            Round Robin
          </Text>
          <Text style={[
            styles.generacionButtonDesc,
            tipoGeneracion === 'round_robin' && styles.generacionButtonDescActive,
          ]}>
            Todos contra todos
          </Text>
        </TouchableOpacity>

        {tipo === 'amistosa' && (
          <TouchableOpacity
            style={[
              styles.generacionButton,
              tipoGeneracion === 'amistoso_intergrupos' && styles.generacionButtonActive,
            ]}
            onPress={() => setTipoGeneracion('amistoso_intergrupos')}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={28}
              color={tipoGeneracion === 'amistoso_intergrupos' ? colors.white : colors.primary}
            />
            <Text style={[
              styles.generacionButtonText,
              tipoGeneracion === 'amistoso_intergrupos' && styles.generacionButtonTextActive,
            ]}>
              Inter-Grupos
            </Text>
            <Text style={[
              styles.generacionButtonDesc,
              tipoGeneracion === 'amistoso_intergrupos' && styles.generacionButtonDescActive,
            ]}>
              Cruces entre grupos
            </Text>
          </TouchableOpacity>
        )}
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
        <>
          <Input
            label="Cantidad de Partidos *"
            placeholder="Ej: 10"
            value={cantidadPartidos}
            onChangeText={setCantidadPartidos}
            keyboardType="numeric"
            leftIcon={<MaterialCommunityIcons name="soccer-field" size={20} color={colors.textLight} />}
          />
          {totalEquipos > 0 && (
            <View style={styles.suggestionBox}>
              <MaterialCommunityIcons name="lightbulb-outline" size={18} color={colors.info} />
              <Text style={styles.suggestionText}>
                Sugerencia: {Math.floor(totalEquipos / 2)} partidos para que cada equipo juegue una vez ({totalEquipos} equipos en grupos)
              </Text>
            </View>
          )}
        </>
      )}

      <View style={styles.buttonRow}>
        <Button
          title="Atrás"
          onPress={() => setCurrentStep('create')}
          variant="secondary"
          style={styles.buttonHalf}
        />
        <Button
          title="Generar y Crear Partidos"
          onPress={handleGenerateFixture}
          loading={loading}
          disabled={loading}
          style={styles.button}
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
                        <DatePickerInput
                          label="Fecha *"
                          value={details.fecha}
                          onChangeDate={(date) => {
                            setFixtureDetails({
                              ...fixtureDetails,
                              [fixture.fixture_id]: {
                                ...details,
                                fecha: date,
                              },
                            });
                          }}
                          placeholder="Seleccionar fecha"
                        />
                      </View>

                      <View style={styles.inputHalf}>
                        <TimePickerInput
                          label="Hora *"
                          value={details.hora}
                          onChangeTime={(time) => {
                            setFixtureDetails({
                              ...fixtureDetails,
                              [fixture.fixture_id]: {
                                ...details,
                                hora: time,
                              },
                            });
                          }}
                          placeholder="Seleccionar hora"
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
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 16,
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
