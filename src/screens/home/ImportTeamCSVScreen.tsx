import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { GradientHeader, Card } from '../../components/common';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import api from '../../api';
import type { Jugador } from '../../api/types/jugadores.types';

interface ImportTeamCSVScreenProps {
  navigation: any;
  route: any;
}

export const ImportTeamCSVScreen: React.FC<ImportTeamCSVScreenProps> = ({ navigation, route }) => {
  const { equipoId, equipoNombre } = route.params as { equipoId: number; equipoNombre: string };
  const { showSuccess, showError } = useToast();

  const [importingCSV, setImportingCSV] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [registrationResults, setRegistrationResults] = useState<{
    successful: number;
    failed: number;
    total: number;
    errors: Array<{ row: number; error: string }>;
    newPlayers: Jugador[];
  } | null>(null);

  // Limpiar comillas de los headers y valores (igual que BulkImport)
  const cleanValue = (val: string) => val.replace(/^["']|["']$/g, '').trim();

  const handleSelectCSV = async () => {
    console.log('📂 [TeamCSVImport] Abriendo DocumentPicker...');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('📂 [TeamCSVImport] DocumentPicker result:', result);

      if (result.canceled) {
        console.log('📂 [TeamCSVImport] Usuario canceló la selección');
        return;
      }

      const file = result.assets[0];
      console.log('📂 [TeamCSVImport] Archivo seleccionado:', file.name, 'URI:', file.uri);

      setImportingCSV(true);
      setImportStatus('Procesando archivo CSV...');

      // Read the file content (igual que BulkImport)
      console.log('📂 [TeamCSVImport] Leyendo contenido del archivo...');
      const response = await fetch(file.uri);
      const csvText = await response.text();
      console.log('📂 [TeamCSVImport] Contenido leído, longitud:', csvText.length);

      // Parse CSV (igual que BulkImport)
      const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
      console.log('📂 [TeamCSVImport] Líneas parseadas:', lines.length);

      if (lines.length < 2) {
        console.log('📂 [TeamCSVImport] Error: CSV vacío o sin datos');
        setImportingCSV(false);
        setImportStatus('');
        showError('El archivo CSV está vacío o no tiene el formato correcto');
        return;
      }

      // Parsear headers y rows (igual que BulkImport)
      const headers = lines[0].split(',').map(h => cleanValue(h));
      console.log('📂 [TeamCSVImport] Headers encontrados:', headers);

      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => cleanValue(v));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });
      console.log('📂 [TeamCSVImport] Filas parseadas:', rows.length);

      // Validate required fields (sin nombre_equipo)
      const requiredFields = ['nombre_completo', 'dni', 'fecha_nacimiento', 'es_refuerzo'];
      const missingFields = requiredFields.filter(f => !headers.includes(f));

      console.log('📂 [TeamCSVImport] Required fields:', requiredFields);
      console.log('📂 [TeamCSVImport] Found headers:', headers);
      console.log('📂 [TeamCSVImport] Missing fields:', missingFields);

      if (missingFields.length > 0) {
        console.log('📂 [TeamCSVImport] Error: Faltan columnas requeridas');
        setImportingCSV(false);
        setImportStatus('');
        Alert.alert(
          'Error en formato CSV',
          `El CSV debe incluir las columnas requeridas.\n\nColumnas faltantes:\n${missingFields.join(', ')}\n\nColumnas encontradas:\n${headers.join(', ')}`,
          [{ text: 'Entendido', style: 'default' }]
        );
        showError('El CSV no tiene el formato correcto', 'Formato Inválido');
        return;
      }

      console.log('📂 [TeamCSVImport] ✅ Validación pasada! Listo para enviar.');

      // Reconstruct CSV string with proper formatting
      const csvLines = [
        headers.join(','),
        ...rows.map(row => headers.map(h => {
          const val = row[h] || '';
          return val.includes(',') ? `"${val}"` : val;
        }).join(','))
      ];
      const reconstructedCSV = csvLines.join('\n');

      // Create file object
      const csvFile = {
        uri: 'data:text/csv;base64,' + btoa(unescape(encodeURIComponent(reconstructedCSV))),
        type: 'text/csv',
        name: file.name,
      } as any;

      console.log('📂 [TeamCSVImport] Enviando al servidor para equipoId:', equipoId);
      setImportStatus('Enviando datos al servidor...');

      // Upload CSV
      const uploadResult = await safeAsync(
        async () => {
          const apiResponse = await api.jugadores.createBulk(equipoId, csvFile);
          return apiResponse;
        },
        'importCSV',
        {
          severity: 'high',
          fallbackValue: null,
          onError: (error: any) => {
            if (error?.response) {
              const serverMessage = error.response.data?.message || error.response.data?.error;

              if (error.response.status === 400) {
                setImportingCSV(false);
                setImportStatus('');
                showError(
                  serverMessage || 'El archivo CSV no cumple con el formato requerido.',
                  'Formato de CSV Inválido'
                );
                return;
              }

              setImportingCSV(false);
              setImportStatus('');
              showError(
                serverMessage || 'Error al importar el archivo CSV',
                `Error (${error.response.status})`
              );
            } else if (error?.request) {
              setImportingCSV(false);
              setImportStatus('');
              showError('No se pudo conectar con el servidor', 'Error de Conexión');
            } else {
              setImportingCSV(false);
              setImportStatus('');
              showError('Error al importar el archivo CSV', 'Error');
            }
          }
        }
      );

      if (uploadResult && uploadResult.success) {
        const { total_processed, successful, failed, errors } = uploadResult.data;

        let newPlayers: Jugador[] = [];
        if (successful > 0) {
          setImportStatus('Recargando lista de jugadores...');

          const jugadoresResponse = await safeAsync(
            async () => {
              const response = await api.jugadores.list(equipoId);
              return response;
            },
            'ImportCSV - reloadPlayers',
            {
              fallbackValue: null,
              onError: () => {
                // Silent error
              }
            }
          );

          if (jugadoresResponse) {
            let newPlayersVal: Jugador[] = [];
            if (jugadoresResponse.data && Array.isArray(jugadoresResponse.data.jugadores)) {
              newPlayersVal = jugadoresResponse.data.jugadores;
            } else if (Array.isArray(jugadoresResponse.data)) {
              newPlayersVal = jugadoresResponse.data;
            } else if (jugadoresResponse.jugadores && Array.isArray(jugadoresResponse.jugadores)) {
              newPlayersVal = jugadoresResponse.jugadores;
            } else if (Array.isArray(jugadoresResponse)) {
              newPlayersVal = jugadoresResponse as unknown as Jugador[];
            }

            if (newPlayersVal.length > 0) {
              newPlayers = newPlayersVal;
            }
          }
        }

        // Hide loading
        setImportingCSV(false);
        setImportStatus('');

        // Show results modal
        setRegistrationResults({
          successful,
          failed,
          total: total_processed,
          errors: errors || [],
          newPlayers,
        });
        setShowResultsModal(true);
      } else {
        setImportingCSV(false);
        setImportStatus('');
      }
    } catch (error: any) {
      console.error('❌ [TeamCSVImport] Error:', error);
      setImportingCSV(false);
      setImportStatus('');
      showError('Error inesperado al procesar el archivo CSV', 'Error');
    }
  };

  const handleViewPlayers = () => {
    setShowResultsModal(false);
    setRegistrationResults(null);
    // Go back - parent screen will refresh on focus
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Importar Jugadores"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Importar CSV</Text>
          <Text style={styles.headerSubtitle}>Equipo: {equipoNombre}</Text>
        </View>

        {/* Format Info Card */}
        <Card style={styles.formatCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="information-outline" size={24} color={colors.info} />
            <Text style={styles.cardTitle}>Formato requerido</Text>
          </View>

          <Text style={styles.sectionLabel}>Columnas requeridas:</Text>
          <View style={styles.columnListCard}>
            <Text style={styles.columnItemText}>• nombre_completo (texto) *</Text>
            <Text style={styles.columnItemText}>• dni (texto, único por equipo) *</Text>
            <Text style={styles.columnItemText}>• fecha_nacimiento (DD/MM/YYYY) *</Text>
            <Text style={styles.columnItemText}>• es_refuerzo (si/no) *</Text>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Columnas opcionales:</Text>
          <View style={styles.columnListCard}>
            <Text style={styles.columnItemText}>• numero_camiseta (número 1-99, o "-" si no tiene)</Text>
            <Text style={styles.columnItemText}>• posicion (texto, opcional)</Text>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Ejemplo:</Text>
          <View style={styles.exampleBox}>
            <Text style={styles.exampleText}>nombre_completo,dni,fecha_nacimiento,es_refuerzo,numero_camiseta,posicion</Text>
            <Text style={styles.exampleText}>Juan Pérez,12345678,15/03/2000,no,10,Delantero</Text>
            <Text style={styles.exampleText}>María García,87654321,22/07/1999,si,-,Mediocampista</Text>
          </View>

          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="alert" size={20} color={colors.warning} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningText}>
                • Los DNI duplicados en el mismo equipo serán rechazados{'\n'}
                • Un jugador puede estar en varios equipos{'\n'}
                • Si no tiene número de camiseta, usa "-"{'\n'}
                • es_refuerzo debe ser "si" o "no"
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Select Button */}
      {!importingCSV && (
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectCSV}
            disabled={importingCSV}
          >
            <MaterialCommunityIcons name="file-upload" size={24} color={colors.white} />
            <Text style={styles.selectButtonText}>Seleccionar CSV</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Overlay */}
      {importingCSV && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{importStatus}</Text>
          </View>
        </View>
      )}

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowResultsModal(false);
          setRegistrationResults(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Importación Completada</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowResultsModal(false);
                    setRegistrationResults(null);
                  }}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <View style={styles.modalContent}>
                {/* Success/Error Summary */}
                <View style={styles.resultsHeader}>
                  {registrationResults && registrationResults.successful > 0 && (
                    <View style={styles.resultSuccessCard}>
                      <MaterialCommunityIcons name="check-circle" size={48} color={colors.success} />
                      <Text style={styles.resultSuccessNumber}>{registrationResults.successful}</Text>
                      <Text style={styles.resultSuccessLabel}>
                        {registrationResults.successful === 1 ? 'Jugador Agregado' : 'Jugadores Agregados'}
                      </Text>
                    </View>
                  )}

                  {registrationResults && registrationResults.failed > 0 && (
                    <View style={styles.resultErrorCard}>
                      <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
                      <Text style={styles.resultErrorNumber}>{registrationResults.failed}</Text>
                      <Text style={styles.resultErrorLabel}>
                        {registrationResults.failed === 1 ? 'Error' : 'Errores'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Error Details */}
                {registrationResults && registrationResults.errors.length > 0 && (
                  <View style={styles.errorsSection}>
                    <Text style={styles.errorsSectionTitle}>Detalles de Errores:</Text>
                    {registrationResults.errors.map((error, index) => (
                      <View key={index} style={styles.errorItem}>
                        <MaterialCommunityIcons name="alert" size={16} color={colors.error} />
                        <Text style={styles.errorItemText}>
                          Fila {error.row}: {error.error}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Success Message */}
                {registrationResults && registrationResults.successful > 0 && (
                  <View style={styles.successMessageCard}>
                    <MaterialCommunityIcons name="party-popper" size={24} color={colors.success} />
                    <Text style={styles.successMessageText}>
                      Se importaron exitosamente {registrationResults.successful} {registrationResults.successful === 1 ? 'jugador' : 'jugadores'} al equipo.
                    </Text>
                  </View>
                )}

                {/* Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowResultsModal(false);
                      setRegistrationResults(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleViewPlayers}
                  >
                    <MaterialCommunityIcons name="account-group" size={20} color={colors.white} />
                    <Text style={styles.confirmButtonText}>Ver Jugadores</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  formatCard: {
    margin: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  columnListCard: {
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  columnItemText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  exampleBox: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  exampleText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textPrimary,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginTop: 16,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 80,
  },
  bottomButtons: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  resultSuccessCard: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
  },
  resultSuccessNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
    marginTop: 8,
  },
  resultSuccessLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  resultErrorCard: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.error,
  },
  resultErrorNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.error,
    marginTop: 8,
  },
  resultErrorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  errorsSection: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 12,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    gap: 8,
  },
  errorItemText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  successMessageCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successMessageText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
