import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import * as DocumentPicker from 'expo-document-picker';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';

interface BulkCreateTeamsScreenProps {
  navigation: any;
  route: any;
}

export const BulkCreateTeamsScreen: React.FC<BulkCreateTeamsScreenProps> = ({
  navigation,
  route,
}) => {
  const { idEdicionCategoria, onTeamsCreated } = route.params;
  const { showSuccess, showError, showInfo } = useToast();

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setUploadResult(null);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showError('Por favor selecciona un archivo CSV', 'Archivo requerido');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('Procesando archivo CSV...');

      console.log('📊 [BulkCreateTeams] Iniciando importación de equipos');
      showInfo('Procesando archivo CSV...', 'Importando equipos');

      // Crear objeto File para la API
      const file = {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'text/csv',
        name: selectedFile.name,
      } as any;

      setUploadStatus('Creando equipos en el servidor...');
      const response = await api.equipos.createBulk(idEdicionCategoria, file);

      console.log('✅ [BulkCreateTeams] Respuesta del servidor:', response.data);

      setUploadResult(response.data);
      setUploadStatus('');

      if (response.data.failed === 0) {
        showSuccess(
          `Se crearon ${response.data.successful} equipos correctamente`,
          '¡Importación exitosa!'
        );

        setTimeout(() => {
          onTeamsCreated?.();
          navigation.goBack();
        }, 2000);
      } else {
        showError(
          `Exitosos: ${response.data.successful}, Fallidos: ${response.data.failed}`,
          'Importación completada con errores'
        );
      }
    } catch (error: any) {
      console.error('❌ [BulkCreateTeams] Error uploading CSV:', error);
      console.error('❌ [BulkCreateTeams] Error details:', error?.response?.data);

      const errorMessage =
        error?.response?.data?.message || 'No se pudo importar el archivo';

      showError(errorMessage, 'Error al importar');
      setUploadStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    Alert.alert(
      'Plantilla CSV',
      'La plantilla soporta dos formatos:\n\n' +
      'OPCIÓN 1: SOLO EQUIPOS (Cabeceras simples)\n' +
      'nombre, nombre_corto, logo\n\n' +
      'OPCIÓN 2: EQUIPOS Y JUGADORES (Formato avanzado)\n' +
      'EQUIPO: Nombre Equipo, Logo URL, Nombre Corto\n' +
      'JUGADOR: Nombre Completo, DNI, YYYY-MM-DD, Numero, Es Refuerzo (0/1), Es Capitan (0/1)\n\n' +
      'Ejemplo Opción 2:\n' +
      'EQUIPO: Real Madrid, https://logo.png, RMA\n' +
      'JUGADOR: Vinicius Jr, 12345678, 2000-07-12, 7, 0, 0\n' +
      'JUGADOR: Modric, 87654321, 1985-09-09, 10, 0, 1'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Importar Equipos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoBannerText}>
            Importa múltiples equipos a la vez desde un archivo CSV
          </Text>
        </View>

        {/* Instrucciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instrucciones</Text>
          <View style={styles.instructionsCard}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Descarga o consulta la plantilla CSV con el formato requerido
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                Completa el archivo con los datos de los equipos
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                Selecciona el archivo y haz click en "Importar Equipos"
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.templateButton}
            onPress={handleDownloadTemplate}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.templateButtonText}>Ver Formato de Plantilla</Text>
          </TouchableOpacity>
        </View>

        {/* Seleccionar Archivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Archivo CSV</Text>

          {selectedFile ? (
            <View style={styles.fileCard}>
              <MaterialCommunityIcons
                name="file-delimited"
                size={48}
                color={colors.success}
              />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => {
                  setSelectedFile(null);
                  setUploadResult(null);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectFileButton}
              onPress={handlePickFile}
            >
              <MaterialCommunityIcons
                name="file-upload"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.selectFileText}>Seleccionar Archivo CSV</Text>
              <Text style={styles.selectFileHint}>
                Toca para buscar un archivo en tu dispositivo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resultado de la Importación */}
        {uploadResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultado de la Importación</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Procesados:</Text>
                <Text style={styles.resultValue}>{uploadResult.total_processed}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Exitosos:</Text>
                <Text style={[styles.resultValue, styles.resultSuccess]}>
                  {uploadResult.successful}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Fallidos:</Text>
                <Text style={[styles.resultValue, styles.resultError]}>
                  {uploadResult.failed}
                </Text>
              </View>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <View style={styles.errorsSection}>
                  <Text style={styles.errorsTitle}>Errores:</Text>
                  {uploadResult.errors.map((error: string, index: number) => (
                    <Text key={index} style={styles.errorText}>
                      • {error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Botón de Importar */}
        {selectedFile && !uploadResult && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="upload"
                  size={24}
                  color={colors.white}
                />
                <Text style={styles.uploadButtonText}>Importar Equipos</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Loading Overlay con estado */}
      {isUploading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{uploadStatus}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  instructionsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  templateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  selectFileButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  selectFileText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  selectFileHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  removeFileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  resultSuccess: {
    color: colors.success,
  },
  resultError: {
    color: colors.error,
  },
  errorsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
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
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BulkCreateTeamsScreen;
