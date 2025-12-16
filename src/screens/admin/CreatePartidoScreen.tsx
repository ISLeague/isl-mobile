import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button, Card, GradientHeader } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import { mockEquipos, mockCanchas, mockLocales } from '../../data/mockData';

export const CreatePartidoScreen = ({ navigation, route }: any) => {
  const { ronda } = route.params;
  const { showSuccess, showError } = useToast();

  const [equipoLocalId, setEquipoLocalId] = useState<number | null>(null);
  const [equipoVisitanteId, setEquipoVisitanteId] = useState<number | null>(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [localId, setLocalId] = useState<number | null>(null);
  const [canchaId, setCanchaId] = useState<number | null>(null);

  // Modales para seleccionar
  const [showEquipoLocalModal, setShowEquipoLocalModal] = useState(false);
  const [showEquipoVisitanteModal, setShowEquipoVisitanteModal] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [showCanchaModal, setShowCanchaModal] = useState(false);
  
  // Búsqueda de equipos
  const [searchEquipoLocal, setSearchEquipoLocal] = useState('');
  const [searchEquipoVisitante, setSearchEquipoVisitante] = useState('');

  // Equipos ordenados alfabéticamente
  const equiposOrdenados = [...mockEquipos].sort((a, b) => 
    a.nombre.localeCompare(b.nombre)
  );

  // Filtrar equipos según búsqueda
  const equiposLocalesFiltrados = equiposOrdenados.filter(equipo =>
    equipo.nombre.toLowerCase().includes(searchEquipoLocal.toLowerCase())
  );

  const equiposVisitantesFiltrados = equiposOrdenados.filter(equipo =>
    equipo.nombre.toLowerCase().includes(searchEquipoVisitante.toLowerCase())
  );

  // Canchas filtradas por local seleccionado
  const canchasDelLocal = localId 
    ? mockCanchas.filter(cancha => cancha.id_local === localId)
    : [];

  const handleCreate = () => {
    if (!equipoLocalId || !equipoVisitanteId) {
      showError('Debes seleccionar ambos equipos');
      return;
    }

    if (equipoLocalId === equipoVisitanteId) {
      showError('Los equipos deben ser diferentes');
      return;
    }

    // Validar formato de fecha si no está vacía
    if (fecha.trim()) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(fecha)) {
        showError('El formato de la fecha debe ser DD/MM/YYYY (ej: 25/12/2025)');
        return;
      }
    }

    // Validar formato de hora si no está vacía
    if (hora.trim()) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(hora)) {
        showError('El formato de la hora debe ser HH:MM (ej: 15:00)');
        return;
      }
    }

    Alert.alert(
      'Confirmar Creación',
      '¿Deseas crear este partido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async () => {
            try {
              // TODO: Llamar API
              // await api.matches.createMatch({
              //   id_ronda: ronda.id_ronda,
              //   id_equipo_local: equipoLocalId,
              //   id_equipo_visitante: equipoVisitanteId,
              //   fecha,
              //   hora,
              //   id_cancha: canchaId,
              // });
              console.log('Crear partido:', {
                id_ronda: ronda.id_ronda,
                equipoLocalId,
                equipoVisitanteId,
                fecha,
                hora,
                canchaId,
              });
              showSuccess('Partido creado exitosamente');
              navigation.goBack();
            } catch (error) {
              showError('Error al crear el partido');
            }
          },
        },
      ]
    );
  };

  const getEquipoNombre = (id: number | null) => {
    if (!id) return 'Seleccionar equipo';
    return mockEquipos.find(e => e.id_equipo === id)?.nombre || 'Equipo no encontrado';
  };

  const getLocalNombre = (id: number | null) => {
    if (!id) return 'Seleccionar local';
    return mockLocales.find(l => l.id_local === id)?.nombre || 'Local no encontrado';
  };

  const getCanchaNombre = (id: number | null) => {
    if (!id) return 'Seleccionar cancha';
    if (!localId) return 'Primero selecciona un local';
    const cancha = mockCanchas.find(c => c.id_cancha === id);
    if (!cancha) return 'Cancha no encontrada';
    const local = mockLocales.find(l => l.id_local === cancha.id_local);
    return `${cancha.nombre} - ${local?.nombre || ''}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Crear Partido"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Ronda: {ronda.nombre}</Text>
          <Text style={styles.sectionTitle}>Información del Partido</Text>

          {/* Equipo Local */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Equipo Local *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowEquipoLocalModal(true)}
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
              onPress={() => setShowEquipoVisitanteModal(true)}
            >
              <Text style={[styles.selectButtonText, equipoVisitanteId ? styles.selectButtonTextSelected : null]}>
                {getEquipoNombre(equipoVisitanteId)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Fecha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Fecha (opcional)</Text>
            <TextInput
              style={styles.input}
              value={fecha}
              onChangeText={setFecha}
              placeholder="DD/MM/YYYY (25/12/2024)"
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
              placeholder="HH:MM (14:30)"
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

          {/* Cancha (solo si hay local seleccionado) */}
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
            title="Crear Partido"
            onPress={handleCreate}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
            
            {/* Búsqueda */}
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
                    setSearchEquipoLocal('');
                  }}
                >
                  <Text style={styles.modalItemText}>{equipo.nombre}</Text>
                </TouchableOpacity>
              ))}
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
            
            {/* Búsqueda */}
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
                    setSearchEquipoVisitante('');
                  }}
                >
                  <Text style={styles.modalItemText}>{equipo.nombre}</Text>
                </TouchableOpacity>
              ))}
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
              {mockLocales.map(local => (
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
                    const localNombre = mockLocales.find(l => l.id_local === cancha.id_local)?.nombre || '';
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
    marginBottom: 20,
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
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
});
