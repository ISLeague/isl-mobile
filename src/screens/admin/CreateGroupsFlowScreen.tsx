import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button, Card } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import api from '../../api';
import type { Fase, TipoCopa, TipoFase } from '../../api/types/fases.types';
import type { Grupo } from '../../api/types/grupos.types';

interface CreateGroupsFlowScreenProps {
  navigation: any;
  route: any;
}

export const CreateGroupsFlowScreen: React.FC<CreateGroupsFlowScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria } = route.params || {};
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [faseGrupos, setFaseGrupos] = useState<Fase | null>(null);
  const [creatingFase, setCreatingFase] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showIndividualModal, setShowIndividualModal] = useState(false);

  // Estados para creación bulk
  const [cantidadGrupos, setCantidadGrupos] = useState('4');
  const [cantidadEquiposPorGrupo, setCantidadEquiposPorGrupo] = useState('4');
  const [equiposPasanOro, setEquiposPasanOro] = useState('2');
  const [equiposPasanPlata, setEquiposPasanPlata] = useState('1');
  const [equiposPasanBronce, setEquiposPasanBronce] = useState('0');
  const [posicionesOro, setPosicionesOro] = useState('1,2');
  const [posicionesPlata, setPosicionesPlata] = useState('3');
  const [posicionesBronce, setPosicionesBronce] = useState('');
  const [descripcionClasificacion, setDescripcionClasificacion] = useState('');

  // Estados para creación individual
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [cantidadEquipos, setCantidadEquipos] = useState('4');
  const [equiposOro, setEquiposOro] = useState('2');
  const [equiposPlata, setEquiposPlata] = useState('1');
  const [equiposBronce, setEquiposBronce] = useState('0');
  const [posOro, setPosOro] = useState('1,2');
  const [posPlata, setPosPlata] = useState('3');
  const [posBronce, setPosBronce] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    loadFaseGrupos();
  }, [idEdicionCategoria]);

  const loadFaseGrupos = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        const response = await api.fases.list(idEdicionCategoria);
        return response;
      },
      'loadFaseGrupos',
      {
        fallbackValue: null,
        onError: () => showError('Error al cargar las fases')
      }
    );

    if (result && result.success) {
      // Buscar fase de tipo 'grupo'
      const faseGruposEncontrada = result.data.find((f: Fase) => f.tipo === 'grupo');
      setFaseGrupos(faseGruposEncontrada || null);
    }
    setLoading(false);
  };

  const handleCreateFaseGrupos = async () => {
    setCreatingFase(true);

    const requestData = {
      nombre: 'Fase de Grupos',
      tipo: 'grupo' as TipoFase,
      copa: 'general' as TipoCopa,
      orden: 1,
      id_edicion_categoria: idEdicionCategoria,
      partidos_ida_vuelta: false,
      permite_empate: true,
      permite_penales: false,
    };

    console.log('🚀 [CreateFaseGrupos] Iniciando creación de fase...');
    console.log('📦 [CreateFaseGrupos] Request Data:', JSON.stringify(requestData, null, 2));
    console.log('📍 [CreateFaseGrupos] idEdicionCategoria:', idEdicionCategoria);

    const result = await safeAsync(
      async () => {
        console.log('⏳ [CreateFaseGrupos] Llamando a api.fases.create...');
        const response = await api.fases.create(requestData);
        console.log('✅ [CreateFaseGrupos] Respuesta recibida:', JSON.stringify(response, null, 2));
        return response;
      },
      'createFaseGrupos',
      {
        fallbackValue: null,
        onError: (error) => {
          console.error('❌ [CreateFaseGrupos] Error capturado:', error);
          console.error('❌ [CreateFaseGrupos] Error message:', error?.message);
          showError('Error al crear la fase de grupos');
        }
      }
    );

    console.log('📊 [CreateFaseGrupos] Resultado final:', result);

    if (result && result.success) {
      console.log('🎉 [CreateFaseGrupos] Fase creada exitosamente');
      showSuccess('Fase de grupos creada exitosamente');
      setFaseGrupos(result.data);
    } else {
      console.log('⚠️ [CreateFaseGrupos] No se pudo crear la fase');
    }

    setCreatingFase(false);
  };

  const handleCreateGruposBulk = async () => {
    console.log('🏗️ [CreateGruposBulk] Iniciando creación de grupos en bulk...');

    const cantGrupos = parseInt(cantidadGrupos) || 0;
    const cantEquipos = parseInt(cantidadEquiposPorGrupo) || 0;
    const oro = parseInt(equiposPasanOro) || 0;
    const plata = parseInt(equiposPasanPlata) || 0;
    const bronce = parseInt(equiposPasanBronce) || 0;

    console.log('🏗️ [CreateGruposBulk] Valores parseados:', { cantGrupos, cantEquipos, oro, plata, bronce });
    console.log('🏗️ [CreateGruposBulk] faseGrupos:', faseGrupos);

    if (cantGrupos <= 0 || cantEquipos <= 0) {
      console.warn('⚠️ [CreateGruposBulk] Validación fallida: cantidad inválida');
      Alert.alert('Error', 'La cantidad de grupos y equipos debe ser mayor a 0');
      return;
    }

    if (!faseGrupos) {
      console.warn('⚠️ [CreateGruposBulk] Validación fallida: no hay fase de grupos');
      Alert.alert('Error', 'No hay una fase de grupos creada');
      return;
    }

    const requestData = {
      id_fase: faseGrupos.id_fase,
      cantidad_grupos: cantGrupos,
      cantidad_equipos_por_grupo: cantEquipos,
      equipos_oro: oro,
      equipos_plata: plata,
      equipos_bronce: bronce,
      posiciones_oro: posicionesOro.trim() || undefined,
      posiciones_plata: posicionesPlata.trim() || undefined,
      posiciones_bronce: posicionesBronce.trim() || undefined,
      descripcion_clasificacion: descripcionClasificacion.trim() || undefined,
    };

    console.log('🏗️ [CreateGruposBulk] Request data:', JSON.stringify(requestData, null, 2));

    const result = await safeAsync(
      async () => {
        console.log('⏳ [CreateGruposBulk] Llamando a api.grupos.createBulk...');
        const response = await api.grupos.createBulk(requestData);
        console.log('✅ [CreateGruposBulk] Respuesta recibida:', JSON.stringify(response, null, 2));
        return response;
      },
      'createGruposBulk',
      {
        fallbackValue: null,
        onError: (error: any) => {
          console.error('❌ [CreateGruposBulk] Error capturado:', error);
          console.error('❌ [CreateGruposBulk] Error message:', error?.message);
          console.error('❌ [CreateGruposBulk] Error response:', error?.response?.data);
          console.error('❌ [CreateGruposBulk] Error status:', error?.response?.status);
          showError('Error al crear los grupos');
        }
      }
    );

    console.log('📊 [CreateGruposBulk] Resultado final:', result);

    if (result && result.success) {
      console.log('🎉 [CreateGruposBulk] Grupos creados exitosamente');
      showSuccess(`${result.data.grupos_creados} grupos creados exitosamente`);
      setShowBulkModal(false);
      navigation.goBack();
    } else {
      console.log('⚠️ [CreateGruposBulk] No se pudieron crear los grupos');
    }
  };

  const handleCreateGrupoIndividual = async () => {
    if (!nombreGrupo.trim()) {
      Alert.alert('Error', 'El nombre del grupo es requerido');
      return;
    }

    if (!faseGrupos) {
      Alert.alert('Error', 'No hay una fase de grupos creada');
      return;
    }

    const result = await safeAsync(
      async () => {
        const response = await api.grupos.create({
          id_fase: faseGrupos.id_fase,
          nombre: nombreGrupo,
          cantidad_equipos: parseInt(cantidadEquipos) || undefined,
          equipos_oro: parseInt(equiposOro) || undefined,
          equipos_plata: parseInt(equiposPlata) || undefined,
          equipos_bronce: parseInt(equiposBronce) || undefined,
          posiciones_oro: posOro.trim() || undefined,
          posiciones_plata: posPlata.trim() || undefined,
          posiciones_bronce: posBronce.trim() || undefined,
          descripcion_clasificacion: descripcion.trim() || undefined,
        });
        return response;
      },
      'createGrupoIndividual',
      {
        fallbackValue: null,
        onError: () => showError('Error al crear el grupo')
      }
    );

    if (result && result.success) {
      showSuccess(`Grupo "${nombreGrupo}" creado exitosamente`);
      setShowIndividualModal(false);
      navigation.goBack();
    }
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Gestionar Grupos</Text>
        </View>

        <View style={styles.content}>
          {/* Estado de Fase de Grupos */}
          <Card style={styles.faseCard}>
            <View style={styles.faseHeader}>
              <MaterialCommunityIcons
                name={faseGrupos ? "check-circle" : "alert-circle"}
                size={24}
                color={faseGrupos ? colors.success : colors.warning}
              />
              <Text style={styles.faseTitle}>
                {faseGrupos ? 'Fase de Grupos Existente' : 'Sin Fase de Grupos'}
              </Text>
            </View>

            {faseGrupos ? (
              <View style={styles.faseInfo}>
                <Text style={styles.faseInfoText}>
                  <Text style={styles.faseInfoLabel}>Nombre: </Text>
                  {faseGrupos.nombre}
                </Text>
                <Text style={styles.faseInfoText}>
                  <Text style={styles.faseInfoLabel}>Tipo: </Text>
                  {faseGrupos.tipo}
                </Text>
              </View>
            ) : (
              <View style={styles.faseAction}>
                <Text style={styles.faseWarningText}>
                  Necesitas crear una fase de grupos antes de crear grupos
                </Text>
                <Button
                  title="Crear Fase de Grupos"
                  onPress={handleCreateFaseGrupos}
                  loading={creatingFase}
                  disabled={creatingFase}
                  style={styles.createFaseButton}
                />
              </View>
            )}
          </Card>

          {/* Opciones para crear grupos (solo si existe fase de grupos) */}
          {faseGrupos && (
            <>
              <Text style={styles.sectionTitle}>Opciones de Creación</Text>

              {/* Crear Múltiples Grupos */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setShowBulkModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <MaterialCommunityIcons name="view-grid-plus" size={32} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Crear Múltiples Grupos</Text>
                  <Text style={styles.optionDescription}>
                    Crea varios grupos de una vez con la misma configuración
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Crear Grupo Individual */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setShowIndividualModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <MaterialCommunityIcons name="view-grid-plus-outline" size={32} color={colors.success} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Crear Grupo Individual</Text>
                  <Text style={styles.optionDescription}>
                    Crea un grupo con configuración personalizada
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal para Crear Grupos Bulk */}
      <Modal
        visible={showBulkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBulkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Múltiples Grupos</Text>
              <TouchableOpacity onPress={() => setShowBulkModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Cantidad de Grupos */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cantidad de Grupos</Text>
                <TextInput
                  style={styles.input}
                  value={cantidadGrupos}
                  onChangeText={setCantidadGrupos}
                  keyboardType="number-pad"
                  placeholder="Ej: 4"
                />
              </View>

              {/* Cantidad de Equipos por Grupo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos por Grupo</Text>
                <TextInput
                  style={styles.input}
                  value={cantidadEquiposPorGrupo}
                  onChangeText={setCantidadEquiposPorGrupo}
                  keyboardType="number-pad"
                  placeholder="Ej: 4"
                />
              </View>

              {/* Equipos que Pasan a Oro */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Oro</Text>
                <TextInput
                  style={styles.input}
                  value={equiposPasanOro}
                  onChangeText={setEquiposPasanOro}
                  keyboardType="number-pad"
                  placeholder="Ej: 2"
                />
              </View>

              {/* Equipos que Pasan a Plata */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Plata</Text>
                <TextInput
                  style={styles.input}
                  value={equiposPasanPlata}
                  onChangeText={setEquiposPasanPlata}
                  keyboardType="number-pad"
                  placeholder="Ej: 1"
                />
              </View>

              {/* Equipos que Pasan a Bronce */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Bronce</Text>
                <TextInput
                  style={styles.input}
                  value={equiposPasanBronce}
                  onChangeText={setEquiposPasanBronce}
                  keyboardType="number-pad"
                  placeholder="Ej: 0"
                />
              </View>

              {/* Posiciones Oro */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Oro (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posicionesOro}
                  onChangeText={setPosicionesOro}
                  placeholder="Ej: 1,2"
                />
              </View>

              {/* Posiciones Plata */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Plata (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posicionesPlata}
                  onChangeText={setPosicionesPlata}
                  placeholder="Ej: 3"
                />
              </View>

              {/* Posiciones Bronce */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Bronce (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posicionesBronce}
                  onChangeText={setPosicionesBronce}
                  placeholder="Ej: 4"
                />
              </View>

              {/* Descripción de Clasificación */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción de Clasificación (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descripcionClasificacion}
                  onChangeText={setDescripcionClasificacion}
                  placeholder="Ej: Los primeros 2 clasifican a oro, el 3ro a plata..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setShowBulkModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Crear Grupos"
                onPress={handleCreateGruposBulk}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Crear Grupo Individual */}
      <Modal
        visible={showIndividualModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIndividualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Grupo Individual</Text>
              <TouchableOpacity onPress={() => setShowIndividualModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Nombre del Grupo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Grupo *</Text>
                <TextInput
                  style={styles.input}
                  value={nombreGrupo}
                  onChangeText={setNombreGrupo}
                  placeholder="Ej: Grupo A"
                />
              </View>

              {/* Cantidad de Equipos (opcional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cantidad de Equipos (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={cantidadEquipos}
                  onChangeText={setCantidadEquipos}
                  keyboardType="number-pad"
                  placeholder="Ej: 4"
                />
              </View>

              {/* Equipos que Pasan a Oro */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Oro (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={equiposOro}
                  onChangeText={setEquiposOro}
                  keyboardType="number-pad"
                  placeholder="Ej: 2"
                />
              </View>

              {/* Equipos que Pasan a Plata */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Plata (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={equiposPlata}
                  onChangeText={setEquiposPlata}
                  keyboardType="number-pad"
                  placeholder="Ej: 1"
                />
              </View>

              {/* Equipos que Pasan a Bronce */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos que pasan a Bronce (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={equiposBronce}
                  onChangeText={setEquiposBronce}
                  keyboardType="number-pad"
                  placeholder="Ej: 0"
                />
              </View>

              {/* Posiciones Oro */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Oro (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posOro}
                  onChangeText={setPosOro}
                  placeholder="Ej: 1,2"
                />
              </View>

              {/* Posiciones Plata */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Plata (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posPlata}
                  onChangeText={setPosPlata}
                  placeholder="Ej: 3"
                />
              </View>

              {/* Posiciones Bronce */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Posiciones Bronce (separadas por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={posBronce}
                  onChangeText={setPosBronce}
                  placeholder="Ej: 4"
                />
              </View>

              {/* Descripción de Clasificación */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción de Clasificación (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholder="Ej: Los primeros 2 clasifican a oro, el 3ro a plata..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setShowIndividualModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Crear Grupo"
                onPress={handleCreateGrupoIndividual}
                style={styles.modalButton}
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
    backgroundColor: colors.backgroundGray,
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    padding: 20,
  },
  faseCard: {
    padding: 16,
    marginBottom: 24,
  },
  faseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  faseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  faseInfo: {
    gap: 8,
  },
  faseInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  faseInfoLabel: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  faseAction: {
    gap: 12,
  },
  faseWarningText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  createFaseButton: {
    backgroundColor: colors.warning,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
  },
});
