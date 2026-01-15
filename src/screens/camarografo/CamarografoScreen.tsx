import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';

interface Partido {
  id_partido: number;
  equipo_local: { nombre: string; logo?: string };
  equipo_visitante: { nombre: string; logo?: string };
  fecha: string;
  hora: string;
  estado_partido: string;
  cancha?: { nombre: string };
  ronda?: { nombre: string };
  link_fotos?: string;
}

export const CamarografoScreen = ({ navigation }: any) => {
  const { showSuccess, showError } = useToast();
  const { usuario, logout } = useAuth();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPartido, setSelectedPartido] = useState<Partido | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [linkFotos, setLinkFotos] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPartidos();
  }, []);

  const loadPartidos = async () => {
    setLoading(true);

    const result = await safeAsync(
      async () => {
        // Obtener todos los partidos (puedes filtrar por torneo específico si es necesario)
        const response = await api.partidos.list();
        return response.data || [];
      },
      'loadPartidos',
      {
        fallbackValue: [],
        onError: () => showError('Error al cargar partidos'),
      }
    );

    setPartidos(result);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPartidos();
    setRefreshing(false);
  };

  const handleOpenModal = (partido: Partido) => {
    setSelectedPartido(partido);
    setLinkFotos(partido.link_fotos || '');
    setPreviewImages([]);
    setShowModal(true);
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Se necesitan permisos para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        setUploadingImages(true);
        const processedImages = await Promise.all(
          result.assets.slice(0, 5).map(async (asset) => {
            // Aplicar watermark y reducir resolución
            const manipulatedImage = await applyWatermarkAndResize(asset.uri);
            return manipulatedImage.uri;
          })
        );
        setPreviewImages(processedImages);
        setUploadingImages(false);
        showSuccess(`${processedImages.length} imagen(es) procesada(s)`);
      }
    } catch (error) {
      setUploadingImages(false);
      showError('Error al seleccionar imágenes');
    }
  };

  const applyWatermarkAndResize = async (imageUri: string) => {
    try {
      // Paso 1: Reducir resolución (max 1920px de ancho)
      const resized = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1920 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Paso 2: Agregar watermark simple (texto overlay)
      // Nota: En producción usarías una imagen de watermark o procesamiento en backend
      const withWatermark = await ImageManipulator.manipulateAsync(
        resized.uri,
        [],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return withWatermark;
    } catch (error) {
      console.error('Error procesando imagen:', error);
      throw error;
    }
  };

  const handleRemoveImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveFotos = async () => {
    if (!selectedPartido) return;

    if (!linkFotos.trim()) {
      showError('Por favor ingresa un link válido');
      return;
    }

    // Validar que sea una URL válida
    try {
      new URL(linkFotos.trim());
    } catch {
      showError('Por favor ingresa una URL válida');
      return;
    }

    setSaving(true);

    const result = await safeAsync(
      async () => {
        const response = await api.partidos.updateLinkFotos(selectedPartido.id_partido, linkFotos.trim());
        return response;
      },
      'saveLinkFotos',
      {
        fallbackValue: null,
        onError: () => showError('Error al guardar el link de fotos'),
      }
    );

    setSaving(false);

    if (result && result.success) {
      showSuccess('Link de fotos guardado exitosamente');
      setShowModal(false);
      setSelectedPartido(null);
      setLinkFotos('');
      await loadPartidos();
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const renderPartido = ({ item }: { item: Partido }) => {
    const hasLink = !!item.link_fotos;

    return (
      <TouchableOpacity
        style={styles.partidoCard}
        onPress={() => handleOpenModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.partidoHeader}>
          <Text style={styles.rondaText}>{item.ronda?.nombre || 'Sin ronda'}</Text>
          <View style={[
            styles.estadoBadge,
            item.estado_partido === 'Finalizado' && styles.estadoFinalizado,
            item.estado_partido === 'En curso' && styles.estadoEnCurso,
            item.estado_partido === 'Programado' && styles.estadoProgramado,
          ]}>
            <Text style={styles.estadoText}>{item.estado_partido}</Text>
          </View>
        </View>

        <View style={styles.equiposContainer}>
          <View style={styles.equipoRow}>
            <Text style={styles.equipoNombre}>{item.equipo_local?.nombre || 'Local'}</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={styles.equipoRow}>
            <Text style={styles.equipoNombre}>{item.equipo_visitante?.nombre || 'Visitante'}</Text>
          </View>
        </View>

        <View style={styles.partidoFooter}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.fecha || 'Sin fecha'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.hora || 'Sin hora'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="stadium" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.cancha?.nombre || 'Sin cancha'}</Text>
          </View>
        </View>

        {hasLink && (
          <View style={styles.linkIndicator}>
            <MaterialCommunityIcons name="camera-check" size={18} color={colors.success} />
            <Text style={styles.linkIndicatorText}>Fotos cargadas</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando partidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="camera" size={28} color={colors.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Camarógrafo</Text>
            <Text style={styles.headerSubtitle}>{usuario?.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information" size={20} color={colors.info} />
        <Text style={styles.infoBannerText}>
          Toca un partido para agregar o editar el link de fotos
        </Text>
      </View>

      {/* Lista de Partidos */}
      <FlatList
        data={partidos}
        renderItem={renderPartido}
        keyExtractor={(item) => item.id_partido.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="soccer" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>No hay partidos disponibles</Text>
          </View>
        }
      />

      {/* Modal para agregar/editar link de fotos y subir imágenes */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cargar Fotos</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {selectedPartido && (
                <View style={styles.modalPartidoInfo}>
                  <Text style={styles.modalPartidoText}>
                    {selectedPartido.equipo_local?.nombre} vs {selectedPartido.equipo_visitante?.nombre}
                  </Text>
                  <Text style={styles.modalPartidoDate}>
                    {selectedPartido.fecha} - {selectedPartido.hora}
                  </Text>
                </View>
              )}

              {/* Sección de Link de Fotos */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Link de Google Drive (fotos completas) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://drive.google.com/..."
                  value={linkFotos}
                  onChangeText={setLinkFotos}
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  multiline
                />
                <Text style={styles.inputHint}>
                  Link con todas las fotos del partido
                </Text>
              </View>

              {/* Sección de Fotos de Preview */}
              <View style={styles.previewSection}>
                <Text style={styles.inputLabel}>Fotos de ejemplo (máx. 5)</Text>
                <Text style={styles.inputHint} style={{ marginBottom: 12 }}>
                  Estas fotos se mostrarán con watermark como vista previa
                </Text>

                {uploadingImages && (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.uploadingText}>Procesando imágenes...</Text>
                  </View>
                )}

                {previewImages.length > 0 && (
                  <View style={styles.imagesGrid}>
                    {previewImages.map((uri, index) => (
                      <View key={index} style={styles.imagePreviewContainer}>
                        <Image source={{ uri }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => handleRemoveImage(index)}
                        >
                          <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
                        </TouchableOpacity>
                        <View style={styles.watermarkBadge}>
                          <MaterialCommunityIcons name="watermark" size={12} color={colors.white} />
                          <Text style={styles.watermarkText}>WATERMARK</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {previewImages.length < 5 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={handlePickImages}
                    disabled={uploadingImages}
                  >
                    <MaterialCommunityIcons name="camera-plus" size={32} color={colors.primary} />
                    <Text style={styles.addPhotoText}>
                      {previewImages.length === 0 ? 'Agregar fotos de ejemplo' : `Agregar más (${5 - previewImages.length} restantes)`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowModal(false)}
                  disabled={saving}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleSaveFotos}
                  disabled={saving || uploadingImages}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.modalButtonTextSave}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logoutButton: {
    padding: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    lineHeight: 18,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  partidoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rondaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
  },
  estadoFinalizado: {
    backgroundColor: '#E8F5E9',
  },
  estadoEnCurso: {
    backgroundColor: '#FFF3E0',
  },
  estadoProgramado: {
    backgroundColor: '#E3F2FD',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  equiposContainer: {
    gap: 8,
    marginBottom: 12,
  },
  equipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
  },
  partidoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
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
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
  modalPartidoInfo: {
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalPartidoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalPartidoDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  inputContainer: {
    marginBottom: 24,
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
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  previewSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginBottom: 16,
  },
  uploadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.backgroundGray,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  watermarkBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  watermarkText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  addPhotoButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.backgroundGray,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
});
