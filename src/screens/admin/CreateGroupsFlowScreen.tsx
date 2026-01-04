import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import type { Grupo, ConfiguracionClasificacion } from '../../api/types/grupos.types';

interface CreateGroupsFlowScreenProps {
  navigation: any;
  route: any;
}

export const CreateGroupsFlowScreen: React.FC<CreateGroupsFlowScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria, onGroupsCreated } = route.params || {};
  const { showSuccess, showError, showInfo } = useToast();

  const [loading, setLoading] = useState(true);
  const [faseGrupos, setFaseGrupos] = useState<Fase | null>(null);
  const [configuracionClasificacion, setConfiguracionClasificacion] = useState<ConfiguracionClasificacion | null>(null);
  const [creatingFase, setCreatingFase] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [creatingGroups, setCreatingGroups] = useState(false);
  const [creationStatus, setCreationStatus] = useState<string>('');

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

  // Estados para creación individual (simplificados - usa configuración del torneo)
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [cantidadEquipos, setCantidadEquipos] = useState('4');
  const [cantidadEquiposError, setCantidadEquiposError] = useState('');

  useEffect(() => {
    loadFaseGrupos();
  }, [idEdicionCategoria]);

  // Actualizar el mínimo de equipos cuando se carga la configuración
  useEffect(() => {
    if (configuracionClasificacion) {
      const minimo = configuracionClasificacion.equipos_oro +
        configuracionClasificacion.equipos_plata +
        configuracionClasificacion.equipos_bronce + 1;
      setCantidadEquipos(minimo.toString());
    }
  }, [configuracionClasificacion]);

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

      // Si existe fase de grupos, cargar su configuración de clasificación
      if (faseGruposEncontrada) {
        const gruposResult = await safeAsync(
          async () => {
            const response = await api.grupos.get(faseGruposEncontrada.id_fase);
            return response;
          },
          'loadGruposConfig',
          {
            fallbackValue: null,
            onError: () => {}
          }
        );

        if (gruposResult && gruposResult.success && gruposResult.data) {
          setConfiguracionClasificacion(gruposResult.data.configuracion_clasificacion || null);
        }
      }
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

    const result = await safeAsync(
      async () => {
        const response = await api.fases.create(requestData);
        return response;
      },
      'createFaseGrupos',
      {
        fallbackValue: null,
        onError: (error) => {
          showError('Error al crear la fase de grupos');
        }
      }
    );

    if (result && result.success) {
      showSuccess('Fase de grupos creada exitosamente');
      setFaseGrupos(result.data);
    }

    setCreatingFase(false);
  };

  const handleCreateGruposBulk = async () => {

    const cantGrupos = parseInt(cantidadGrupos) || 0;
    const cantEquipos = parseInt(cantidadEquiposPorGrupo) || 0;

    if (!faseGrupos) {
      showError('No hay una fase de grupos creada', 'Error');
      return;
    }

    if (cantGrupos <= 0 || cantEquipos <= 0) {
      showError('La cantidad de grupos y equipos debe ser mayor a 0', 'Datos inválidos');
      return;
    }

    // Si NO hay configuración existente, se deben enviar los datos de configuración
    let requestData: any = {
      id_fase: faseGrupos.id_fase,
      cantidad_grupos: cantGrupos,
      cantidad_equipos_por_grupo: cantEquipos,
    };

    if (!configuracionClasificacion) {
      // Primera vez - configurar clasificación
      const oro = parseInt(equiposPasanOro) || 0;
      const plata = parseInt(equiposPasanPlata) || 0;
      const bronce = parseInt(equiposPasanBronce) || 0;


      // Validar que haya al menos un equipo más que los que clasifican
      const totalEquiposClasifican = oro + plata + bronce;
      if (cantEquipos <= totalEquiposClasifican) {
        showError(
          `Debe haber al menos ${totalEquiposClasifican + 1} equipos por grupo.\n\nActualmente ${totalEquiposClasifican} equipos clasifican (${oro} oro, ${plata} plata, ${bronce} bronce).\n\nNecesitas al menos 1 equipo que no clasifique.`,
          'Equipos insuficientes'
        );
        return;
      }

      requestData = {
        ...requestData,
        equipos_oro: oro,
        equipos_plata: plata,
        equipos_bronce: bronce,
        posiciones_oro: posicionesOro.trim() || undefined,
        posiciones_plata: posicionesPlata.trim() || undefined,
        posiciones_bronce: posicionesBronce.trim() || undefined,
        descripcion_clasificacion: descripcionClasificacion.trim() || undefined,
      };
    } else {
      // Ya existe configuración - validar con la configuración existente
      const totalEquiposClasifican = configuracionClasificacion.equipos_oro +
        configuracionClasificacion.equipos_plata +
        configuracionClasificacion.equipos_bronce;

      if (cantEquipos <= totalEquiposClasifican) {
        showError(
          `Debe haber al menos ${totalEquiposClasifican + 1} equipos por grupo.\n\nSegún la configuración del torneo:\n• ${configuracionClasificacion.equipos_oro} clasifican a Oro\n• ${configuracionClasificacion.equipos_plata} clasifican a Plata\n• ${configuracionClasificacion.equipos_bronce} clasifican a Bronce`,
          'No cumple con configuración'
        );
        return;
      }
    }


    try {
      // Mostrar loading ANTES de cerrar el modal
      setCreatingGroups(true);
      setCreationStatus(`Generando ${cantGrupos} grupos...`);

      showInfo(`Generando ${cantGrupos} grupos...`, 'Creando grupos');

      // Cerrar modal DESPUÉS de iniciar el proceso
      setShowBulkModal(false);

      const result = await safeAsync(
        async () => {

          const response = await api.grupos.createBulk(requestData);


          return response;
        },
        'createGruposBulk',
        {
          fallbackValue: null,
          onError: (error: any) => {
            // Información detallada de la respuesta HTTP
            if (error?.response) {
              // Mostrar mensaje de error específico según el código
              if (error.response.status === 409) {
                const errorMsg = error.response.data?.message || 'Conflicto al crear los grupos';
                showError(errorMsg, 'Conflicto (409)');
                return;
              }
            }

            showError(error?.response?.data?.message || 'Error al crear los grupos', 'Error');
          }
        }
      );


      if (result && result.success) {
        setCreationStatus('');

        showSuccess(
          `${result.data.grupos_creados} grupos creados exitosamente`,
          '¡Grupos generados!'
        );

        // Esperar 1.5 segundos para que el usuario vea el toast de éxito
        setTimeout(() => {
          setCreatingGroups(false);

          // Si hay callback, llamarlo
          if (onGroupsCreated) {
            onGroupsCreated();
          }

          // Volver a la pantalla anterior
          navigation.goBack();
        }, 1500);
      } else {
        setCreatingGroups(false);
        setCreationStatus('');
      }
    } catch (error) {
      setCreatingGroups(false);
      setCreationStatus('');
      showError('Error inesperado al crear los grupos', 'Error');
    }

  };

  const validateCantidadEquipos = (value: string) => {
    if (!configuracionClasificacion) return;

    const cantEquipos = parseInt(value) || 0;
    const { equipos_oro, equipos_plata, equipos_bronce } = configuracionClasificacion;
    const minimo = equipos_oro + equipos_plata + equipos_bronce + 1;

    if (cantEquipos > 0 && cantEquipos < minimo) {
      setCantidadEquiposError(`Mínimo ${minimo} equipos requeridos`);
    } else {
      setCantidadEquiposError('');
    }
  };

  const handleCantidadEquiposChange = (value: string) => {
    setCantidadEquipos(value);
    validateCantidadEquipos(value);
  };

  const handleCreateGrupoIndividual = async () => {
    if (!nombreGrupo.trim()) {
      showError('El nombre del grupo es requerido', 'Dato requerido');
      return;
    }

    if (!faseGrupos) {
      showError('No hay una fase de grupos creada', 'Error');
      return;
    }

    // Validar cantidad de equipos
    const cantEquipos = parseInt(cantidadEquipos) || 0;

    if (cantEquipos <= 0) {
      showError('La cantidad de equipos debe ser mayor a 0', 'Datos inválidos');
      return;
    }

    // Preparar request data base
    let requestData: any = {
      id_fase: faseGrupos.id_fase,
      nombre: nombreGrupo.trim(),
      cantidad_equipos: cantEquipos,
    };

    // Si NO hay configuración existente, incluir configuración
    if (!configuracionClasificacion) {
      const oro = parseInt(equiposPasanOro) || 0;
      const plata = parseInt(equiposPasanPlata) || 0;
      const bronce = parseInt(equiposPasanBronce) || 0;


      const totalEquiposClasifican = oro + plata + bronce;

      if (cantEquipos <= totalEquiposClasifican) {
        showError(
          `Debe haber al menos ${totalEquiposClasifican + 1} equipos en el grupo.\n\nSegún tu configuración:\n• ${oro} clasifican a Oro\n• ${plata} clasifican a Plata\n• ${bronce} clasifican a Bronce\n\nNecesitas al menos 1 equipo que no clasifique.`,
          'Equipos insuficientes'
        );
        return;
      }

      requestData = {
        ...requestData,
        equipos_oro: oro,
        equipos_plata: plata,
        equipos_bronce: bronce,
        posiciones_oro: posicionesOro.trim() || undefined,
        posiciones_plata: posicionesPlata.trim() || undefined,
        posiciones_bronce: posicionesBronce.trim() || undefined,
        descripcion_clasificacion: descripcionClasificacion.trim() || undefined,
      };
    } else {
      // Ya existe configuración - validar contra ella
      const { equipos_oro, equipos_plata, equipos_bronce } = configuracionClasificacion;
      const totalEquiposClasifican = equipos_oro + equipos_plata + equipos_bronce;

      if (cantEquipos <= totalEquiposClasifican) {
        showError(
          `Debe haber al menos ${totalEquiposClasifican + 1} equipos en el grupo.\n\nSegún las reglas del torneo:\n• ${equipos_oro} clasifican a Oro\n• ${equipos_plata} clasifican a Plata\n• ${equipos_bronce} clasifican a Bronce\n\nNecesitas al menos 1 equipo que no clasifique.`,
          'No cumple reglas del torneo'
        );
        return;
      }
    }

    try {
      // Mostrar loading ANTES de cerrar el modal
      setCreatingGroups(true);
      setCreationStatus(`Creando grupo "${nombreGrupo}"...`);

      showInfo(`Creando grupo "${nombreGrupo}"...`, 'Creando grupo');

      // Cerrar modal DESPUÉS de iniciar el proceso
      setShowIndividualModal(false);


      const result = await safeAsync(
        async () => {

          const response = await api.grupos.create(requestData);


          return response;
        },
        'createGrupoIndividual',
        {
          fallbackValue: null,
          onError: (error: any) => {
            // Información detallada de la respuesta HTTP
            if (error?.response) {
              // Mostrar mensaje de error específico según el código
              if (error.response.status === 409) {
                const errorMsg = error.response.data?.message || 'Conflicto al crear el grupo';
                showError(errorMsg, 'Conflicto (409)');
                return;
              }
            }

            showError(error?.response?.data?.message || 'Error al crear el grupo', 'Error');
          }
        }
      );


      if (result && result.success) {
        setCreationStatus('¡Grupo creado exitosamente!');

        showSuccess(
          `Grupo "${nombreGrupo}" creado con ${cantEquipos} equipos`,
          '¡Grupo creado!'
        );

        // Esperar 1.5 segundos para que el usuario vea el toast de éxito
        setTimeout(() => {
          setCreatingGroups(false);
          setCreationStatus('');

          // Limpiar formulario
          setNombreGrupo('');
          setCantidadEquipos('4');

          // Si hay callback, llamarlo
          if (onGroupsCreated) {
            onGroupsCreated();
          }

          // Volver a la pantalla anterior
          navigation.goBack();
        }, 1500);
      } else {
        setCreatingGroups(false);
        setCreationStatus('');
      }
    } catch (error) {
      setCreatingGroups(false);
      setCreationStatus('');
      showError('Error inesperado al crear el grupo', 'Error');
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              {/* Información de Configuración Existente */}
              {configuracionClasificacion && (
                <View style={styles.configInfo}>
                  <View style={styles.configHeader}>
                    <MaterialCommunityIcons name="information" size={20} color={colors.info} />
                    <Text style={styles.configTitle}>Reglas de Clasificación del Torneo</Text>
                  </View>
                  <View style={styles.configDetails}>
                    <Text style={styles.configText}>
                      • {configuracionClasificacion.equipos_oro} equipos clasifican a Oro (posiciones: {configuracionClasificacion.posiciones_oro})
                    </Text>
                    <Text style={styles.configText}>
                      • {configuracionClasificacion.equipos_plata} equipos clasifican a Plata (posiciones: {configuracionClasificacion.posiciones_plata})
                    </Text>
                    <Text style={styles.configText}>
                      • {configuracionClasificacion.equipos_bronce} equipos clasifican a Bronce (posiciones: {configuracionClasificacion.posiciones_bronce})
                    </Text>
                    {configuracionClasificacion.descripcion && (
                      <Text style={styles.configDescription}>
                        {configuracionClasificacion.descripcion}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Cantidad de Grupos */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cantidad de Grupos *</Text>
                <TextInput
                  style={styles.input}
                  value={cantidadGrupos}
                  onChangeText={setCantidadGrupos}
                  keyboardType="number-pad"
                  placeholder="Ej: 4"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              {/* Cantidad de Equipos por Grupo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Equipos por Grupo *</Text>
                <TextInput
                  style={styles.input}
                  value={cantidadEquiposPorGrupo}
                  onChangeText={setCantidadEquiposPorGrupo}
                  keyboardType="number-pad"
                  placeholder="Ej: 4"
                  placeholderTextColor={colors.textLight}
                />
                {configuracionClasificacion && (
                  <Text style={styles.helperText}>
                    Mínimo: {configuracionClasificacion.equipos_oro + configuracionClasificacion.equipos_plata + configuracionClasificacion.equipos_bronce + 1} equipos por grupo
                  </Text>
                )}
              </View>

              {/* Campos de Configuración (solo si NO existe configuración) */}
              {!configuracionClasificacion && (
                <>
                  <View style={styles.configSectionHeader}>
                    <MaterialCommunityIcons name="cog" size={20} color={colors.primary} />
                    <Text style={styles.configSectionTitle}>Configurar Reglas de Clasificación</Text>
                  </View>

                  {/* Equipos que Pasan a Oro */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Equipos que pasan a Oro *</Text>
                    <TextInput
                      style={styles.input}
                      value={equiposPasanOro}
                      onChangeText={setEquiposPasanOro}
                      keyboardType="number-pad"
                      placeholder="Ej: 2"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Equipos que Pasan a Plata */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Equipos que pasan a Plata *</Text>
                    <TextInput
                      style={styles.input}
                      value={equiposPasanPlata}
                      onChangeText={setEquiposPasanPlata}
                      keyboardType="number-pad"
                      placeholder="Ej: 1"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Equipos que Pasan a Bronce */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Equipos que pasan a Bronce *</Text>
                    <TextInput
                      style={styles.input}
                      value={equiposPasanBronce}
                      onChangeText={setEquiposPasanBronce}
                      keyboardType="number-pad"
                      placeholder="Ej: 0"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Posiciones Oro */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Posiciones Oro (separadas por coma) *</Text>
                    <TextInput
                      style={styles.input}
                      value={posicionesOro}
                      onChangeText={setPosicionesOro}
                      placeholder="Ej: 1,2"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Posiciones Plata */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Posiciones Plata (separadas por coma) *</Text>
                    <TextInput
                      style={styles.input}
                      value={posicionesPlata}
                      onChangeText={setPosicionesPlata}
                      placeholder="Ej: 3"
                      placeholderTextColor={colors.textLight}
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
                      placeholderTextColor={colors.textLight}
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
                      placeholderTextColor={colors.textLight}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </>
              )}
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
                disabled={creatingGroups}
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
              {/* Información de las Reglas del Torneo */}
              {configuracionClasificacion && (
                <View style={styles.configInfo}>
                  <View style={styles.configHeader}>
                    <MaterialCommunityIcons name="information" size={20} color={colors.info} />
                    <Text style={styles.configTitle}>Reglas de Clasificación del Torneo</Text>
                  </View>
                  <View style={styles.configDetails}>
                    <Text style={styles.configText}>
                      • {configuracionClasificacion.equipos_oro} equipos clasifican a Oro (posiciones: {configuracionClasificacion.posiciones_oro})
                    </Text>
                    <Text style={styles.configText}>
                      • {configuracionClasificacion.equipos_plata} equipos clasifican a Plata (posiciones: {configuracionClasificacion.posiciones_plata})
                    </Text>
                    <Text style={styles.configText}>
                      • {configuracionClasificacion.equipos_bronce} equipos clasifican a Bronce (posiciones: {configuracionClasificacion.posiciones_bronce})
                    </Text>
                    {configuracionClasificacion.descripcion && (
                      <Text style={styles.configDescription}>
                        {configuracionClasificacion.descripcion}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Nombre del Grupo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Grupo *</Text>
                <TextInput
                  style={styles.input}
                  value={nombreGrupo}
                  onChangeText={setNombreGrupo}
                  placeholder="Ej: Grupo A"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              {/* Cantidad de Equipos */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cantidad de Equipos *</Text>
                <TextInput
                  style={[
                    styles.input,
                    cantidadEquiposError && styles.inputError
                  ]}
                  value={cantidadEquipos}
                  onChangeText={handleCantidadEquiposChange}
                  keyboardType="number-pad"
                  placeholder="Ej: 4"
                  placeholderTextColor={colors.textLight}
                />
                {cantidadEquiposError ? (
                  <Text style={styles.errorText}>{cantidadEquiposError}</Text>
                ) : configuracionClasificacion ? (
                  <Text style={styles.helperText}>
                    Mínimo: {configuracionClasificacion.equipos_oro + configuracionClasificacion.equipos_plata + configuracionClasificacion.equipos_bronce + 1} equipos
                  </Text>
                ) : null}
              </View>

              {/* Campos de Configuración (solo si NO existe configuración) */}
              {!configuracionClasificacion && (
                <>
                  <View style={styles.configSectionHeader}>
                    <MaterialCommunityIcons name="cog" size={20} color={colors.primary} />
                    <Text style={styles.configSectionTitle}>Configurar Reglas de Clasificación</Text>
                  </View>

                  {/* Equipos que Pasan a Oro */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Equipos que pasan a Oro *</Text>
                    <TextInput
                      style={styles.input}
                      value={equiposPasanOro}
                      onChangeText={setEquiposPasanOro}
                      keyboardType="number-pad"
                      placeholder="Ej: 2"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Equipos que Pasan a Plata */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Equipos que pasan a Plata *</Text>
                    <TextInput
                      style={styles.input}
                      value={equiposPasanPlata}
                      onChangeText={setEquiposPasanPlata}
                      keyboardType="number-pad"
                      placeholder="Ej: 1"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Equipos que Pasan a Bronce */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Equipos que pasan a Bronce *</Text>
                    <TextInput
                      style={styles.input}
                      value={equiposPasanBronce}
                      onChangeText={setEquiposPasanBronce}
                      keyboardType="number-pad"
                      placeholder="Ej: 0"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Posiciones Oro */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Posiciones Oro (separadas por coma) *</Text>
                    <TextInput
                      style={styles.input}
                      value={posicionesOro}
                      onChangeText={setPosicionesOro}
                      placeholder="Ej: 1,2"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Posiciones Plata */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Posiciones Plata (separadas por coma) *</Text>
                    <TextInput
                      style={styles.input}
                      value={posicionesPlata}
                      onChangeText={setPosicionesPlata}
                      placeholder="Ej: 3"
                      placeholderTextColor={colors.textLight}
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
                      placeholderTextColor={colors.textLight}
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
                      placeholderTextColor={colors.textLight}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </>
              )}
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

      {/* Loading Overlay con estado de creación */}
      {creatingGroups && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{creationStatus}</Text>
            <Text style={styles.loadingSubtext}>
              Por favor espera, esto puede tomar unos momentos
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
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
  scrollContent: {
    paddingBottom: 40,
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
    paddingBottom: 40,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  // Estilos para información de configuración
  configInfo: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.info,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  configTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  configDetails: {
    gap: 8,
  },
  configText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  configDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
    fontWeight: '500',
  },
  configSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  configSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
