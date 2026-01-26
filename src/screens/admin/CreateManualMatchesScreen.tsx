import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button, Card, GradientHeader } from '../../components/common';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { TimePickerInput } from '../../components/common/TimePickerInput';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { Local, Cancha } from '../../api/types';
import { safeAsync } from '../../utils';

type PartidoManual = {
  id_temp: string;
  equipo_local: any;
  equipo_visitante: any;
  id_cancha: number | null;
  fecha: string;
  hora: string;
};

export const CreateManualMatchesScreen = ({ navigation, route }: any) => {
  const { idEdicionCategoria, idFase, idRonda, copa, ronda, equipos } = route.params;
  const { showSuccess, showError, showInfo } = useToast();

  // Estados
  const [equiposOrdenados, setEquiposOrdenados] = useState<any[]>([]);
  const [allCanchas, setAllCanchas] = useState<Cancha[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [partidosData, setPartidosData] = useState<{
    [key: string]: { id_cancha: number | null; fecha: string; hora: string };
  }>({});
  const [partidosExistentes, setPartidosExistentes] = useState<any[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);

    const result = await safeAsync(
      async () => {
        // Cargar locales
        const localesResponse = await api.locales.list(idEdicionCategoria);
        const allLocales = localesResponse.success && localesResponse.data?.locales
          ? localesResponse.data.locales
          : [];

        // Cargar todas las canchas de todos los locales
        const canchasPromises = allLocales.map(async (local: Local) => {
          const canchasResponse = await api.canchas.list(local.id_local);
          return canchasResponse.success && canchasResponse.data?.canchas
            ? canchasResponse.data.canchas
            : [];
        });

        const canchasArrays = await Promise.all(canchasPromises);
        const allCanchasData = canchasArrays.flat();

        // Intentar cargar partidos existentes de la ronda
        let partidosExistentes: any[] = [];
        try {
          const partidosResponse = await api.partidos.listKnockout(idEdicionCategoria, copa);
          if (partidosResponse.success && partidosResponse.data?.partidos_por_etapa) {
            // Obtener todos los partidos y filtrar por id_ronda
            const todasEtapas = Object.values(partidosResponse.data.partidos_por_etapa).flat();
            partidosExistentes = todasEtapas.filter((p: any) => p.id_ronda === idRonda);
            console.log(`📥 [CreateManualMatches] Partidos existentes encontrados: ${partidosExistentes.length}`);
          }
        } catch (error) {
          console.log('⚠️ [CreateManualMatches] No se pudieron cargar partidos existentes:', error);
        }

        return { locales: allLocales, canchas: allCanchasData, partidosExistentes };
      },
      'loadInitialData',
      {
        fallbackValue: { locales: [], canchas: [], partidosExistentes: [] },
        onError: () => showError('Error al cargar datos'),
      }
    );

    setLocales(result?.locales || []);
    setAllCanchas(result?.canchas || []);

    // Si hay partidos existentes, cargarlos
    if (result?.partidosExistentes && result.partidosExistentes.length > 0) {
      console.log('♻️ [CreateManualMatches] Cargando partidos existentes...');
      const partidos = result.partidosExistentes;
      setPartidosExistentes(partidos);

      // Extraer equipos de los partidos en orden
      const equiposOrden: any[] = [];
      const partidosMap: { [key: string]: { id_cancha: number | null; fecha: string; hora: string } } = {};

      partidos.forEach((partido: any) => {
        equiposOrden.push(partido.equipo_local);
        equiposOrden.push(partido.equipo_visitante);

        const partidoKey = `${partido.equipo_local.id_equipo}-${partido.equipo_visitante.id_equipo}`;
        partidosMap[partidoKey] = {
          id_cancha: partido.id_cancha || null,
          fecha: partido.fecha || '',
          hora: partido.hora || '',
        };
      });

      setEquiposOrdenados(equiposOrden);
      setPartidosData(partidosMap);
    } else {
      // No hay partidos existentes, usar equipos de los params
      setEquiposOrdenados(equipos);
      setPartidosExistentes([]);
    }

    setLoading(false);
  };

  // Función para mover equipo hacia arriba
  const moveEquipoUp = (index: number) => {
    if (index === 0) return;
    const newEquipos = [...equiposOrdenados];
    [newEquipos[index - 1], newEquipos[index]] = [newEquipos[index], newEquipos[index - 1]];
    setEquiposOrdenados(newEquipos);
  };

  // Función para mover equipo hacia abajo
  const moveEquipoDown = (index: number) => {
    if (index === equiposOrdenados.length - 1) return;
    const newEquipos = [...equiposOrdenados];
    [newEquipos[index], newEquipos[index + 1]] = [newEquipos[index + 1], newEquipos[index]];
    setEquiposOrdenados(newEquipos);
  };

  // Generar partidos basados en el orden actual de equipos
  const getPartidosFromOrden = (): PartidoManual[] => {
    const partidos: PartidoManual[] = [];
    for (let i = 0; i < equiposOrdenados.length; i += 2) {
      if (i + 1 < equiposOrdenados.length) {
        const partidoKey = `${equiposOrdenados[i].id_equipo}-${equiposOrdenados[i + 1].id_equipo}`;
        const data = partidosData[partidoKey] || { id_cancha: null, fecha: '', hora: '' };

        partidos.push({
          id_temp: partidoKey,
          equipo_local: equiposOrdenados[i],
          equipo_visitante: equiposOrdenados[i + 1],
          id_cancha: data.id_cancha,
          fecha: data.fecha,
          hora: data.hora,
        });
      }
    }
    return partidos;
  };

  // Función para intercambiar local y visitante
  const swapEquipos = (index: number) => {
    if (index * 2 + 1 >= equiposOrdenados.length) return;
    const newEquipos = [...equiposOrdenados];
    const idx1 = index * 2;
    const idx2 = index * 2 + 1;
    [newEquipos[idx1], newEquipos[idx2]] = [newEquipos[idx2], newEquipos[idx1]];
    setEquiposOrdenados(newEquipos);
  };

  const handlePartidoChange = (
    partidoKey: string,
    field: 'id_cancha' | 'fecha' | 'hora',
    value: any
  ) => {
    setPartidosData((prev) => ({
      ...prev,
      [partidoKey]: {
        ...(prev[partidoKey] || { id_cancha: null, fecha: '', hora: '' }),
        [field]: value,
      },
    }));
  };

  const validarPartidos = (): boolean => {
    const partidos = getPartidosFromOrden();
    for (const partido of partidos) {
      if (!partido.id_cancha) {
        showError('Debes seleccionar una cancha para todos los partidos');
        return false;
      }

      if (!partido.fecha || !partido.hora) {
        showError('Debes completar fecha y hora para todos los partidos');
        return false;
      }

      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(partido.fecha)) {
        showError('El formato de la fecha debe ser YYYY-MM-DD');
        return false;
      }

      // Validar formato de hora
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(partido.hora)) {
        showError('El formato de la hora debe ser HH:MM');
        return false;
      }
    }

    return true;
  };

  const handleCrearPartidos = async () => {
    if (!validarPartidos()) {
      return;
    }

    const partidos = getPartidosFromOrden();
    const hayPartidosExistentes = partidosExistentes.length > 0;

    Alert.alert(
      hayPartidosExistentes ? 'Confirmar Actualización' : 'Confirmar Creación',
      hayPartidosExistentes
        ? `¿Deseas actualizar los ${partidos.length} partidos de la ${ronda}? Los partidos existentes serán reemplazados.`
        : `¿Deseas crear ${partidos.length} partidos para la ${ronda}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: hayPartidosExistentes ? 'Actualizar' : 'Crear',
          onPress: async () => {
            setCreating(true);

            // Si hay partidos existentes, primero eliminarlos
            if (hayPartidosExistentes) {
              console.log('🗑️ [CreateManualMatches] Eliminando partidos existentes...');
              for (const partidoExistente of partidosExistentes) {
                await safeAsync(
                  async () => await api.partidos.delete(partidoExistente.id_partido),
                  'deletePartido',
                  {
                    fallbackValue: null,
                    onError: (error) => {
                      console.error('❌ Error eliminando partido:', partidoExistente.id_partido, error);
                    },
                  }
                );
              }
            }

            let createdCount = 0;
            let errorCount = 0;

            // Crear partidos uno por uno
            for (const partido of partidos) {
              const partidoData: any = {
                id_equipo_local: partido.equipo_local.id_equipo,
                id_equipo_visitante: partido.equipo_visitante.id_equipo,
                id_ronda: idRonda,
                id_fase: idFase,
                tipo_partido: 'eliminatoria' as const,
                afecta_clasificacion: false,
                id_cancha: partido.id_cancha!,
                fecha: partido.fecha,
                hora: partido.hora,
              };

              const result = await safeAsync(
                async () => {
                  const response = await api.partidos.create(partidoData);
                  return response;
                },
                'createPartido',
                {
                  fallbackValue: null,
                  onError: (error) => {
                    console.error('❌ Error creando partido:', error);
                    errorCount++;
                  },
                }
              );

              if (result && result.success) {
                createdCount++;
              }
            }

            setCreating(false);

            const accion = hayPartidosExistentes ? 'actualizados' : 'creados';

            if (createdCount === partidos.length) {
              showSuccess(`${createdCount} partidos ${accion} exitosamente`);

              // Navegar de regreso a KnockoutRondas
              setTimeout(() => {
                navigation.navigate('KnockoutRondas', {
                  fase: { id_fase: idFase },
                  copa,
                  idEdicionCategoria,
                });
              }, 500);
            } else if (createdCount > 0) {
              showInfo(`${createdCount} partidos ${accion}, ${errorCount} fallaron`);
            } else {
              showError(`No se pudo ${hayPartidosExistentes ? 'actualizar' : 'crear'} ningún partido`);
            }
          },
        },
      ]
    );
  };

  const getCanchaInfo = (idCancha: number | null): string => {
    if (!idCancha) return 'Seleccionar cancha';

    const cancha = allCanchas.find((c) => c.id_cancha === idCancha);
    if (!cancha) return 'Cancha no encontrada';

    const local = locales.find((l) => l.id_local === cancha.id_local);
    return `${cancha.nombre} - ${local?.nombre || ''}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <GradientHeader
          title="Cargando Partidos"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hayPartidosExistentes = partidosExistentes.length > 0;
  const tituloHeader = hayPartidosExistentes ? 'Editar Partidos' : 'Crear Partidos';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title={`${tituloHeader} - ${ronda}`}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="trophy" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Copa {copa.charAt(0).toUpperCase() + copa.slice(1)} - {ronda}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="soccer" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {Math.floor(equiposOrdenados.length / 2)}{' '}
              {Math.floor(equiposOrdenados.length / 2) === 1 ? 'partido' : 'partidos'}
            </Text>
          </View>
        </Card>

        {/* Sección de Reorganización de Equipos */}
        <Card style={styles.reorganizarCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="swap-vertical" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Reorganizar Equipos</Text>
          </View>
          <Text style={styles.helpText}>
            Usa las flechas para reorganizar el orden. Los partidos se emparejarán automáticamente.
          </Text>

          {equiposOrdenados.map((equipo, index) => {
            const partidoIndex = Math.floor(index / 2);
            const isLocal = index % 2 === 0;
            const showSeparator = index % 2 === 1 && index < equiposOrdenados.length - 1;

            return (
              <View key={equipo.id_equipo}>
                <View style={styles.equipoReorderItem}>
                  <View style={styles.equipoReorderInfo}>
                    <View style={styles.partidoIndicator}>
                      <Text style={styles.partidoIndicatorText}>
                        P{partidoIndex + 1} - {isLocal ? 'L' : 'V'}
                      </Text>
                    </View>
                    <Text style={styles.equipoReorderNombre}>{equipo.nombre}</Text>
                  </View>

                  <View style={styles.reorderButtons}>
                    <TouchableOpacity
                      onPress={() => moveEquipoUp(index)}
                      disabled={index === 0}
                      style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                    >
                      <MaterialCommunityIcons
                        name="chevron-up"
                        size={24}
                        color={index === 0 ? colors.textSecondary : colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveEquipoDown(index)}
                      disabled={index === equiposOrdenados.length - 1}
                      style={[
                        styles.reorderButton,
                        index === equiposOrdenados.length - 1 && styles.reorderButtonDisabled,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={24}
                        color={
                          index === equiposOrdenados.length - 1
                            ? colors.textSecondary
                            : colors.primary
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {showSeparator && <View style={styles.partidoSeparator} />}
              </View>
            );
          })}
        </Card>

        {/* Sección de Partidos Generados */}
        <View style={styles.partidosSectionHeader}>
          <MaterialCommunityIcons name="soccer" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Partidos Generados</Text>
        </View>

        {getPartidosFromOrden().map((partido, index) => (
          <Card key={partido.id_temp} style={styles.partidoCard}>
            <View style={styles.partidoHeader}>
              <Text style={styles.partidoTitle}>Partido {index + 1}</Text>
              <TouchableOpacity
                onPress={() => swapEquipos(index)}
                style={styles.swapButton}
              >
                <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.primary} />
                <Text style={styles.swapButtonText}>Intercambiar</Text>
              </TouchableOpacity>
            </View>

            {/* Equipos */}
            <View style={styles.equiposContainer}>
              <View style={styles.equipoBox}>
                <Text style={styles.equipoLabel}>Local</Text>
                <Text style={styles.equipoNombre}>{partido.equipo_local.nombre}</Text>
              </View>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.equipoBox}>
                <Text style={styles.equipoLabel}>Visitante</Text>
                <Text style={styles.equipoNombre}>{partido.equipo_visitante.nombre}</Text>
              </View>
            </View>

            {/* Cancha */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Cancha *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.canchaScrollView}
              >
                {allCanchas.map((cancha) => {
                  const local = locales.find((l) => l.id_local === cancha.id_local);
                  return (
                    <TouchableOpacity
                      key={cancha.id_cancha}
                      style={[
                        styles.canchaChip,
                        partido.id_cancha === cancha.id_cancha && styles.canchaChipSelected,
                      ]}
                      onPress={() =>
                        handlePartidoChange(partido.id_temp, 'id_cancha', cancha.id_cancha)
                      }
                    >
                      <MaterialCommunityIcons
                        name="soccer-field"
                        size={16}
                        color={
                          partido.id_cancha === cancha.id_cancha ? colors.white : colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.canchaChipText,
                          partido.id_cancha === cancha.id_cancha &&
                            styles.canchaChipTextSelected,
                        ]}
                      >
                        {cancha.nombre}
                      </Text>
                      {local && (
                        <Text
                          style={[
                            styles.canchaChipSubtext,
                            partido.id_cancha === cancha.id_cancha &&
                              styles.canchaChipSubtextSelected,
                          ]}
                        >
                          {local.nombre}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Fecha y Hora */}
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeField}>
                <DatePickerInput
                  label="Fecha *"
                  value={partido.fecha}
                  onChangeDate={(date) =>
                    handlePartidoChange(partido.id_temp, 'fecha', date)
                  }
                  placeholder="Seleccionar fecha"
                  defaultToToday={true}
                />
              </View>

              <View style={styles.dateTimeField}>
                <TimePickerInput
                  label="Hora *"
                  value={partido.hora}
                  onChangeTime={(time) =>
                    handlePartidoChange(partido.id_temp, 'hora', time)
                  }
                  placeholder="Seleccionar hora"
                />
              </View>
            </View>
          </Card>
        ))}

        <View style={styles.actionsContainer}>
          <Button
            title={
              creating
                ? hayPartidosExistentes
                  ? 'Actualizando partidos...'
                  : 'Creando partidos...'
                : hayPartidosExistentes
                ? 'Actualizar todos los partidos'
                : 'Crear todos los partidos'
            }
            onPress={handleCrearPartidos}
            disabled={creating}
            loading={creating}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoCard: {
    margin: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  partidoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  reorganizarCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  equipoReorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipoReorderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  partidoIndicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  partidoIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  equipoReorderNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  reorderButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: colors.backgroundGray,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  partidoSeparator: {
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: 8,
    marginHorizontal: 20,
  },
  partidosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  partidoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  partidoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  swapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  equiposContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
  },
  equipoBox: {
    flex: 1,
    alignItems: 'center',
  },
  equipoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  equipoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
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
  canchaScrollView: {
    marginTop: 8,
  },
  canchaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  canchaChipSubtext: {
    fontSize: 11,
    color: colors.primary,
    marginLeft: 4,
  },
  canchaChipSubtextSelected: {
    color: colors.white,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeField: {
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
