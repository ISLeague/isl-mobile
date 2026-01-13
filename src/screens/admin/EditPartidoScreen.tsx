import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { Button, DatePickerInput, TimePickerInput } from '../../components/common';
import { Partido, Local, Cancha } from '../../api/types';
import { safeAsync, getUserFriendlyMessage } from '../../utils/errorHandling';
import api from '../../api';

interface EditPartidoScreenProps {
  navigation: any;
  route: any;
}

export const EditPartidoScreen: React.FC<EditPartidoScreenProps> = ({ navigation, route }) => {
  const { partido } = route.params as { partido: Partido };
  const { showSuccess, showError, showWarning } = useToast();

  // Estados para datos de API
  const [locales, setLocales] = useState<Local[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Datos del partido cargados desde la API (solo lectura)
  const [equipoLocal, setEquipoLocal] = useState<any>(null);
  const [equipoVisitante, setEquipoVisitante] = useState<any>(null);

  // Campos editables
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [localId, setLocalId] = useState<number | null>(null);
  const [canchaId, setCanchaId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [showCanchaModal, setShowCanchaModal] = useState(false);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      const result = await safeAsync(
        async () => {
          const edicionCategoriaId = route.params?.idEdicionCategoria;

          // Cargar información completa del partido y locales
          const [partidoResponse, localesResponse] = await Promise.all([
            api.partidos.getResultado(partido.id_partido),
            api.locales.list(edicionCategoriaId)
          ]);

          const partidoData = partidoResponse.success && partidoResponse.data ? partidoResponse.data : null;
          const localesData = localesResponse.success && localesResponse.data?.locales ? localesResponse.data.locales : [];

          // Si hay una cancha, obtener sus detalles para el id_local
          let localIdFromCancha: number | null = null;
          if (partidoData?.cancha?.id_cancha) {
            const canchaResponse = await api.canchas.get(partidoData.cancha.id_cancha);
            if (canchaResponse.success && canchaResponse.data?.cancha?.id_local) {
              localIdFromCancha = canchaResponse.data.cancha.id_local;
            }
          }

          return { locales: localesData, partidoInfo: partidoData, localId: localIdFromCancha };
        },
        'EditPartidoScreen - loadData',
        { fallbackValue: { locales: [], partidoInfo: null, localId: null } }
      );

      if (result) {
        setLocales(result.locales);

        // Inicializar estados con la información del partido
        if (result.partidoInfo) {
          const { partido: partidoData, equipo_local, equipo_visitante, cancha } = result.partidoInfo;

          // Establecer fecha (formato YYYY-MM-DD)
          if (partidoData.fecha) {
            setFecha(partidoData.fecha);
          }

          // Establecer hora
          if (partidoData.hora) {
            setHora(partidoData.hora);
          }

          // Establecer equipos (solo lectura - para mostrar)
          if (equipo_local) {
            setEquipoLocal(equipo_local);
          }
          if (equipo_visitante) {
            setEquipoVisitante(equipo_visitante);
          }

          // Establecer cancha
          if (cancha?.id_cancha) {
            setCanchaId(cancha.id_cancha);
          }
        }

        // Establecer local si se obtuvo
        if (result.localId) {
          setLocalId(result.localId);
        }
      }
      setDataLoading(false);
    };

    loadData();
  }, [partido.id_partido]);

  // Load canchas when local changes
  useEffect(() => {
    if (localId) {
      const loadCanchas = async () => {
        const result = await safeAsync(
          async () => {
            const canchasResponse = await api.canchas.list(localId);
            return canchasResponse.success && canchasResponse.data?.canchas ? canchasResponse.data.canchas : [];
          },
          'EditPartidoScreen - loadCanchas',
          { fallbackValue: [] }
        );
        if (result) {
          setCanchas(result);
        }
      };
      loadCanchas();
    } else {
      setCanchas([]);
    }
  }, [localId]);

  // Canchas filtradas por local seleccionado
  const canchasDelLocal = localId
    ? canchas.filter(cancha => cancha.id_local === localId)
    : [];

  const getLocalNombre = (id: number | null) => {
    if (!id) return 'Sin local';
    return locales.find(l => l.id_local === id)?.nombre || 'Local no encontrado';
  };

  const getCanchaNombre = (id: number | null) => {
    if (!id) return 'Sin cancha';
    const cancha = canchas.find(c => c.id_cancha === id);
    if (!cancha) return 'Cancha no encontrada';
    const local = locales.find(l => l.id_local === cancha.id_local);
    return `${cancha.nombre} - ${local?.nombre || ''}`;
  };

  const handleSave = async () => {
    // Validaciones
    if (!fecha.trim()) {
      showWarning('La fecha es requerida', 'Campo requerido');
      return;
    }

    if (!hora.trim()) {
      showWarning('La hora es requerida', 'Campo requerido');
      return;
    }

    setLoading(true);

    const success = await safeAsync(
      async () => {
        // Preparar datos para actualizar (fecha ya está en formato YYYY-MM-DD)
        const updateData = {
          id: partido.id_partido,
          fecha: fecha,
          hora: hora,
          id_cancha: canchaId ?? undefined
        };

        console.log('Actualizando partido con datos:', updateData);

        const response = await api.partidos.update(updateData);

        if (!response.success) {
          throw new Error(response.message || 'Error al actualizar el partido');
        }

        return true;
      },
      'updatePartido',
      {
        severity: 'high',
        fallbackValue: false,
        onError: (error) => {
          showError(getUserFriendlyMessage(error), 'Error al actualizar');
        }
      }
    );

    setLoading(false);

    if (success) {
      showSuccess('Partido actualizado correctamente', '¡Éxito!');
      setTimeout(() => navigation.goBack(), 1000);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este partido? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await safeAsync(
              async () => {
                const response = await api.partidos.delete(partido.id_partido);
                return response?.success ?? true;
              },
              'deletePartido',
              {
                severity: 'high',
                fallbackValue: false,
                onError: (error) => {
                  showError(getUserFriendlyMessage(error), 'Error al eliminar');
                }
              }
            );

            if (success) {
              showSuccess('Partido eliminado correctamente', 'Eliminado');
              setTimeout(() => navigation.goBack(), 1000);
            }
          },
        },
      ]
    );
  };

  // Mostrar indicador de carga
  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar Partido</Text>
        </View>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Cargando información del partido...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Editar Partido</Text>
        </View>

        {/* Equipos (solo lectura) */}
        <View style={styles.equiposSection}>
          <View style={styles.equipoCard}>
            {equipoLocal ? (
              <>
                <Image source={equipoLocal.logo ? { uri: equipoLocal.logo } : require('../../assets/InterLOGO.png')} style={styles.equipoLogo} />
                <Text style={styles.equipoNombre}>{equipoLocal.nombre}</Text>
              </>
            ) : (
              <>
                <View style={styles.equipoPorDefinir}>
                  <MaterialCommunityIcons name="help-circle" size={48} color={colors.textLight} />
                </View>
                <Text style={styles.equipoPorDefinirText}>Por Definir</Text>
              </>
            )}
            <Text style={styles.equipoLabel}>Local</Text>
          </View>

          <MaterialCommunityIcons name="sword-cross" size={32} color={colors.textSecondary} />

          <View style={styles.equipoCard}>
            {equipoVisitante ? (
              <>
                <Image source={equipoVisitante.logo ? { uri: equipoVisitante.logo } : require('../../assets/InterLOGO.png')} style={styles.equipoLogo} />
                <Text style={styles.equipoNombre}>{equipoVisitante.nombre}</Text>
              </>
            ) : (
              <>
                <View style={styles.equipoPorDefinir}>
                  <MaterialCommunityIcons name="help-circle" size={48} color={colors.textLight} />
                </View>
                <Text style={styles.equipoPorDefinirText}>Por Definir</Text>
              </>
            )}
            <Text style={styles.equipoLabel}>Visitante</Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Fecha */}
          <DatePickerInput
            label="Fecha *"
            value={fecha}
            onChangeDate={setFecha}
            placeholder="Seleccionar fecha"
          />

          {/* Hora */}
          <TimePickerInput
            label="Hora *"
            value={hora}
            onChangeTime={setHora}
            placeholder="Seleccionar hora"
          />

          {/* Local */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Local</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowLocalModal(true)}
            >
              <MaterialCommunityIcons name="office-building" size={20} color={colors.textSecondary} />
              <Text style={styles.selectButtonText}>{getLocalNombre(localId)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Cancha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cancha</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowCanchaModal(true)}
            >
              <MaterialCommunityIcons name="soccer-field" size={20} color={colors.textSecondary} />
              <Text style={styles.selectButtonText}>{getCanchaNombre(canchaId)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {!localId && (
              <Text style={styles.helpText}>Primero selecciona un local</Text>
            )}
          </View>
        </View>

        {/* Botones */}
        <View style={styles.actions}>
          <Button
            title={loading ? 'Guardando...' : 'Guardar Cambios'}
            onPress={handleSave}
            disabled={loading}
          />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
          >
            <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
            <Text style={styles.deleteText}>Eliminar Partido</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal: Seleccionar Local */}
      <Modal
        visible={showLocalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocalModal(false)}
      >
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
      </Modal>

      {/* Modal: Seleccionar Cancha */}
      <Modal
        visible={showCanchaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCanchaModal(false)}
      >
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
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  equiposSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.backgroundGray,
    margin: 16,
    borderRadius: 12,
  },
  equipoCard: {
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  equipoPorDefinir: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  equipoPorDefinirText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    textAlign: 'center',
  },
  equipoLogo: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  equipoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  equipoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  form: {
    padding: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    padding: 16,
    gap: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  modalItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
});
