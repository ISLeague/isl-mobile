import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { Equipo } from '../../api/types';
import { safeAsync } from '../../utils/errorHandling';
import api from '../../api';

export const ManageTeamsScreen = ({ navigation, route }: any) => {
  const { torneo } = route.params;
  const { showSuccess, showError, showWarning } = useToast();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  // Filtrar equipos por búsqueda
  const equiposFiltrados = equipos.filter(equipo =>
    equipo.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (equipo.nombre_corto && equipo.nombre_corto.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Load equipos with refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadEquipos();
    }, [route.params?.idEdicionCategoria, torneo?.id_edicion_categoria])
  );

  const loadEquipos = async () => {
    const result = await safeAsync(
      async () => {
        const idEdicionCategoria = route.params?.idEdicionCategoria || torneo?.id_edicion_categoria;
        if (!idEdicionCategoria) {
          return [];
        }
        const equiposResponse = await api.equipos.list(idEdicionCategoria);
        return equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];
      },
      'ManageTeamsScreen - loadEquipos',
      { fallbackValue: [] }
    );

    if (result) {
      setEquipos(result);
    }
    setLoading(false);
  };


  const handleEditTeam = (equipo: Equipo) => {
    navigation.navigate('EditTeam', { equipo });
  };

  const handleDeleteTeam = async (equipo: Equipo) => {
    Alert.alert(
      'Eliminar Equipo',
      `¿Estás seguro de eliminar "${equipo.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await safeAsync(
              async () => {
                await api.equipos.delete(equipo.id_equipo);
                setEquipos(equipos.filter(e => e.id_equipo !== equipo.id_equipo));
                return true;
              },
              'deleteTeam',
              {
                severity: 'medium',
                fallbackValue: false,
                onError: (error) => {
                  showError('No se pudo eliminar el equipo', 'Error');
                }
              }
            );

            if (success) {
              showSuccess(`${equipo.nombre} ha sido eliminado`, 'Equipo eliminado');
            }
          },
        },
      ]
    );
  };

  const handleImportCSV = (equipo: Equipo) => {
    Alert.alert(
      'Formato del Archivo CSV',
      'El archivo CSV debe tener las siguientes columnas (el orden de columnas no importa si usas cabeceras correctas):\n\n' +
      '1. nombre_completo\n' +
      '2. dni\n' +
      '3. fecha_nacimiento (YYYY-MM-DD)\n' +
      '4. numero_camiseta\n' +
      '5. pie_dominante (opcional: derecho, izquierdo, ambidiestro)\n' +
      '6. es_refuerzo (0 o 1)\n' +
      '7. es_capitan (0 o 1)\n\n' +
      'Ejemplo:\n' +
      'nombre_completo,dni,fecha_nacimiento,numero_camiseta,pie_dominante,es_refuerzo,es_capitan\n' +
      'Juan Pérez,12345678,2000-05-15,10,derecho,0,0\n\n' +
      '¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Seleccionar CSV',
          onPress: async () => {
            try {
              // Pick CSV file from device
              const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
                copyToCacheDirectory: true,
              });

              if (result.canceled) {
                return;
              }

              const file = result.assets[0];

              // Show confirmation with filename
              Alert.alert(
                'Confirmar Importación',
                `Archivo seleccionado:\n${file.name}\n\n¿Deseas importar los jugadores de este archivo?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Importar',
                    onPress: async () => {
                      try {
                        // Create file object in React Native format
                        const csvFile = {
                          uri: file.uri,
                          type: 'text/csv',
                          name: file.name,
                        } as any;

                        // Upload CSV
                        const uploadResult = await safeAsync(
                          async () => {
                            const apiResponse = await api.jugadores.createBulk(equipo.id_equipo, csvFile);
                            return apiResponse;
                          },
                          'importCSV',
                          {
                            severity: 'high',
                            fallbackValue: null,
                            onError: () => {
                              showError('Error al importar el archivo CSV', 'Error');
                            }
                          }
                        );

                        if (uploadResult && uploadResult.success) {
                          const { total_processed, successful, failed, errors } = uploadResult.data;

                          if (failed > 0) {
                            // Show errors
                            const errorMessages = errors.map((e: any) =>
                              `Fila ${e.row}: ${e.error}`
                            ).join('\n');

                            Alert.alert(
                              'Importación completada con errores',
                              `Total procesados: ${total_processed}\nExitosos: ${successful}\nFallidos: ${failed}\n\nErrores:\n${errorMessages}`,
                              [{ text: 'OK' }]
                            );
                          } else {
                            showSuccess(
                              `${successful} jugadores importados correctamente para ${equipo.nombre}`,
                              '¡Éxito!'
                            );
                          }

                          // Reload equipos to update the list
                          // (Optional: you might want to navigate to team details to see the new players)
                        }
                      } catch (error) {
                        // console.error('Error uploading CSV:', error);
                        showError('Error al importar el archivo', 'Error');
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              // console.error('Error picking CSV:', error);
              showError('Error al seleccionar el archivo', 'Error');
            }
          }
        }
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
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Gestionar Equipos</Text>
          <Text style={styles.subtitle}>{torneo.nombre}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar equipo..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowChoiceModal(true)}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Nuevo Equipo</Text>
          </TouchableOpacity>
        </View>

        {/* Teams List */}
        <View style={styles.teamsSection}>
          <Text style={styles.sectionTitle}>
            Equipos ({equiposFiltrados.length}{searchQuery ? ` de ${equipos.length}` : ''})
          </Text>

          {equiposFiltrados.length === 0 && searchQuery ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No se encontraron equipos con "{searchQuery}"
              </Text>
            </View>
          ) : null}

          {equiposFiltrados.map((equipo) => (
            <View key={equipo.id_equipo} style={styles.teamCard}>
              <View style={styles.teamIcon}>
                <Text style={styles.teamLogo}>{equipo.logo}</Text>
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{equipo.nombre}</Text>
                <Text style={styles.teamSubtitle}>Ver jugadores →</Text>
              </View>
              <View style={styles.teamActions}>
                <TouchableOpacity
                  style={styles.actionIconButton}
                  onPress={() => handleImportCSV(equipo)}
                >
                  <Text style={styles.actionIconText}>📥</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIconButton}
                  onPress={() => handleEditTeam(equipo)}
                >
                  <Text style={styles.actionIconText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIconButton}
                  onPress={() => handleDeleteTeam(equipo)}
                >
                  <Text style={styles.actionIconText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Tipo de creación Modal */}
      <Modal
        visible={showChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Nuevo Equipo</Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { marginBottom: 12 }]}
              onPress={() => {
                setShowChoiceModal(false);
                navigation.navigate('CreateTeam', {
                  idEdicionCategoria: route.params?.idEdicionCategoria || torneo?.id_edicion_categoria,
                  onTeamCreated: () => loadEquipos()
                });
              }}
            >
              <Text style={styles.confirmButtonText}>Crear Manualmente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => {
                setShowChoiceModal(false);
                navigation.navigate('SelectMasterTeams', {
                  idEdicionCategoria: route.params?.idEdicionCategoria || torneo?.id_edicion_categoria,
                  onTeamsAdded: () => loadEquipos()
                });
              }}
            >
              <Text style={styles.confirmButtonText}>Seleccionar Existente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { marginTop: 12 }]}
              onPress={() => setShowChoiceModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAction: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
    color: colors.white,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryText: {
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearSearchButton: {
    padding: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: colors.textLight,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  teamsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamLogo: {
    fontSize: 24,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  teamSubtitle: {
    fontSize: 13,
    color: colors.primary,
  },
  teamActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
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
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundGray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default ManageTeamsScreen;