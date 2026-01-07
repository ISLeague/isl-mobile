import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { Button, Card } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import api from '../../api';
import type { TipoCopa, TipoFase, Fase } from '../../api/types/fases.types';
import type { EquipoClasificado } from '../../api/types/fases.types';

interface CreateKnockoutFlowScreenProps {
  navigation: any;
  route: any;
}

type Step = 'select-copa' | 'select-equipos' | 'generando';

interface FaseKnockoutStatus {
  copa: TipoCopa;
  existe: boolean;
  fase?: Fase;
}

const getCopaGradient = (copa: TipoCopa) => {
  switch (copa) {
    case 'oro':
      return ['#FFD700', '#FFA500', '#FF8C00'];
    case 'plata':
      return ['#C0C0C0', '#A8A8A8', '#909090'];
    case 'bronce':
      return ['#CD7F32', '#B87333', '#A0522D'];
    default:
      return [colors.primary, colors.primary, colors.primary];
  }
};

const getCopaLabel = (copa: TipoCopa) => {
  switch (copa) {
    case 'oro':
      return 'Copa de Oro';
    case 'plata':
      return 'Copa de Plata';
    case 'bronce':
      return 'Copa de Bronce';
    default:
      return copa;
  }
};

const getCopaIcon = (copa: TipoCopa) => {
  switch (copa) {
    case 'oro':
      return 'trophy';
    case 'plata':
      return 'medal';
    case 'bronce':
      return 'podium-bronze';
    default:
      return 'trophy-outline';
  }
};

export const CreateKnockoutFlowScreen: React.FC<CreateKnockoutFlowScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria } = route.params || {};
  const { showSuccess, showError, showInfo } = useToast();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('select-copa');
  const [fasesStatus, setFasesStatus] = useState<FaseKnockoutStatus[]>([]);
  const [selectedCopa, setSelectedCopa] = useState<TipoCopa | null>(null);
  const [idFaseGrupos, setIdFaseGrupos] = useState<number | null>(null);
  const [clasificados, setClasificados] = useState<EquipoClasificado[]>([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<number[]>([]);
  const [creatingFase, setCreatingFase] = useState(false);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    loadFasesStatus();
  }, [idEdicionCategoria]);

  // Cargar clasificados cuando se avanza al paso de selección de equipos
  useEffect(() => {
    if (currentStep === 'select-equipos' && selectedCopa && clasificados.length === 0) {
      loadClasificados(selectedCopa);
    }
  }, [currentStep, selectedCopa]);

  const loadFasesStatus = async () => {
    setLoading(true);

    // Cargar todas las fases
    const result = await safeAsync(
      async () => {
        const response = await api.fases.list(idEdicionCategoria);
        return response;
      },
      'loadFases',
      {
        fallbackValue: null,
        onError: () => showError('Error al cargar las fases')
      }
    );

    if (result && result.success) {
      const fases = result.data || [];

      // Buscar fase de grupos
      const faseGrupos = fases.find((f: Fase) => f.tipo === 'grupo');
      if (faseGrupos) {
        setIdFaseGrupos(faseGrupos.id_fase);
      }

      // Verificar estado de cada copa
      const copas: TipoCopa[] = ['oro', 'plata', 'bronce'];
      const status: FaseKnockoutStatus[] = copas.map(copa => {
        const fase = fases.find((f: Fase) => f.tipo === 'knockout' && f.copa === copa);
        return {
          copa,
          existe: !!fase,
          fase: fase || undefined,
        };
      });

      setFasesStatus(status);
    }

    setLoading(false);
  };

  const handleSelectCopa = async (copa: TipoCopa) => {
    setSelectedCopa(copa);
    const copaStatus = fasesStatus.find(f => f.copa === copa);

    // Si no existe la fase, crearla primero
    if (!copaStatus?.existe) {
      await handleCreateFase(copa);
    }

    // Avanzar al siguiente paso
    setCurrentStep('select-equipos');
  };

  const handleCreateFase = async (copa: TipoCopa) => {
    setCreatingFase(true);

    const requestData = {
      nombre: `Knockout ${getCopaLabel(copa)}`,
      tipo: 'knockout' as TipoFase,
      copa: copa,
      orden: copa === 'oro' ? 1 : copa === 'plata' ? 2 : 3,
      id_edicion_categoria: idEdicionCategoria,
      partidos_ida_vuelta: false,
      permite_empate: false,
      permite_penales: true,
    };

    const result = await safeAsync(
      async () => {
        const response = await api.fases.create(requestData);
        return response;
      },
      'createFaseKnockout',
      {
        fallbackValue: null,
        onError: (error) => {
          showError('Error al crear la fase knockout');
        }
      }
    );

    if (result && result.success) {
      showSuccess(`Fase de ${getCopaLabel(copa)} creada exitosamente`);
      // Actualizar el estado
      setFasesStatus(prev => prev.map(f =>
        f.copa === copa ? { ...f, existe: true, fase: result.data } : f
      ));
    }

    setCreatingFase(false);
  };

  const loadClasificados = async (copa: TipoCopa) => {
    if (!idFaseGrupos) {
      showError('No se encontró la fase de grupos');
      return;
    }

    setLoading(true);

    const result = await safeAsync(
      async () => {
        const response = await api.fases.obtenerClasificados(idFaseGrupos, copa);
        return response;
      },
      'obtenerClasificados',
      {
        fallbackValue: null,
        onError: () => showError('Error al cargar los equipos clasificados')
      }
    );

    if (result && result.success) {
      // Obtener los equipos de la copa seleccionada
      const equiposCopa: EquipoClasificado[] =
        copa === 'oro' ? result.data.oro :
        copa === 'plata' ? result.data.plata :
        result.data.bronce;
      setClasificados(equiposCopa);
    }

    setLoading(false);
  };

  const toggleEquipo = (idEquipo: number) => {
    setEquiposSeleccionados(prev => {
      if (prev.includes(idEquipo)) {
        return prev.filter(id => id !== idEquipo);
      } else {
        return [...prev, idEquipo];
      }
    });
  };

  const handleGenerarEliminatorias = async () => {
    if (!selectedCopa) return;

    const cantidadEquipos = equiposSeleccionados.length;

    // Validar cantidad de equipos (debe ser potencia de 2: 2, 4, 8, 16)
    if (![2, 4, 8, 16].includes(cantidadEquipos)) {
      showError('Debe seleccionar 2, 4, 8 o 16 equipos para generar eliminatorias');
      return;
    }

    setGenerando(true);
    setCurrentStep('generando');

    const copaStatus = fasesStatus.find(f => f.copa === selectedCopa);
    if (!copaStatus?.fase) {
      showError('No se encontró la fase knockout');
      setGenerando(false);
      return;
    }

    // Crear llaves y partidos manualmente
    try {
      // Determinar la ronda según cantidad de equipos
      let ronda: any;
      if (cantidadEquipos === 2) ronda = 'final';
      else if (cantidadEquipos === 4) ronda = 'semifinal';
      else if (cantidadEquipos === 8) ronda = 'cuartos';
      else if (cantidadEquipos === 16) ronda = 'octavos';

      let llavesCreadas = 0;
      let partidosCreados = 0;

      // Crear llaves - emparejar equipos
      const parejas = [];
      for (let i = 0; i < cantidadEquipos; i += 2) {
        parejas.push({
          equipoA: equiposSeleccionados[i],
          equipoB: equiposSeleccionados[i + 1]
        });
      }

      // Crear cada llave con su partido
      for (let i = 0; i < parejas.length; i++) {
        const pareja = parejas[i];

        // Crear llave
        const llaveResult = await safeAsync(
          async () => {
            const response = await api.eliminatorias.createLlave({
              id_fase: copaStatus.fase!.id_fase,
              ronda: ronda,
              numero_llave: i + 1,
              id_equipo_a: pareja.equipoA,
              id_equipo_b: pareja.equipoB,
            });
            return response;
          },
          'createLlave',
          {
            fallbackValue: null,
            onError: () => {}
          }
        );

        if (llaveResult && llaveResult.success) {
          llavesCreadas++;

          // Crear partido para esta llave
          const hoy = new Date();
          hoy.setDate(hoy.getDate() + (i * 3)); // 3 días entre partidos
          const fechaPartido = hoy.toISOString().split('T')[0];

          const partidoResult = await safeAsync(
            async () => {
              const response = await api.partidos.create({
                equipo_local_id: pareja.equipoA,
                equipo_visitante_id: pareja.equipoB,
                fecha: fechaPartido,
                local_id: 1, // TODO: Allow user to select local/venue
              });
              return response;
            },
            'createPartido',
            {
              fallbackValue: null,
              onError: () => {}
            }
          );

          if (partidoResult && partidoResult.success) {
            partidosCreados++;
          }
        }
      }

      showSuccess(`Eliminatorias generadas exitosamente para ${getCopaLabel(selectedCopa)}`);
      showInfo(`Se crearon ${llavesCreadas} llaves y ${partidosCreados} partidos`);

      // Volver a la pantalla anterior
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      showError('Error al generar eliminatorias');
    }

    setGenerando(false);
  };

  const renderSelectCopa = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Selecciona una Copa</Text>
        <Text style={styles.stepSubtitle}>
          Elige la copa para la cual deseas crear o configurar el knockout
        </Text>

        <View style={styles.copasContainer}>
          {fasesStatus.map((status) => {
            const gradientColors = getCopaGradient(status.copa);

            return (
              <TouchableOpacity
                key={status.copa}
                style={styles.copaCard}
                onPress={() => handleSelectCopa(status.copa)}
                disabled={creatingFase}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={gradientColors as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.copaCardGradient}
                >
                  <MaterialCommunityIcons
                    name={getCopaIcon(status.copa)}
                    size={48}
                    color={colors.white}
                  />
                  <Text style={styles.copaCardTitle}>{getCopaLabel(status.copa)}</Text>

                  <View style={styles.copaStatus}>
                    {status.existe ? (
                      <>
                        <MaterialCommunityIcons name="check-circle" size={16} color={colors.white} />
                        <Text style={styles.copaStatusText}>Fase creada</Text>
                      </>
                    ) : (
                      <>
                        <MaterialCommunityIcons name="plus-circle" size={16} color={colors.white} />
                        <Text style={styles.copaStatusText}>Crear fase</Text>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSelectEquipos = () => {
    if (clasificados.length === 0) {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando equipos clasificados...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setCurrentStep('select-copa');
              setSelectedCopa(null);
              setClasificados([]);
              setEquiposSeleccionados([]);
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>Seleccionar Equipos</Text>
            <Text style={styles.stepSubtitle}>
              {getCopaLabel(selectedCopa!)} - {equiposSeleccionados.length} equipos seleccionados
            </Text>
          </View>
        </View>

        <Card style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              Selecciona los equipos que avanzarán al knockout. Debes elegir 2, 4, 8 o 16 equipos.
            </Text>
          </View>
        </Card>

        <View style={styles.equiposList}>
          {clasificados.map((equipo, index) => {
            const isSelected = equiposSeleccionados.includes(equipo.id_equipo);

            return (
              <TouchableOpacity
                key={equipo.id_equipo}
                style={[styles.equipoItem, isSelected && styles.equipoItemSelected]}
                onPress={() => toggleEquipo(equipo.id_equipo)}
                activeOpacity={0.7}
              >
                <View style={styles.equipoInfo}>
                  <View style={styles.equipoPosicion}>
                    <Text style={styles.equipoPosicionText}>{index + 1}</Text>
                  </View>
                  <View style={styles.equipoDetails}>
                    <Text style={styles.equipoNombre}>{equipo.nombre}</Text>
                    <Text style={styles.equipoGrupo}>
                      Grupo {equipo.grupo} • {equipo.puntos} pts
                    </Text>
                  </View>
                </View>

                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={18} color={colors.white} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title={`Generar Eliminatorias (${equiposSeleccionados.length} equipos)`}
          onPress={handleGenerarEliminatorias}
          disabled={![2, 4, 8, 16].includes(equiposSeleccionados.length)}
          style={styles.generateButton}
        />
      </View>
    );
  };

  const renderGenerando = () => {
    return (
      <View style={styles.generandoContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.generandoTitle}>Generando Eliminatorias...</Text>
        <Text style={styles.generandoText}>
          Creando llaves y partidos para {getCopaLabel(selectedCopa!)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          disabled={generando}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurar Knockout</Text>
        <View style={styles.headerBackButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 'select-copa' && renderSelectCopa()}
        {currentStep === 'select-equipos' && renderSelectEquipos()}
        {currentStep === 'generando' && renderGenerando()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHeaderText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  copasContainer: {
    marginTop: 24,
    gap: 16,
  },
  copaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  copaCardGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  copaCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  copaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  copaStatusText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  equiposList: {
    gap: 12,
    marginBottom: 16,
  },
  equipoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  equipoItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  equipoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  equipoPosicion: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipoPosicionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  equipoDetails: {
    flex: 1,
  },
  equipoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  equipoGrupo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  generateButton: {
    marginTop: 8,
  },
  generandoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  generandoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  generandoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
