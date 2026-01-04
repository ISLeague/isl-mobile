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
import { GradientHeader, Card } from '../../components/common';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import api from '../../api';
import type { Equipo } from '../../api/types/equipos.types';
import type { Grupo, GrupoDetallado } from '../../api/types/grupos.types';
import type { Fase } from '../../api/types/fases.types';

interface MoveTeamToGroupScreenProps {
  navigation: any;
  route: any;
}

export const MoveTeamToGroupScreen: React.FC<MoveTeamToGroupScreenProps> = ({
  navigation,
  route,
}) => {
  const { equipo } = route.params as { equipo: Equipo };
  const { showSuccess, showError, showInfo } = useToast();

  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [movingStatus, setMovingStatus] = useState('');

  const [faseGrupos, setFaseGrupos] = useState<Fase | null>(null);
  const [grupos, setGrupos] = useState<GrupoDetallado[]>([]);
  const [grupoActual, setGrupoActual] = useState<GrupoDetallado | null>(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {

      // Cargar fases para obtener la fase de grupos
      const fasesResponse = await safeAsync(
        async () => {
          const response = await api.fases.list(equipo.id_edicion_categoria);
          return response;
        },
        'MoveTeamToGroup - loadFases',
        {
          fallbackValue: null,
          onError: (error) => {
            showError('No se pudieron cargar las fases', 'Error');
          }
        }
      );

      if (!fasesResponse || !fasesResponse.success || !fasesResponse.data) {
        showError('No se encontraron fases para esta categoría');
        setLoading(false);
        return;
      }

      // Buscar la fase de grupos
      const faseGruposEncontrada = fasesResponse.data.find(
        (fase: Fase) => fase.tipo === 'grupo'
      );

      if (!faseGruposEncontrada) {
        showError('No hay una fase de grupos configurada');
        setLoading(false);
        return;
      }

      setFaseGrupos(faseGruposEncontrada);

      // Cargar grupos de la fase
      const gruposResponse = await safeAsync(
        async () => {
          const response = await api.grupos.get(faseGruposEncontrada.id_fase);
          return response;
        },
        'MoveTeamToGroup - loadGrupos',
        {
          fallbackValue: null,
          onError: (error) => {
            showError('No se pudieron cargar los grupos', 'Error');
          }
        }
      );

      if (gruposResponse && gruposResponse.success && gruposResponse.data) {
        const gruposData = gruposResponse.data.grupos;
        setGrupos(gruposData);

        // Encontrar el grupo actual del equipo
        const grupoActualEncontrado = gruposData.find((grupo: GrupoDetallado) =>
          grupo.equipos.some(eq => eq.equipo.id_equipo === equipo.id_equipo)
        );

        if (grupoActualEncontrado) {
          setGrupoActual(grupoActualEncontrado);
        } else {
        }
      }

    } catch (error) {
      // console.error('Error loading data:', error);
      showError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToGroup = async () => {
    if (!grupoSeleccionado) {
      showError('Debes seleccionar un grupo de destino');
      return;
    }

    if (grupoActual && grupoSeleccionado === grupoActual.id_grupo) {
      showError('El equipo ya está en ese grupo');
      return;
    }

    const grupoDestino = grupos.find(g => g.id_grupo === grupoSeleccionado);
    if (!grupoDestino) {
      showError('Grupo de destino no encontrado');
      return;
    }

    try {
      setMoving(true);
      setMovingStatus(`Moviendo "${equipo.nombre}" a "${grupoDestino.nombre}"...`);


      // Paso 1: Si el equipo está en un grupo, obtener todos los equipos de ese grupo excepto el actual
      if (grupoActual) {
        setMovingStatus('Removiendo del grupo actual...');

        const equiposActualesSinEsteEquipo = grupoActual.equipos
          .filter(eq => eq.equipo.id_equipo !== equipo.id_equipo)
          .map(eq => eq.equipo.id_equipo);


        // Actualizar el grupo actual sin este equipo
        const removeResult = await safeAsync(
          async () => {
            const response = await api.grupos.asignarEquipos({
              id_grupo: grupoActual.id_grupo,
              equipos: equiposActualesSinEsteEquipo,
            });
            return response;
          },
          'MoveTeamToGroup - removeFromCurrentGroup',
          {
            fallbackValue: null,
            onError: (error) => {
              // console.error('Error al remover del grupo actual:', error);
              throw error;
            }
          }
        );

        if (!removeResult || !removeResult.success) {
          throw new Error('No se pudo remover el equipo del grupo actual');
        }

      }

      // Paso 2: Agregar el equipo al grupo destino
      setMovingStatus(`Agregando a "${grupoDestino.nombre}"...`);

      const equiposDestino = grupoDestino.equipos.map(eq => eq.equipo.id_equipo);
      equiposDestino.push(equipo.id_equipo);


      const addResult = await safeAsync(
        async () => {
          const response = await api.grupos.asignarEquipos({
            id_grupo: grupoSeleccionado,
            equipos: equiposDestino,
          });
          return response;
        },
        'MoveTeamToGroup - addToNewGroup',
        {
          fallbackValue: null,
          onError: (error) => {
            // console.error('Error al agregar al nuevo grupo:', error);
            throw error;
          }
        }
      );

      if (!addResult || !addResult.success) {
        throw new Error('No se pudo agregar el equipo al grupo destino');
      }


      showSuccess(
        `"${equipo.nombre}" movido exitosamente a "${grupoDestino.nombre}"`,
        '¡Éxito!'
      );

      // Volver a la pantalla anterior después de 1 segundo
      setTimeout(() => {
        setMoving(false);
        setMovingStatus('');
        navigation.goBack();
      }, 1000);

    } catch (error: any) {
      // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // console.error('❌ [MoveTeamToGroup] ERROR AL MOVER EQUIPO');
      // console.error('Error:', error);
      // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      setMoving(false);
      setMovingStatus('');
      showError(error.message || 'Error al mover el equipo', 'Error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <GradientHeader
          title="Mover Equipo"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando grupos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientHeader
        title="Mover Equipo de Grupo"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del equipo */}
        <Card style={styles.teamCard}>
          <View style={styles.teamHeader}>
            <MaterialCommunityIcons name="shield-account" size={32} color={colors.primary} />
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{equipo.nombre}</Text>
              {grupoActual ? (
                <Text style={styles.currentGroup}>
                  Grupo actual: {grupoActual.nombre}
                </Text>
              ) : (
                <Text style={styles.noGroup}>Sin grupo asignado</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Instrucciones */}
        <View style={styles.instructionsContainer}>
          <MaterialCommunityIcons name="information" size={20} color={colors.info} />
          <Text style={styles.instructionsText}>
            Selecciona el grupo al que deseas mover este equipo
          </Text>
        </View>

        {/* Lista de grupos disponibles */}
        <View style={styles.groupsContainer}>
          <Text style={styles.sectionTitle}>Grupos Disponibles</Text>

          {grupos.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="folder-open-outline"
                size={48}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>No hay grupos disponibles</Text>
            </Card>
          ) : (
            grupos.map((grupo) => {
              const isCurrentGroup = grupoActual?.id_grupo === grupo.id_grupo;
              const isSelected = grupoSeleccionado === grupo.id_grupo;

              return (
                <TouchableOpacity
                  key={grupo.id_grupo}
                  style={[
                    styles.groupCard,
                    isSelected && styles.groupCardSelected,
                    isCurrentGroup && styles.groupCardCurrent,
                  ]}
                  onPress={() => {
                    if (!isCurrentGroup) {
                      setGrupoSeleccionado(grupo.id_grupo);
                    }
                  }}
                  disabled={isCurrentGroup}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupCardContent}>
                    <View style={styles.groupCardLeft}>
                      <MaterialCommunityIcons
                        name={isCurrentGroup ? "check-circle" : "folder"}
                        size={24}
                        color={
                          isCurrentGroup
                            ? colors.success
                            : isSelected
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <View style={styles.groupInfo}>
                        <Text style={[
                          styles.groupName,
                          isSelected && styles.groupNameSelected
                        ]}>
                          {grupo.nombre}
                        </Text>
                        <Text style={styles.groupDetails}>
                          {grupo.equipos.length} / {grupo.cantidad_equipos} equipos
                        </Text>
                        {isCurrentGroup && (
                          <Text style={styles.currentLabel}>Grupo actual</Text>
                        )}
                      </View>
                    </View>

                    {isSelected && !isCurrentGroup && (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Botón de confirmar */}
      {grupoSeleccionado && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, moving && styles.confirmButtonDisabled]}
            onPress={handleMoveToGroup}
            disabled={moving}
            activeOpacity={0.7}
          >
            {moving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.white} />
                <Text style={styles.confirmButtonText}>Mover Equipo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay */}
      {moving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>{movingStatus}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  teamCard: {
    margin: 16,
    padding: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  currentGroup: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  noGroup: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  groupsContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  groupCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  groupCardCurrent: {
    backgroundColor: colors.backgroundGray,
    opacity: 0.6,
  },
  groupCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  groupNameSelected: {
    color: colors.primary,
  },
  groupDetails: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  currentLabel: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  bottomSpacing: {
    height: 20,
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
    zIndex: 9999,
  },
  loadingContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
