import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { Partido } from '../../api/types';
import { mockEquipos } from '../../data/mockData';
import { formatDate } from '../../utils/formatters';

// Watermark asset
const WATERMARK_URI = require('../../assets/watermark.png');

interface PreviewImage {
  id: string;
  originalUri: string;
  processedUri?: string;
  isProcessing: boolean;
}

interface LoadPhotosScreenProps {
  navigation: any;
  route: any;
}

export const LoadPhotosScreen: React.FC<LoadPhotosScreenProps> = ({ navigation, route }) => {
  const { partido } = route.params as { partido: Partido };
  const { showSuccess, showError, showInfo } = useToast();
  
  const [linkCompra, setLinkCompra] = useState(partido.link_fotos || '');
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const equipoLocal = mockEquipos.find(e => e.id_equipo === partido.id_equipo_local);
  const equipoVisitante = mockEquipos.find(e => e.id_equipo === partido.id_equipo_visitante);

  const MAX_PREVIEW_IMAGES = 5;

  // Función para aplicar watermark a una imagen
  const applyWatermark = async (imageUri: string): Promise<string> => {
    try {
      // Redimensionar imagen a 1920px de ancho manteniendo proporción
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1920 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Nota: expo-image-manipulator no soporta directamente overlay de watermark
      // En producción, esto se haría en el backend con Python/PIL
      // Por ahora retornamos la imagen redimensionada
      // El watermark se aplicará en el servidor cuando se suba a Supabase
      
      console.log('📸 Imagen procesada:', manipulatedImage.uri);
      console.log('   - Dimensiones: Se aplicará watermark en servidor');
      
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error procesando imagen:', error);
      throw error;
    }
  };

  // Seleccionar imágenes para preview
  const handleSelectImages = async () => {
    if (previewImages.length >= MAX_PREVIEW_IMAGES) {
      showError(`Máximo ${MAX_PREVIEW_IMAGES} imágenes de preview`);
      return;
    }

    const remainingSlots = MAX_PREVIEW_IMAGES - previewImages.length;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Se necesita permiso para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsProcessing(true);
        
        const newImages: PreviewImage[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}-${index}`,
          originalUri: asset.uri,
          isProcessing: true,
        }));

        setPreviewImages(prev => [...prev, ...newImages]);

        // Procesar cada imagen con watermark
        for (const img of newImages) {
          try {
            const processedUri = await applyWatermark(img.originalUri);
            
            setPreviewImages(prev => 
              prev.map(p => 
                p.id === img.id 
                  ? { ...p, processedUri, isProcessing: false }
                  : p
              )
            );
          } catch (error) {
            console.error('Error procesando imagen:', error);
            setPreviewImages(prev => 
              prev.map(p => 
                p.id === img.id 
                  ? { ...p, isProcessing: false }
                  : p
              )
            );
          }
        }

        setIsProcessing(false);
        showInfo(`${newImages.length} imagen(es) agregada(s)`);
      }
    } catch (error) {
      console.error('Error seleccionando imágenes:', error);
      showError('Error al seleccionar imágenes');
      setIsProcessing(false);
    }
  };

  // Eliminar imagen de preview
  const handleRemoveImage = (imageId: string) => {
    setPreviewImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Subir imágenes a Supabase (simulado por ahora)
  const uploadToSupabase = async (images: PreviewImage[]): Promise<string[]> => {
    // TODO: Implementar subida real a Supabase
    console.log('📤 Subiendo imágenes a Supabase...');
    
    const uploadedUrls: string[] = [];
    
    for (const img of images) {
      if (img.processedUri) {
        // Simular subida
        console.log(`   - Subiendo: ${img.id}`);
        // En producción:
        // const { data, error } = await supabase.storage
        //   .from('match-photos')
        //   .upload(`${partido.id_partido}/${img.id}.jpg`, file);
        
        // Por ahora, simular URL
        const fakeUrl = `https://supabase.co/storage/match-photos/${partido.id_partido}/${img.id}.jpg`;
        uploadedUrls.push(fakeUrl);
      }
    }
    
    console.log('✅ Imágenes subidas:', uploadedUrls.length);
    return uploadedUrls;
  };

  const handleSave = async () => {
    // Validar que haya al menos algo para guardar
    if (previewImages.length === 0 && !linkCompra.trim()) {
      showError('Agrega al menos una imagen de preview o un enlace de compra');
      return;
    }

    // Validar URL del enlace de compra si se proporciona
    if (linkCompra.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
      if (!urlPattern.test(linkCompra.trim())) {
        showError('El enlace de compra no parece ser una URL válida');
        return;
      }
    }

    // Verificar que todas las imágenes están procesadas
    const pendingImages = previewImages.filter(img => img.isProcessing);
    if (pendingImages.length > 0) {
      showError('Espera a que todas las imágenes se procesen');
      return;
    }

    setIsSaving(true);
    try {
      // Subir imágenes a Supabase
      let previewUrls: string[] = [];
      if (previewImages.length > 0) {
        previewUrls = await uploadToSupabase(previewImages);
      }

      // TODO: Llamar API para guardar datos del partido
      // await mockApi.partidos.updatePhotos(partido.id_partido, {
      //   preview_images: previewUrls,
      //   link_compra: linkCompra.trim(),
      // });
      
      console.log('💾 Guardando datos del partido:', {
        id_partido: partido.id_partido,
        preview_images: previewUrls,
        link_compra: linkCompra.trim(),
      });
      
      showSuccess('Fotos guardadas exitosamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando fotos:', error);
      showError('Error al guardar las fotos');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLink = () => {
    setLinkCompra('');
  };

  const handlePreviewLink = () => {
    if (linkCompra.trim()) {
      Linking.openURL(linkCompra.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Cargar Fotos</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Info del partido */}
        <View style={styles.partidoInfo}>
          <View style={styles.equiposRow}>
            <View style={styles.equipoContainer}>
              <Image
                source={equipoLocal?.logo ? { uri: equipoLocal.logo } : require('../../assets/InterLOGO.png')}
                style={styles.equipoLogo}
                resizeMode="contain"
              />
              <Text style={styles.equipoNombre} numberOfLines={2}>
                {equipoLocal?.nombre || 'Equipo Local'}
              </Text>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.fechaText}>{formatDate(partido.fecha)}</Text>
            </View>

            <View style={styles.equipoContainer}>
              <Image
                source={equipoVisitante?.logo ? { uri: equipoVisitante.logo } : require('../../assets/InterLOGO.png')}
                style={styles.equipoLogo}
                resizeMode="contain"
              />
              <Text style={styles.equipoNombre} numberOfLines={2}>
                {equipoVisitante?.nombre || 'Equipo Visitante'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección 1: Imágenes de Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="image-multiple" size={24} color={colors.primary} />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Imágenes de Preview</Text>
              <Text style={styles.sectionSubtitle}>
                Máximo {MAX_PREVIEW_IMAGES} fotos con marca de agua
              </Text>
            </View>
          </View>

          {/* Grid de imágenes */}
          <View style={styles.imagesGrid}>
            {previewImages.map((img) => (
              <View key={img.id} style={styles.imageWrapper}>
                <Image
                  source={{ uri: img.processedUri || img.originalUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                {img.isProcessing && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={styles.processingText}>Procesando...</Text>
                  </View>
                )}
                {!img.isProcessing && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(img.id)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
                {img.processedUri && !img.isProcessing && (
                  <View style={styles.watermarkBadge}>
                    <MaterialCommunityIcons name="watermark" size={12} color={colors.white} />
                  </View>
                )}
              </View>
            ))}

            {/* Botón para agregar más imágenes */}
            {previewImages.length < MAX_PREVIEW_IMAGES && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleSelectImages}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus" size={32} color={colors.primary} />
                    <Text style={styles.addImageText}>Agregar</Text>
                    <Text style={styles.addImageCount}>
                      {previewImages.length}/{MAX_PREVIEW_IMAGES}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionHint}>
            <MaterialCommunityIcons name="information-outline" size={14} color={colors.textSecondary} />
            {' '}Las imágenes se redimensionan a 1920px y se les aplica marca de agua automáticamente
          </Text>
        </View>

        {/* Sección 2: Link de Compra */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cart" size={24} color={colors.success} />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Enlace de Compra</Text>
              <Text style={styles.sectionSubtitle}>
                Link donde los fans pueden comprar las fotos completas
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="link" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={linkCompra}
              onChangeText={setLinkCompra}
              placeholder="https://drive.google.com/..."
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {linkCompra.length > 0 && (
              <TouchableOpacity onPress={handleClearLink} style={styles.clearButton}>
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Preview button del link */}
          {linkCompra.trim().length > 0 && (
            <TouchableOpacity style={styles.previewLinkButton} onPress={handlePreviewLink}>
              <MaterialCommunityIcons name="open-in-new" size={18} color={colors.success} />
              <Text style={styles.previewLinkText}>Abrir enlace</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resumen */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <MaterialCommunityIcons name="image" size={18} color={colors.textSecondary} />
            <Text style={styles.summaryText}>
              {previewImages.length} imagen(es) de preview
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <MaterialCommunityIcons 
              name={linkCompra.trim() ? "check-circle" : "close-circle"} 
              size={18} 
              color={linkCompra.trim() ? colors.success : colors.textLight} 
            />
            <Text style={styles.summaryText}>
              {linkCompra.trim() ? 'Enlace de compra configurado' : 'Sin enlace de compra'}
            </Text>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton, 
              (isSaving || isProcessing) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={isSaving || isProcessing}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <MaterialCommunityIcons name="content-save" size={20} color={colors.white} />
            )}
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  partidoInfo: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  equiposRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipoContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  equipoLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  equipoNombre: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  fechaText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: colors.white,
    fontSize: 10,
    marginTop: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  watermarkBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    borderRadius: 4,
    padding: 2,
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  addImageCount: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearButton: {
    padding: 4,
  },
  previewLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  previewLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.success,
  },
  summarySection: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default LoadPhotosScreen;
