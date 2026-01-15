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
  const [selectedEquipos, setSelectedEquipos] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [currentImportIndex, setCurrentImportIndex] = useState(0);
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const toggleEquipo = (equipoId: number) => {
    setSelectedEquipos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(equipoId)) {
        newSet.delete(equipoId);
      } else {
        newSet.add(equipoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedEquipos.size === filteredEquipos.length) {
      setSelectedEquipos(new Set());
    } else {
      setSelectedEquipos(new Set(filteredEquipos.map(e => e.id_equipo)));
    }
  };

  const handleShowFormat = () => {
    setShowFormatModal(true);
  };

  const handleStartImport = async () => {
    if (selectedEquipos.size === 0) {
      showError('Selecciona al menos un equipo');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const csvText = await response.text();

      setImporting(true);
      setCurrentImportIndex(0);
      setImportResults([]);

      const selectedEquiposList = equipos.filter(e => selectedEquipos.has(e.id_equipo));

      // Parse CSV
      const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        showError('El archivo CSV está vacío o no tiene el formato correcto');
        setImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });

      // Validar columna nombre_equipo
      if (!headers.includes('nombre_equipo')) {
        showError('El CSV debe incluir la columna "nombre_equipo"');
        setImporting(false);
        return;
      }

      for (let i = 0; i < selectedEquiposList.length; i++) {
        const equipo = selectedEquiposList[i];
        setCurrentImportIndex(i + 1);

        // Filtrar filas para este equipo
        const equipoRows = rows.filter(row => row.nombre_equipo === equipo.nombre);

        if (equipoRows.length === 0) {
          setImportResults(prev => [...prev, {
            equipoId: equipo.id_equipo,
            equipoNombre: equipo.nombre,
            success: false,
            successful: 0,
            failed: 0,
            errors: [{ row: 0, error: 'No se encontraron jugadores para este equipo en el CSV' }],
          }]);
          continue;
        }

        // Generar CSV para este equipo (sin la columna nombre_equipo y arreglando el header de nombre completo)
        // El usuario reportó que el backend pide "nombre completo"
        const teamHeaders = headers.filter(h => h !== 'nombre_equipo');
        const teamLines = [
          teamHeaders.map(h => h === 'nombre_completo' ? 'nombre completo' : h).join(','),
          ...equipoRows.map(row => teamHeaders.map(h => row[h]).join(','))
        ];
        const teamCsvString = teamLines.join('\n');

        // En React Native, para enviar como archivo, podemos usar un Blob si está disponible o enviarlo como string si el backend lo acepta
        // Pero api.jugadores.createBulk espera un objeto tipo archivo para FormData.
        // Vamos a intentar enviarlo convirtiendo el string a una simulación de archivo.
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
    } catch (error) {
      console.error('Error in import process:', error);
      showError('Error al procesar el archivo CSV');
      setImporting(false);
    }
  };



  const filteredEquipos = equipos.filter((equipo) =>
    equipo.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        title="Importación Masiva de Jugadores"
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
            1. Selecciona los equipos que quieres importar{'\n'}
            2. Presiona "Iniciar Importación" y selecciona UN SOLO archivo CSV con todos los jugadores{'\n'}
            3. El CSV debe tener la columna "nombre_equipo" para asignar cada jugador{'\n'}
            4. Revisa los resultados al final
          </Text>
        </Card>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar equipos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Select All Button */}
        <View style={styles.selectAllContainer}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAll}
          >
            <MaterialCommunityIcons
              name={selectedEquipos.size === filteredEquipos.length ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={colors.primary}
            />
            <Text style={styles.selectAllText}>
              {selectedEquipos.size === filteredEquipos.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>
            {selectedEquipos.size} seleccionado{selectedEquipos.size !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Equipos List */}
        <View style={styles.equiposList}>
          {filteredEquipos.map((equipo) => {
            const isSelected = selectedEquipos.has(equipo.id_equipo);
            return (
              <TouchableOpacity
                key={equipo.id_equipo}
                style={[styles.equipoCard, isSelected && styles.equipoCardSelected]}
                onPress={() => toggleEquipo(equipo.id_equipo)}
                activeOpacity={0.7}
              >
                <View style={styles.equipoInfo}>
                  <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={28}
                    color={isSelected ? colors.primary : colors.textLight}
                  />
                  <View style={styles.equipoTextContainer}>
                    <Text style={styles.equipoNombre}>{equipo.nombre}</Text>
                    {equipo.nombre_corto && (
                      <Text style={styles.equipoNombreCorto}>{equipo.nombre_corto}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredEquipos.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-search" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>No se encontraron equipos</Text>
          </View>
        )}

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
            title={`Iniciar Importación (${selectedEquipos.size})`}
            onPress={handleStartImport}
            disabled={selectedEquipos.size === 0}
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
              Equipo {currentImportIndex} de {selectedEquipos.size}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentImportIndex / selectedEquipos.size) * 100}%` },
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
                <Text style={styles.formatItem}>• dni (texto, único) *</Text>
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
                  • Los DNI duplicados serán rechazados{'\n'}
                  • Si no tiene número de camiseta, usa "-"{'\n'}
                  • es_refuerzo debe ser "si" o "no"
                </Text>
              </View>
            </ScrollView>

            <Button
              title="Entendido, Iniciar"
              onPress={handleStartImport}
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
                setSelectedEquipos(new Set());
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
