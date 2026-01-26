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
import { Button, Card, GradientHeader } from '../../components/common';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { TimePickerInput } from '../../components/common/TimePickerInput';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { Local, Cancha } from '../../api/types';
import { safeAsync } from '../../utils';
import { TipoCopa } from '../../api/types';

interface CreateAutomaticKnockoutRoundScreenProps {
  navigation: any;
  route: {
    params: {
      idEdicionCategoria: number;
      idFase: number;
      copa: TipoCopa;
      encuentros: any[];
      rondaCreada: any;
    };
  };
}

export const CreateAutomaticKnockoutRoundScreen: React.FC<CreateAutomaticKnockoutRoundScreenProps> = ({
  navigation,
  route,
}) => {
  const { idEdicionCategoria, idFase, copa, encuentros, rondaCreada } = route.params;
  const { showSuccess, showError, showInfo } = useToast();

  // Estados
  const [allCanchas, setAllCanchas] = useState<Cancha[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [emparejamientos, setEmparejamientos] = useState(encuentros);
  const [partidosData, setPartidosData] = useState<{
    [key: string]: { id_cancha: number | null; fecha: string; hora: string };
  }>({});

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

        return { locales: allLocales, canchas: allCanchasData };
      },
      'loadInitialData',
      {
        fallbackValue: { locales: [], canchas: [] },
        onError: () => showError('Error al cargar datos'),
      }
    );

    setLocales(result?.locales || []);
    setAllCanchas(result?.canchas || []);
    setLoading(false);
  };

  const handlePartidoChange = (
    numeroPartido: number,
    field: 'id_cancha' | 'fecha' | 'hora',
    value: any
  ) => {
    setPartidosData((prev) => ({
      ...prev,
      [numeroPartido]: {
        ...(prev[numeroPartido] || { id_cancha: null, fecha: '', hora: '' }),
        [field]: value,
      },
    }));
  };

  const handleSwapEquipos = (index: number) => {
    setEmparejamientos((prev: any[]) => {
      const newEmparejamientos = [...prev];
      const temp = newEmparejamientos[index].equipo_local;
      newEmparejamientos[index].equipo_local = newEmparejamientos[index].equipo_visitante;
      newEmparejamientos[index].equipo_visitante = temp;

      // También intercambiar los IDs
      const tempId = newEmparejamientos[index].id_equipo_local;
      newEmparejamientos[index].id_equipo_local = newEmparejamientos[index].id_equipo_visitante;
      newEmparejamientos[index].id_equipo_visitante = tempId;

      return newEmparejamientos;
    });
  };

  const validarPartidos = (): boolean => {
    for (const encuentro of emparejamientos) {
      const key = `${encuentro.numero_partido}`;
      const data = partidosData[key];

      if (!data || !data.id_cancha) {
        showError('Debes seleccionar una cancha para todos los partidos');
        return false;
      }

      if (!data.fecha || !data.hora) {
        showError('Debes completar fecha y hora para todos los partidos');
        return false;
      }

      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.fecha)) {
        showError('El formato de la fecha debe ser YYYY-MM-DD');
        return false;
      }

      // Validar formato de hora
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(data.hora)) {
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

    Alert.alert(
      'Confirmar Creación',
      `¿Deseas crear ${emparejamientos.length} partidos para la ronda "${rondaCreada.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async () => {
            setCreating(true);

            // Preparar los partidos con la información completa
            const partidos = emparejamientos.map((encuentro: any) => {
              const numeroPartido = encuentro.numero_partido;
              const data = partidosData[numeroPartido];

              return {
                id_equipo_local: encuentro.equipo_local.id_equipo,
                id_equipo_visitante: encuentro.equipo_visitante.id_equipo,
                id_ronda: rondaCreada.id_ronda,
                id_fase: idFase,
                tipo_partido: 'eliminatoria' as const,
                afecta_clasificacion: false,
                id_cancha: data.id_cancha!,
                fecha: data.fecha,
                hora: data.hora,
              };
            });

            // Crear los partidos usando createBatch
            const result = await safeAsync(
              async () => {
                const response = await api.partidos.createBatch(partidos);
                return response;
              },
              'crearPartidosAutomaticos',
              {
                fallbackValue: null,
                onError: (error) => {
                  console.error('❌ Error creando partidos:', error);
                  showError('Error al crear los partidos');
                },
              }
            );

            setCreating(false);

            if (result && result.success) {
              showSuccess('Partidos creados exitosamente');

              // Navegar de regreso a KnockoutRondas
              setTimeout(() => {
                navigation.navigate('KnockoutRondas', {
                  fase: { id_fase: idFase },
                  copa,
                  idEdicionCategoria,
                });
              }, 500);
            } else {
              showError('No se pudieron crear los partidos');
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
          title="Ronda Automática"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Ronda Automática"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="trophy" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Copa {copa.charAt(0).toUpperCase() + copa.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="soccer" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {encuentros.length} {encuentros.length === 1 ? 'partido' : 'partidos'}
            </Text>
          </View>
        </Card>

        {/* Lista de partidos */}
        {emparejamientos.map((encuentro: any, index: number) => {
          const numeroPartido = encuentro.numero_partido;
          const data = partidosData[numeroPartido] || { id_cancha: null, fecha: '', hora: '' };

          return (
            <Card key={numeroPartido} style={styles.partidoCard}>
              <View style={styles.partidoHeader}>
                <Text style={styles.partidoTitle}>Partido {numeroPartido}</Text>
                <TouchableOpacity
                  style={styles.swapButton}
                  onPress={() => handleSwapEquipos(index)}
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.primary} />
                  <Text style={styles.swapButtonText}>Intercambiar</Text>
                </TouchableOpacity>
              </View>

              {/* Equipos */}
              <View style={styles.equiposContainer}>
                <View style={styles.equipoBox}>
                  <Text style={styles.equipoLabel}>Local</Text>
                  <Text style={styles.equipoNombre}>{encuentro.equipo_local?.nombre || 'Equipo Local'}</Text>
                </View>

                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.equipoBox}>
                  <Text style={styles.equipoLabel}>Visitante</Text>
                  <Text style={styles.equipoNombre}>{encuentro.equipo_visitante?.nombre || 'Equipo Visitante'}</Text>
                </View>
              </View>

              {/* Selección de cancha */}
              <View style={styles.inputSection}>
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
                          data.id_cancha === cancha.id_cancha && styles.canchaChipSelected,
                        ]}
                        onPress={() =>
                          handlePartidoChange(numeroPartido, 'id_cancha', cancha.id_cancha)
                        }
                      >
                        <MaterialCommunityIcons
                          name="soccer-field"
                          size={16}
                          color={
                            data.id_cancha === cancha.id_cancha ? colors.white : colors.primary
                          }
                        />
                        <Text
                          style={[
                            styles.canchaChipText,
                            data.id_cancha === cancha.id_cancha &&
                              styles.canchaChipTextSelected,
                          ]}
                        >
                          {cancha.nombre}
                        </Text>
                        {local && (
                          <Text
                            style={[
                              styles.canchaLocalText,
                              data.id_cancha === cancha.id_cancha &&
                                styles.canchaLocalTextSelected,
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
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <DatePickerInput
                    label="Fecha *"
                    value={data.fecha}
                    onChangeDate={(date) => handlePartidoChange(numeroPartido, 'fecha', date)}
                    placeholder="Seleccionar fecha"
                    defaultToToday={true}
                  />
                </View>

                <View style={styles.halfWidth}>
                  <TimePickerInput
                    label="Hora *"
                    value={data.hora}
                    onChangeTime={(time) => handlePartidoChange(numeroPartido, 'hora', time)}
                    placeholder="Seleccionar hora"
                  />
                </View>
              </View>
            </Card>
          );
        })}

        <View style={styles.actionsContainer}>
          <Button
            title={creating ? 'Creando partidos...' : 'Crear partidos'}
            onPress={handleCrearPartidos}
            disabled={creating}
            loading={creating}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  partidoCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.backgroundGray,
  },
  swapButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  equiposContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  equipoBox: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
  },
  equipoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  equipoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  canchaScrollView: {
    flexDirection: 'row',
  },
  canchaChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minWidth: 120,
  },
  canchaChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  canchaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  canchaChipTextSelected: {
    color: colors.white,
  },
  canchaLocalText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  canchaLocalTextSelected: {
    color: colors.white,
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  actionsContainer: {
    padding: 16,
  },
});
