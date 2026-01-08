import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { Button, Card } from '../../components/common';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { TimePickerInput } from '../../components/common/TimePickerInput';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import api from '../../api';
import type { TipoCopa, TipoFase, Fase } from '../../api/types/fases.types';
import type { EquipoClasificado } from '../../api/types/fases.types';
import type { Local, Cancha } from '../../api/types/locales.types';

interface CreateKnockoutFlowScreenProps {
  navigation: any;
  route: any;
}

type Step = 'select-copa' | 'select-equipos';

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
  const [equipoA, setEquipoA] = useState<number | null>(null);
  const [equipoB, setEquipoB] = useState<number | null>(null);
  const [llavesCreadas, setLlavesCreadas] = useState<number>(0);
  const [creatingFase, setCreatingFase] = useState(false);
  const [creatingLlave, setCreatingLlave] = useState(false);

  // Estado para modal de creación de partido
  const [showPartidoModal, setShowPartidoModal] = useState(false);
  const [idEliminatoriaCreada, setIdEliminatoriaCreada] = useState<number | null>(null);
  const [locales, setLocales] = useState<Local[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<number | null>(null);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [selectedCancha, setSelectedCancha] = useState<number | null>(null);
  const [fechaPartido, setFechaPartido] = useState<string>('');
  const [horaPartido, setHoraPartido] = useState<string>('20:00');
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [loadingCanchas, setLoadingCanchas] = useState(false);
  const [creatingPartido, setCreatingPartido] = useState(false);

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
        console.log('Cargando clasificados para copa:', copa, idFaseGrupos);
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

  const handleSelectEquipo = (idEquipo: number) => {
    if (!equipoA) {
      // Seleccionar equipo A (local)
      setEquipoA(idEquipo);
    } else if (!equipoB && idEquipo !== equipoA) {
      // Seleccionar equipo B (visitante) - debe ser diferente de A
      setEquipoB(idEquipo);
    } else if (idEquipo === equipoA) {
      // Deseleccionar equipo A
      setEquipoA(null);
    } else if (idEquipo === equipoB) {
      // Deseleccionar equipo B
      setEquipoB(null);
    }
  };

  const handleCrearLlave = async () => {
    if (!equipoA || !equipoB || !selectedCopa) return;

    const copaStatus = fasesStatus.find(f => f.copa === selectedCopa);
    if (!copaStatus?.fase) {
      showError('No se encontró la fase knockout');
      return;
    }

    setCreatingLlave(true);

    try {
      // Determinar la ronda según equipos restantes
      const equiposRestantes = clasificados.length;
      let ronda: any;
      if (equiposRestantes <= 2) ronda = 'final';
      else if (equiposRestantes <= 4) ronda = 'semifinal';
      else if (equiposRestantes <= 8) ronda = 'cuartos';
      else ronda = 'octavos';

      // Crear llave
      const llaveResult = await safeAsync(
        async () => {
          const response = await api.eliminatorias.createLlave({
            id_fase: copaStatus.fase!.id_fase,
            ronda: ronda,
            numero_llave: llavesCreadas + 1,
            id_equipo_a: equipoA,
            id_equipo_b: equipoB,
          });
          return response;
        },
        'createLlave',
        { fallbackValue: null, onError: () => showError('Error al crear llave') }
      );

      if (llaveResult && llaveResult.success) {
        showSuccess(`Llave ${llavesCreadas + 1} creada`);
        setLlavesCreadas(prev => prev + 1);

        // Guardar ID de eliminatoria y abrir modal para crear partido
        setIdEliminatoriaCreada(llaveResult.data.id_eliminatoria);

        // Inicializar fecha por defecto
        const hoy = new Date();
        hoy.setDate(hoy.getDate() + (llavesCreadas * 3));
        setFechaPartido(hoy.toISOString().split('T')[0]);

        // Cargar locales y abrir modal
        await loadLocales();
        setShowPartidoModal(true);
      }
    } catch (error) {
      showError('Error al crear llave');
    }

    setCreatingLlave(false);
  };

  const loadLocales = async () => {
    setLoadingLocales(true);
    const result = await safeAsync(
      async () => {
        const response = await api.locales.list(idEdicionCategoria);
        return response;
      },
      'loadLocales',
      { fallbackValue: null, onError: () => showError('Error al cargar locales') }
    );

    if (result && result.success && result.data?.locales) {
      setLocales(result.data.locales);
    }
    setLoadingLocales(false);
  };

  const handleSelectLocal = async (idLocal: number) => {
    setSelectedLocal(idLocal);
    setSelectedCancha(null);
    setCanchas([]);

    setLoadingCanchas(true);
    const result = await safeAsync(
      async () => {
        const response = await api.canchas.list(idLocal);
        return response;
      },
      'loadCanchas',
      { fallbackValue: null, onError: () => showError('Error al cargar canchas') }
    );

    if (result && result.success && result.data?.canchas) {
      setCanchas(result.data.canchas);
    }
    setLoadingCanchas(false);
  };

  const handleCrearPartido = async () => {
    if (!idEliminatoriaCreada || !selectedCancha || !fechaPartido || !horaPartido) {
      showError('Complete todos los campos');
      return;
    }

    setCreatingPartido(true);

    const result = await safeAsync(
      async () => {
        const response = await api.partidos.createEliminatoria({
          id_eliminatoria: idEliminatoriaCreada,
          fecha: fechaPartido,
          hora: horaPartido,
          id_cancha: selectedCancha,
          observaciones: `${getCopaLabel(selectedCopa!)} - Llave ${llavesCreadas}`,
        });
        return response;
      },
      'createPartido',
      { fallbackValue: null, onError: () => showError('Error al crear partido') }
    );

    if (result && result.success) {
      showSuccess('Partido creado exitosamente');

      // Cerrar modal y limpiar estado
      setShowPartidoModal(false);
      setIdEliminatoriaCreada(null);
      setSelectedLocal(null);
      setSelectedCancha(null);
      setCanchas([]);
      setLocales([]);

      // Eliminar equipos de la lista
      setClasificados(prev => prev.filter(e => e.id_equipo !== equipoA && e.id_equipo !== equipoB));
      setEquipoA(null);
      setEquipoB(null);
    }

    setCreatingPartido(false);
  };

  const handleCerrarModal = () => {
    setShowPartidoModal(false);
    setIdEliminatoriaCreada(null);
    setSelectedLocal(null);
    setSelectedCancha(null);
    setCanchas([]);
    setLocales([]);
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
    // Mostrar loading mientras se cargan los clasificados
    if (loading && clasificados.length === 0) {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando equipos clasificados...</Text>
          </View>
        </View>
      );
    }

    // Mostrar mensaje de éxito cuando se terminan de crear todas las llaves
    if (clasificados.length === 0 && llavesCreadas > 0) {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.successContainer}>
            <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
            <Text style={styles.successTitle}>¡Llaves creadas exitosamente!</Text>
            <Text style={styles.successText}>
              Se crearon {llavesCreadas} llaves para {getCopaLabel(selectedCopa!)}
            </Text>
            <Button
              title="Finalizar"
              onPress={() => navigation.goBack()}
              style={styles.generateButton}
            />
          </View>
        </View>
      );
    }

    // Mostrar mensaje si no hay equipos clasificados
    if (clasificados.length === 0) {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.successContainer}>
            <MaterialCommunityIcons name="alert-circle" size={64} color={colors.textSecondary} />
            <Text style={styles.successTitle}>No hay equipos clasificados</Text>
            <Text style={styles.successText}>
              No se encontraron equipos clasificados para {getCopaLabel(selectedCopa!)}
            </Text>
            <Button
              title="Volver"
              onPress={() => {
                setCurrentStep('select-copa');
                setSelectedCopa(null);
              }}
              style={styles.generateButton}
            />
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
              setEquipoA(null);
              setEquipoB(null);
              setLlavesCreadas(0);
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>Crear Llaves</Text>
            <Text style={styles.stepSubtitle}>
              {getCopaLabel(selectedCopa!)} - {llavesCreadas} llaves creadas • {clasificados.length} equipos restantes
            </Text>
          </View>
        </View>

        <Card style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              {!equipoA && 'Selecciona el Equipo Local (A)'}
              {equipoA && !equipoB && 'Selecciona el Equipo Visitante (B)'}
              {equipoA && equipoB && 'Confirma la llave creando el partido'}
            </Text>
          </View>
        </Card>

        {/* Mostrar equipos seleccionados */}
        {(equipoA || equipoB) && (
          <View style={styles.selectedTeamsContainer}>
            <View style={styles.selectedTeam}>
              <Text style={styles.selectedTeamLabel}>Equipo A (Local)</Text>
              <Text style={styles.selectedTeamName}>
                {equipoA ? clasificados.find(e => e.id_equipo === equipoA)?.nombre : '- Sin seleccionar -'}
              </Text>
            </View>
            <Text style={styles.vsText}>vs</Text>
            <View style={styles.selectedTeam}>
              <Text style={styles.selectedTeamLabel}>Equipo B (Visitante)</Text>
              <Text style={styles.selectedTeamName}>
                {equipoB ? clasificados.find(e => e.id_equipo === equipoB)?.nombre : '- Sin seleccionar -'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.equiposList}>
          {clasificados.map((equipo, index) => {
            const isEquipoA = equipo.id_equipo === equipoA;
            const isEquipoB = equipo.id_equipo === equipoB;
            const isSelected = isEquipoA || isEquipoB;

            return (
              <TouchableOpacity
                key={equipo.id_equipo}
                style={[
                  styles.equipoItem,
                  isEquipoA && styles.equipoItemEquipoA,
                  isEquipoB && styles.equipoItemEquipoB,
                ]}
                onPress={() => handleSelectEquipo(equipo.id_equipo)}
                activeOpacity={0.7}
                disabled={creatingLlave}
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

                {isSelected && (
                  <View style={styles.equipoBadge}>
                    <Text style={styles.equipoBadgeText}>
                      {isEquipoA ? 'A' : 'B'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {equipoA && equipoB && (
          <Button
            title={creatingLlave ? 'Creando llave...' : 'Crear Llave'}
            onPress={handleCrearLlave}
            disabled={creatingLlave}
            style={styles.generateButton}
          />
        )}
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
          disabled={creatingLlave}
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
      </ScrollView>

      {/* Modal para crear partido */}
      <Modal
        visible={showPartidoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCerrarModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCerrarModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Crear Partido</Text>
                <TouchableOpacity onPress={handleCerrarModal}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Contenido del modal */}
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>
                  Llave {llavesCreadas}: {clasificados.find(e => e.id_equipo === equipoA)?.nombre} vs{' '}
                  {clasificados.find(e => e.id_equipo === equipoB)?.nombre}
                </Text>

                {/* Seleccionar Local */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Local *</Text>
                  {loadingLocales ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={styles.optionsList}>
                      {locales.map((local) => (
                        <TouchableOpacity
                          key={local.id_local}
                          style={[
                            styles.optionItem,
                            selectedLocal === local.id_local && styles.optionItemSelected,
                          ]}
                          onPress={() => handleSelectLocal(local.id_local)}
                        >
                          <View style={styles.optionInfo}>
                            <Text style={styles.optionName}>{local.nombre}</Text>
                            <Text style={styles.optionDetail}>{local.direccion}</Text>
                          </View>
                          {selectedLocal === local.id_local && (
                            <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Seleccionar Cancha */}
                {selectedLocal && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Cancha *</Text>
                    {loadingCanchas ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : canchas.length === 0 ? (
                      <Text style={styles.emptyText}>No hay canchas disponibles en este local</Text>
                    ) : (
                      <View style={styles.optionsList}>
                        {canchas.map((cancha) => (
                          <TouchableOpacity
                            key={cancha.id_cancha}
                            style={[
                              styles.optionItem,
                              selectedCancha === cancha.id_cancha && styles.optionItemSelected,
                            ]}
                            onPress={() => setSelectedCancha(cancha.id_cancha)}
                          >
                            <View style={styles.optionInfo}>
                              <Text style={styles.optionName}>{cancha.nombre}</Text>
                              <Text style={styles.optionDetail}>
                                {cancha.tipo_superficie.replace('_', ' ')}
                              </Text>
                            </View>
                            {selectedCancha === cancha.id_cancha && (
                              <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Fecha y Hora */}
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeItem}>
                    <DatePickerInput
                      label="Fecha *"
                      value={fechaPartido}
                      onChangeDate={setFechaPartido}
                      minimumDate={new Date()}
                    />
                  </View>
                  <View style={styles.dateTimeItem}>
                    <TimePickerInput
                      label="Hora *"
                      value={horaPartido}
                      onChangeTime={setHoraPartido}
                    />
                  </View>
                </View>

                {/* Botones */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCerrarModal}
                    disabled={creatingPartido}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (!selectedCancha || !fechaPartido || !horaPartido || creatingPartido) &&
                        styles.confirmButtonDisabled,
                    ]}
                    onPress={handleCrearPartido}
                    disabled={!selectedCancha || !fechaPartido || !horaPartido || creatingPartido}
                  >
                    <Text style={styles.confirmButtonText}>
                      {creatingPartido ? 'Creando...' : 'Crear Partido'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  selectedTeamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  selectedTeam: {
    flex: 1,
    alignItems: 'center',
  },
  selectedTeamLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  selectedTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  equipoItemEquipoA: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  equipoItemEquipoB: {
    borderColor: colors.success,
    backgroundColor: '#e8f5e9',
  },
  equipoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipoBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  successContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateTimeItem: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
