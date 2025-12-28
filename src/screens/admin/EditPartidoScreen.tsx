import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common';
import { Partido, Equipo, Local, Cancha } from '../../api/types';
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
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [equipoLocalId, setEquipoLocalId] = useState(partido.id_equipo_local);
  const [equipoVisitanteId, setEquipoVisitanteId] = useState(partido.id_equipo_visitante);
  const [fecha, setFecha] = useState(partido.fecha || '');
  const [hora, setHora] = useState(partido.hora || '');
  const [localId, setLocalId] = useState<number | null>(null);
  const [canchaId, setCanchaId] = useState<number | null>(partido.id_cancha || null);
  const [loading, setLoading] = useState(false);
  const [showEquipoLocalModal, setShowEquipoLocalModal] = useState(false);
  const [showEquipoVisitanteModal, setShowEquipoVisitanteModal] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [showCanchaModal, setShowCanchaModal] = useState(false);
  const [searchLocal, setSearchLocal] = useState('');
  const [searchVisitante, setSearchVisitante] = useState('');

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      const result = await safeAsync(
        async () => {
          // Get edicionCategoriaId from route params
          const edicionCategoriaId = route.params?.idEdicionCategoria;

          const [equiposResponse, localesResponse] = await Promise.all([
            edicionCategoriaId ? api.equipos.list(edicionCategoriaId) : Promise.resolve({ success: true, data: [] }),
            edicionCategoriaId ? api.locales.list(edicionCategoriaId) : Promise.resolve({ success: true, data: { locales: [] } }),
          ]);

          const equiposData = equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];
          const localesData = localesResponse.success && localesResponse.data?.locales ? localesResponse.data.locales : [];

          return { equipos: equiposData, locales: localesData };
        },
        'EditPartidoScreen - loadData',
        { fallbackValue: { equipos: [], locales: [] } }
      );

      if (result) {
        setEquipos(result.equipos);
        setLocales(result.locales);
      }
      setDataLoading(false);
    };

    loadData();
  }, [route.params?.idEdicionCategoria]);

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

  const equipoLocal = equipoLocalId ? equipos.find(e => e.id_equipo === equipoLocalId) : null;
  const equipoVisitante = equipoVisitanteId ? equipos.find(e => e.id_equipo === equipoVisitanteId) : null;

  // Equipos ordenados alfabéticamente
  const equiposOrdenados = [...equipos].sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Equipos para modal local (filtrados y con búsqueda)
  const equiposLocalesFiltrados = equiposOrdenados
    .filter(e => e.id_equipo !== equipoVisitanteId)
    .filter(e => e.nombre.toLowerCase().includes(searchLocal.toLowerCase()));

  // Equipos para modal visitante (filtrados y con búsqueda)
  const equiposVisitantesFiltrados = equiposOrdenados
    .filter(e => e.id_equipo !== equipoLocalId)
    .filter(e => e.nombre.toLowerCase().includes(searchVisitante.toLowerCase()));

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

    if (equipoLocalId === equipoVisitanteId) {
      showError('El equipo local y visitante no pueden ser el mismo', 'Equipos inválidos');
      return;
    }

    // Validar formato de fecha
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(fecha)) {
      showError('El formato de la fecha debe ser DD/MM/YYYY (ej: 25/12/2025)', 'Formato incorrecto');
      return;
    }

    // Validar formato de hora
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(hora)) {
      showError('El formato de la hora debe ser HH:MM (ej: 15:00)', 'Formato incorrecto');
      return;
    }

    setLoading(true);

    const success = await safeAsync(
      async () => {
        // TODO: Llamar a la API para actualizar el partido
        // await api.partidos.updatePartido(partido.id_partido, { fecha, hora });
        await new Promise(resolve => setTimeout(resolve, 500));
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
                // TODO: Llamar a la API para eliminar el partido
                // await api.partidos.deletePartido(partido.id_partido);
                await new Promise(resolve => setTimeout(resolve, 500));
                return true;
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

        {/* Equipos */}
        <View style={styles.equiposSection}>
          <TouchableOpacity 
            style={styles.equipoCard}
            onPress={() => setShowEquipoLocalModal(true)}
          >
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
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="pencil" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>

          <MaterialCommunityIcons name="sword-cross" size={32} color={colors.textSecondary} />

          <TouchableOpacity 
            style={styles.equipoCard}
            onPress={() => setShowEquipoVisitanteModal(true)}
          >
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
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="pencil" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Fecha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY (ej: 25/12/2025)"
                value={fecha}
                onChangeText={setFecha}
                placeholderTextColor={colors.textLight}
              />
            </View>
            <Text style={styles.helpText}>Formato: DD/MM/YYYY</Text>
          </View>

          {/* Hora */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hora *</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="clock" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="HH:MM (ej: 15:00)"
                value={hora}
                onChangeText={setHora}
                placeholderTextColor={colors.textLight}
              />
            </View>
            <Text style={styles.helpText}>Formato: HH:MM (24 horas)</Text>
          </View>

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

      {/* Modal: Seleccionar Equipo Local */}
      <Modal
        visible={showEquipoLocalModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEquipoLocalModal(false);
          setSearchLocal('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Equipo Local</Text>
              <TouchableOpacity onPress={() => {
                setShowEquipoLocalModal(false);
                setSearchLocal('');
              }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* Buscador */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar equipo..."
                value={searchLocal}
                onChangeText={setSearchLocal}
                placeholderTextColor={colors.textSecondary}
              />
              {searchLocal.length > 0 && (
                <TouchableOpacity onPress={() => setSearchLocal('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalList}>
              {equiposLocalesFiltrados.map(equipo => (
                <TouchableOpacity
                  key={equipo.id_equipo}
                  style={[
                    styles.modalItem,
                    equipoLocalId === equipo.id_equipo && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setEquipoLocalId(equipo.id_equipo);
                    setShowEquipoLocalModal(false);
                    setSearchLocal('');
                  }}
                >
                  <Image source={equipo.logo ? { uri: equipo.logo } : require('../../assets/InterLOGO.png')} style={styles.modalEquipoLogo} />
                  <Text style={styles.modalItemText}>{equipo.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Seleccionar Equipo Visitante */}
      <Modal
        visible={showEquipoVisitanteModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEquipoVisitanteModal(false);
          setSearchVisitante('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Equipo Visitante</Text>
              <TouchableOpacity onPress={() => {
                setShowEquipoVisitanteModal(false);
                setSearchVisitante('');
              }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* Buscador */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar equipo..."
                value={searchVisitante}
                onChangeText={setSearchVisitante}
                placeholderTextColor={colors.textSecondary}
              />
              {searchVisitante.length > 0 && (
                <TouchableOpacity onPress={() => setSearchVisitante('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalList}>
              {equiposVisitantesFiltrados.map(equipo => (
                <TouchableOpacity
                  key={equipo.id_equipo}
                  style={[
                    styles.modalItem,
                    equipoVisitanteId === equipo.id_equipo && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setEquipoVisitanteId(equipo.id_equipo);
                    setShowEquipoVisitanteModal(false);
                    setSearchVisitante('');
                  }}
                >
                  <Image source={equipo.logo ? { uri: equipo.logo } : require('../../assets/InterLOGO.png')} style={styles.modalEquipoLogo} />
                  <Text style={styles.modalItemText}>{equipo.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  editBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
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
  modalEquipoLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
});
