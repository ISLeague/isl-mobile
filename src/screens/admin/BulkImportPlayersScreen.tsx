import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { Button, GradientHeader, Card } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';
import type { Equipo } from '../../api/types/equipos.types';

interface BulkImportPlayersScreenProps {
  navigation: any;
  route: any;
}

export const BulkImportPlayersScreen: React.FC<BulkImportPlayersScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria } = route.params;
  const { showSuccess, showError, showInfo } = useToast();

  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [importing, setImporting] = useState(false);
  const [currentImportIndex, setCurrentImportIndex] = useState(0);
  const [totalTeamsToImport, setTotalTeamsToImport] = useState(0);
  const [importResults, setImportResults] = useState<Array<{
    equipoId: number;
    equipoNombre: string;
    success: boolean;
    successful: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }>>([]);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    loadEquipos();
  }, []);

  const loadEquipos = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        const response = await api.equipos.list(idEdicionCategoria);
        return response.data || [];
      },
      'loadEquipos',
      {
        fallbackValue: [],
        onError: () => showError('Error al cargar equipos'),
      }
    );
    setEquipos(result || []);
    setLoading(false);
  };

  const handleShowFormat = () => {
    setShowFormatModal(true);
  };

  const handleStartImportFromModal = async () => {
    // Close the format modal first
    setShowFormatModal(false);
    // Wait for modal to close before opening document picker
    await new Promise(resolve => setTimeout(resolve, 300));
    handleStartImport();
  };

  const handleStartImport = async () => {
    console.log('📂 [BulkImport] Iniciando selección de archivo...');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      console.log('📂 [BulkImport] DocumentPicker result:', result);

      if (result.canceled) {
        console.log('📂 [BulkImport] Usuario canceló la selección');
        return;
      }

      const file = result.assets[0];
      console.log('📂 [BulkImport] Archivo seleccionado:', file.name, 'URI:', file.uri);

      // Leer el contenido del archivo
      console.log('📂 [BulkImport] Leyendo contenido del archivo...');
      const response = await fetch(file.uri);
      const csvText = await response.text();
      console.log('📂 [BulkImport] Contenido leído, longitud:', csvText.length);

      // Parse CSV
      const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
      console.log('📂 [BulkImport] Líneas parseadas:', lines.length);

      if (lines.length < 2) {
        console.log('📂 [BulkImport] Error: CSV vacío o sin datos');
        showError('El archivo CSV está vacío o no tiene el formato correcto');
        return;
      }

      // Limpiar comillas de los headers y valores
      const cleanValue = (val: string) => val.replace(/^["']|["']$/g, '').trim();

      const headers = lines[0].split(',').map(h => cleanValue(h));
      console.log('📂 [BulkImport] Headers encontrados:', headers);

      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => cleanValue(v));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });
      console.log('📂 [BulkImport] Filas parseadas:', rows.length);

      // Validar columna nombre_equipo
      if (!headers.includes('nombre_equipo')) {
        console.log('📂 [BulkImport] Error: Falta columna nombre_equipo. Headers:', headers);
        Alert.alert(
          'Error en formato CSV',
          `El CSV debe incluir la columna "nombre_equipo".\n\nColumnas encontradas:\n${headers.join(', ')}`,
          [{ text: 'Entendido', style: 'default' }]
        );
        showError('El CSV debe incluir la columna "nombre_equipo"');
        return;
      }

      // Obtener nombres únicos de equipos del CSV
      const uniqueTeamNames = [...new Set(rows.map(row => row.nombre_equipo).filter(Boolean))];
      console.log('📂 [BulkImport] Equipos únicos en CSV:', uniqueTeamNames);

      if (uniqueTeamNames.length === 0) {
        console.log('📂 [BulkImport] Error: No se encontraron nombres de equipo');
        showError('No se encontraron nombres de equipo válidos en el CSV');
        return;
      }

      // Hacer match con equipos existentes
      const matchedTeams: Array<{ equipo: Equipo; rows: any[] }> = [];
      const unmatchedTeams: string[] = [];

      console.log('📂 [BulkImport] Equipos registrados para matching:', equipos.map(e => e.nombre));

      for (const teamName of uniqueTeamNames) {
        const equipo = equipos.find(e =>
          e.nombre.toLowerCase() === teamName.toLowerCase() ||
          e.nombre_corto?.toLowerCase() === teamName.toLowerCase()
        );
        if (equipo) {
          const teamRows = rows.filter(row => row.nombre_equipo === teamName);
          matchedTeams.push({ equipo, rows: teamRows });
          console.log(`📂 [BulkImport] Match encontrado: "${teamName}" -> "${equipo.nombre}" (${teamRows.length} jugadores)`);
        } else {
          unmatchedTeams.push(teamName);
          console.log(`📂 [BulkImport] Sin match: "${teamName}"`);
        }
      }

      console.log('📂 [BulkImport] Resumen: matched:', matchedTeams.length, 'unmatched:', unmatchedTeams.length);

      if (unmatchedTeams.length > 0) {
        Alert.alert(
          'Equipos no encontrados',
          `Los siguientes equipos del CSV no coinciden con ningún equipo registrado:\n\n${unmatchedTeams.join('\n')}\n\n¿Deseas continuar con los equipos que sí coinciden (${matchedTeams.length})?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Continuar',
              onPress: () => processImport(matchedTeams, headers),
            },
          ]
        );
      } else {
        processImport(matchedTeams, headers);
      }
    } catch (error: any) {
      console.error('❌ [BulkImport] Error en proceso de importación:', error);
      console.error('❌ [BulkImport] Error message:', error?.message);
      console.error('❌ [BulkImport] Error stack:', error?.stack);
      showError('Error al procesar el archivo CSV');
    }
  };

  const processImport = async (matchedTeams: Array<{ equipo: Equipo; rows: any[] }>, headers: string[]) => {
    if (matchedTeams.length === 0) {
      showError('No hay equipos para importar');
      return;
    }

    setImporting(true);
    setCurrentImportIndex(0);
    setTotalTeamsToImport(matchedTeams.length);
    setImportResults([]);

    for (let i = 0; i < matchedTeams.length; i++) {
      const { equipo, rows: equipoRows } = matchedTeams[i];
      setCurrentImportIndex(i + 1);

      // Generar CSV para este equipo (sin la columna nombre_equipo)
      const teamHeaders = headers.filter(h => h !== 'nombre_equipo');
      const teamLines = [
        teamHeaders.join(','),
        ...equipoRows.map(row => teamHeaders.map(h => row[h]).join(','))
      ];
      const teamCsvString = teamLines.join('\n');

      const teamCsvFile = {
        uri: 'data:text/csv;base64,' + btoa(unescape(encodeURIComponent(teamCsvString))),
        type: 'text/csv',
        name: `${equipo.nombre}_import.csv`,
      } as any;

      const uploadResult = await safeAsync(
        async () => {
          const apiResponse = await api.jugadores.createBulk(equipo.id_equipo, teamCsvFile);
          return apiResponse;
        },
        'importCSV',
        { fallbackValue: null }
      );

      if (uploadResult && uploadResult.success) {
        const { successful, failed, errors } = uploadResult.data;
        setImportResults(prev => [...prev, {
          equipoId: equipo.id_equipo,
          equipoNombre: equipo.nombre,
          success: true,
          successful: successful || 0,
          failed: failed || 0,
          errors: errors || [],
        }]);
      } else {
        setImportResults(prev => [...prev, {
          equipoId: equipo.id_equipo,
          equipoNombre: equipo.nombre,
          success: false,
          successful: 0,
          failed: 0,
          errors: [{ row: 0, error: 'Error al procesar este equipo' }],
        }]);
      }
    }

    setImporting(false);
    setShowResultsModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <GradientHeader
          title="Importación Masiva"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando equipos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Importación Masiva"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="information-outline" size={24} color={colors.info} />
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          </View>
          <Text style={styles.infoText}>
            1. Prepara UN SOLO archivo CSV con todos los jugadores{'\n'}
            2. El CSV debe tener "nombre_equipo" como primera columna{'\n'}
            3. El nombre del equipo debe coincidir exactamente con los registrados{'\n'}
            4. Presiona "Iniciar Importación" y selecciona el archivo
          </Text>
        </Card>

        {/* Equipos disponibles */}
        <Card style={styles.equiposCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="shield-check" size={24} color={colors.success} />
            <Text style={styles.infoTitle}>Equipos registrados ({equipos.length})</Text>
          </View>
          <Text style={styles.equiposHint}>
            El CSV buscará coincidencias con estos nombres:
          </Text>
          <View style={styles.equiposChipsContainer}>
            {equipos.map((equipo) => (
              <View key={equipo.id_equipo} style={styles.equipoChip}>
                <Text style={styles.equipoChipText}>{equipo.nombre}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      {!importing && (
        <View style={styles.bottomButtons}>
          <Button
            title="Ver Formato CSV"
            onPress={handleShowFormat}
            variant="secondary"
            style={styles.buttonHalf}
          />
          <Button
            title="Iniciar Importación"
            onPress={handleStartImport}
            style={styles.buttonHalf}
          />
        </View>
      )}

      {/* Importing Progress */}
      {importing && (
        <View style={styles.importingOverlay}>
          <View style={styles.importingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.importingTitle}>Importando Jugadores</Text>
            <Text style={styles.importingText}>
              Equipo {currentImportIndex} de {totalTeamsToImport}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${totalTeamsToImport > 0 ? (currentImportIndex / totalTeamsToImport) * 100 : 0}%` },
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* CSV Format Modal */}
      <Modal
        visible={showFormatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFormatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Formato del CSV</Text>
              <TouchableOpacity onPress={() => setShowFormatModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.formatTitle}>Columnas requeridas:</Text>
              <View style={styles.formatList}>
                <Text style={styles.formatItem}>• nombre_equipo (debe coincidir exactamente) *</Text>
                <Text style={styles.formatItem}>• nombre_completo (texto) *</Text>
                <Text style={styles.formatItem}>• dni (texto, único por equipo) *</Text>
                <Text style={styles.formatItem}>• fecha_nacimiento (DD/MM/YYYY) *</Text>
                <Text style={styles.formatItem}>• es_refuerzo (si/no) *</Text>
              </View>

              <Text style={styles.formatTitle}>Columnas opcionales:</Text>
              <View style={styles.formatList}>
                <Text style={styles.formatItem}>• numero_camiseta (número 1-99, o "-" si no tiene)</Text>
                <Text style={styles.formatItem}>• posicion (texto, opcional)</Text>
              </View>

              <Text style={styles.formatTitle}>Ejemplo:</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>nombre_equipo,nombre_completo,dni,fecha_nacimiento,es_refuerzo,numero_camiseta,posicion</Text>
                <Text style={styles.codeText}>Real Madrid,Juan Pérez,12345678,15/03/2000,no,10,Delantero</Text>
                <Text style={styles.codeText}>Barcelona,María García,87654321,22/07/1999,si,-,Mediocampista</Text>
              </View>

              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="alert" size={20} color={colors.warning} />
                <Text style={styles.warningText}>
                  Importante:{'\n'}
                  • Los DNI duplicados en el mismo equipo serán rechazados{'\n'}
                  • Un jugador puede estar en varios equipos{'\n'}
                  • Si no tiene número de camiseta, usa "-"{'\n'}
                  • es_refuerzo debe ser "si" o "no"
                </Text>
              </View>
            </ScrollView>

            <Button
              title="Entendido, Iniciar"
              onPress={handleStartImportFromModal}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resultados de Importación</Text>
              <TouchableOpacity onPress={() => setShowResultsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {importResults.map((result, index) => (
                <View
                  key={index}
                  style={[
                    styles.resultCard,
                    result.success ? styles.resultCardSuccess : styles.resultCardError,
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <MaterialCommunityIcons
                      name={result.success ? 'check-circle' : 'alert-circle'}
                      size={24}
                      color={result.success ? colors.success : colors.error}
                    />
                    <Text style={styles.resultEquipoNombre}>{result.equipoNombre}</Text>
                  </View>
                  <Text style={styles.resultText}>
                    Exitosos: {result.successful} | Fallidos: {result.failed}
                  </Text>
                  {result.errors.length > 0 && (
                    <View style={styles.errorsContainer}>
                      <Text style={styles.errorsTitle}>Errores:</Text>
                      {result.errors.slice(0, 3).map((error, idx) => (
                        <Text key={idx} style={styles.errorText}>
                          • Fila {error.row}: {error.error}
                        </Text>
                      ))}
                      {result.errors.length > 3 && (
                        <Text style={styles.moreErrorsText}>
                          ... y {result.errors.length - 3} error(es) más
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <Button
              title="Cerrar"
              onPress={() => {
                setShowResultsModal(false);
                setImportResults([]);
              }}
              style={styles.modalButton}
            />
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  equiposCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  equiposHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  equiposChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipoChip: {
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipoChipText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  equiposList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  equipoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  equipoCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  equipoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipoTextContainer: {
    flex: 1,
  },
  equipoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  equipoNombreCorto: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  buttonHalf: {
    flex: 1,
  },
  importingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importingCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    width: '80%',
  },
  importingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  importingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  formatList: {
    gap: 8,
    marginBottom: 16,
  },
  formatItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
  },
  modalButton: {
    marginTop: 16,
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  resultCardSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.success,
  },
  resultCardError: {
    backgroundColor: '#FFEBEE',
    borderColor: colors.error,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  resultEquipoNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  errorsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    lineHeight: 18,
  },
  moreErrorsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
