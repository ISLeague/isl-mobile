import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { CambioPartido, JugadorCambio } from '../../api/types/cambios.types';

interface MatchSubstitutionsScreenProps {
  navigation: any;
  route: any;
}

export const MatchSubstitutionsScreen: React.FC<MatchSubstitutionsScreenProps> = ({ navigation, route }) => {
  const { partido, ronda, equipoLocal: equipoLocalParam, equipoVisitante: equipoVisitanteParam } = route.params;
  const { showSuccess, showError } = useToast();

  const equipoLocalId = typeof partido.id_equipo_local === 'number' ? partido.id_equipo_local : partido.id_equipo_local?.id_equipo;
  const equipoVisitanteId = typeof partido.id_equipo_visitante === 'number' ? partido.id_equipo_visitante : partido.id_equipo_visitante?.id_equipo;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cambios ya registrados
  const [cambiosLocal, setCambiosLocal] = useState<CambioPartido[]>([]);
  const [cambiosVisitante, setCambiosVisitante] = useState<CambioPartido[]>([]);

  // Jugadores disponibles para cambios
  const [enCanchaLocal, setEnCanchaLocal] = useState<JugadorCambio[]>([]);
  const [enBancaLocal, setEnBancaLocal] = useState<JugadorCambio[]>([]);
  const [enCanchaVisitante, setEnCanchaVisitante] = useState<JugadorCambio[]>([]);
  const [enBancaVisitante, setEnBancaVisitante] = useState<JugadorCambio[]>([]);

  // Modal para agregar cambio
  const [showModal, setShowModal] = useState(false);
  const [modalEquipo, setModalEquipo] = useState<'local' | 'visitante'>('local');
  const [selectedSale, setSelectedSale] = useState<JugadorCambio | null>(null);
  const [selectedEntra, setSelectedEntra] = useState<JugadorCambio | null>(null);
  const [minuto, setMinuto] = useState('');
  const [motivo, setMotivo] = useState<'tactico' | 'lesion' | 'cansancio' | null>(null);

  useEffect(() => {
    loadData();
  }, [partido.id_partido]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar cambios existentes
      const cambiosResponse = await api.cambios.list(partido.id_partido);
      if (cambiosResponse.success && cambiosResponse.data) {
        const cambiosPorEquipo = cambiosResponse.data.cambios_por_equipo || {};
        setCambiosLocal(cambiosPorEquipo[equipoLocalId] || []);
        setCambiosVisitante(cambiosPorEquipo[equipoVisitanteId] || []);
      }

      // Cargar disponibles para local
      const dispLocalResponse = await api.cambios.getDisponibles(partido.id_partido, equipoLocalId);
      if (dispLocalResponse.success && dispLocalResponse.data) {
        setEnCanchaLocal(dispLocalResponse.data.en_cancha || []);
        setEnBancaLocal(dispLocalResponse.data.en_banca || []);
      }

      // Cargar disponibles para visitante
      const dispVisResponse = await api.cambios.getDisponibles(partido.id_partido, equipoVisitanteId);
      if (dispVisResponse.success && dispVisResponse.data) {
        setEnCanchaVisitante(dispVisResponse.data.en_cancha || []);
        setEnBancaVisitante(dispVisResponse.data.en_banca || []);
      }
    } catch (error: any) {
      showError(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openAddModal = (equipo: 'local' | 'visitante') => {
    setModalEquipo(equipo);
    setSelectedSale(null);
    setSelectedEntra(null);
    setMinuto('');
    setMotivo(null);
    setShowModal(true);
  };

  const handleSaveCambio = async () => {
    if (!selectedSale || !selectedEntra) {
      Alert.alert('Error', 'Selecciona el jugador que sale y el que entra');
      return;
    }

    // Validar que no sea el mismo jugador
    if (selectedSale.id_plantilla === selectedEntra.id_plantilla) {
      Alert.alert('Error', 'El jugador que sale y el que entra no pueden ser el mismo');
      return;
    }

    // Minuto es opcional, solo validar si se proporciona
    let minutoNum: number | undefined = undefined;
    if (minuto.trim() !== '') {
      minutoNum = parseInt(minuto);
      if (isNaN(minutoNum) || minutoNum < 0 || minutoNum > 120) {
        Alert.alert('Error', 'El minuto debe ser un número entre 0 y 120');
        return;
      }
    }

    setSaving(true);

    try {
      const response = await api.cambios.registrar({
        id_partido: partido.id_partido,
        id_equipo: modalEquipo === 'local' ? equipoLocalId : equipoVisitanteId,
        id_jugador_sale: selectedSale.id_plantilla,
        id_jugador_entra: selectedEntra.id_plantilla,
        minuto: minutoNum,
        motivo: motivo || undefined,
      });

      if (response.success) {
        showSuccess('Cambio registrado correctamente');
        setShowModal(false);
        await loadData();
      } else {
        showError(response.error || 'Error al registrar cambio');
      }
    } catch (error: any) {
      showError(error.message || 'Error al registrar cambio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCambio = (cambio: CambioPartido) => {
    Alert.alert(
      'Eliminar Cambio',
      `¿Eliminar cambio de ${cambio.jugador_sale.nombre} por ${cambio.jugador_entra.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.cambios.delete(cambio.id_cambio);
              if (response.success) {
                showSuccess('Cambio eliminado');
                await loadData();
              } else {
                showError(response.error || 'Error al eliminar');
              }
            } catch (error: any) {
              showError(error.message || 'Error al eliminar');
            }
          },
        },
      ]
    );
  };

  const handleGoToResults = () => {
    navigation.navigate('ResultPage', { partido, ronda });
  };

  const renderCambio = (cambio: CambioPartido, index: number) => {
    const camisetaSale = cambio.jugador_sale.numero != null ? `#${cambio.jugador_sale.numero}` : 'X';
    const camisetaEntra = cambio.jugador_entra.numero != null ? `#${cambio.jugador_entra.numero}` : 'X';
    
    return (
      <View key={cambio.id_cambio} style={styles.cambioCard}>
        <View style={styles.cambioMinuto}>
          <Text style={styles.cambioMinutoText}>
            {cambio.minuto != null ? `${cambio.minuto}'` : `#${index + 1}`}
          </Text>
        </View>
        <View style={styles.cambioInfo}>
          <View style={styles.cambioJugador}>
            <MaterialCommunityIcons name="arrow-down" size={16} color={colors.error} />
            <Text style={styles.cambioJugadorNombre}>
              {camisetaSale} {cambio.jugador_sale.nombre}
            </Text>
          </View>
          <View style={styles.cambioJugador}>
            <MaterialCommunityIcons name="arrow-up" size={16} color={colors.success} />
            <Text style={styles.cambioJugadorNombre}>
              {camisetaEntra} {cambio.jugador_entra.nombre}
            </Text>
          </View>
          {cambio.motivo && (
            <Text style={styles.cambioMotivo}>{cambio.motivo}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCambio(cambio)}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEquipoCambios = (
    nombre: string,
    cambios: CambioPartido[],
    equipo: 'local' | 'visitante'
  ) => (
    <View style={styles.equipoSection}>
      <View style={styles.equipoHeader}>
        <Text style={styles.equipoNombre}>{nombre}</Text>
        <Text style={styles.cambiosCount}>{cambios.length} cambios</Text>
      </View>

      {cambios.length > 0 ? (
        <View style={styles.cambiosList}>
          {cambios.map((cambio, index) => renderCambio(cambio, index))}
        </View>
      ) : (
        <Text style={styles.noCambios}>Sin cambios registrados</Text>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => openAddModal(equipo)}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
        <Text style={styles.addButtonText}>Agregar Cambio</Text>
      </TouchableOpacity>
    </View>
  );

  const renderJugadorOption = (
    jugador: JugadorCambio,
    selected: JugadorCambio | null,
    onSelect: (j: JugadorCambio) => void
  ) => {
    const isSelected = selected?.id_plantilla === jugador.id_plantilla;
    const camiseta = jugador.numero_camiseta != null ? `#${jugador.numero_camiseta}` : 'X';
    return (
      <TouchableOpacity
        key={jugador.id_plantilla}
        style={[styles.jugadorOption, isSelected && styles.jugadorOptionSelected]}
        onPress={() => onSelect(jugador)}
      >
        <Text style={[styles.jugadorOptionText, isSelected && styles.jugadorOptionTextSelected]}>
          {camiseta} {jugador.nombre_completo}
        </Text>
        {isSelected && (
          <MaterialCommunityIcons name="check" size={18} color={colors.white} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando cambios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const enCancha = modalEquipo === 'local' ? enCanchaLocal : enCanchaVisitante;
  const enBanca = modalEquipo === 'local' ? enBancaLocal : enBancaVisitante;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Registrar Cambios</Text>
          <Text style={styles.headerSubtitle}>Sustituciones del partido</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderEquipoCambios(
          equipoLocalParam?.nombre || 'Equipo Local',
          cambiosLocal,
          'local'
        )}

        <View style={styles.separator} />

        {renderEquipoCambios(
          equipoVisitanteParam?.nombre || 'Equipo Visitante',
          cambiosVisitante,
          'visitante'
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomActions}>
        <Button
          title="Ir a Cargar Resultado"
          onPress={handleGoToResults}
          style={styles.resultButton}
        />
      </View>

      {/* Modal para agregar cambio */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Cambio</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Jugador que sale */}
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons name="arrow-down" size={16} color={colors.error} /> Jugador que SALE
              </Text>
              {enCancha.length > 0 ? (
                <View style={styles.jugadoresGrid}>
                  {enCancha.filter(j => j.puede_salir !== false).map(j =>
                    renderJugadorOption(j, selectedSale, setSelectedSale)
                  )}
                </View>
              ) : (
                <Text style={styles.noJugadores}>No hay jugadores en cancha</Text>
              )}

              {/* Jugador que entra */}
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons name="arrow-up" size={16} color={colors.success} /> Jugador que ENTRA
              </Text>
              {enCancha.length > 0 ? (
                <View style={styles.jugadoresGrid}>
                  {enCancha
                    .filter(j => j.puede_salir !== false && (!selectedSale || j.id_plantilla !== selectedSale.id_plantilla))
                    .map(j =>
                      renderJugadorOption(j, selectedEntra, setSelectedEntra)
                    )}
                </View>
              ) : (
                <Text style={styles.noJugadores}>No hay jugadores en cancha</Text>
              )}

              {/* Minuto */}
              <Text style={styles.sectionTitle}>Minuto (opcional)</Text>
              <TextInput
                style={styles.minutoInput}
                value={minuto}
                onChangeText={setMinuto}
                placeholder="Ej: 65"
                keyboardType="numeric"
                maxLength={3}
              />

              {/* Motivo */}
              <Text style={styles.sectionTitle}>Motivo (opcional)</Text>
              <View style={styles.motivoButtons}>
                {(['tactico', 'lesion', 'cansancio'] as const).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.motivoButton, motivo === m && styles.motivoButtonSelected]}
                    onPress={() => setMotivo(motivo === m ? null : m)}
                  >
                    <Text style={[styles.motivoText, motivo === m && styles.motivoTextSelected]}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => setShowModal(false)}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title={saving ? 'Guardando...' : 'Guardar'}
                onPress={handleSaveCambio}
                disabled={saving || !selectedSale || !selectedEntra}
                style={styles.saveButton}
              />
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  equipoSection: {
    padding: 16,
    backgroundColor: colors.white,
  },
  equipoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  equipoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cambiosCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  cambiosList: {
    gap: 12,
  },
  cambioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  cambioMinuto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cambioMinutoText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cambioInfo: {
    flex: 1,
  },
  cambioJugador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cambioJugadorNombre: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textPrimary,
  },
  cambioMotivo: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  noCambios: {
    textAlign: 'center',
    color: colors.textLight,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  separator: {
    height: 8,
    backgroundColor: colors.background,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultButton: {
    backgroundColor: colors.primary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalScroll: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  jugadoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  jugadorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jugadorOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  jugadorOptionText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  jugadorOptionTextSelected: {
    color: colors.white,
    fontWeight: '500',
  },
  noJugadores: {
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  minutoInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  motivoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  motivoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  motivoButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  motivoText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  motivoTextSelected: {
    color: colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
  },
  saveButton: {
    flex: 1,
  },
});

export default MatchSubstitutionsScreen;
