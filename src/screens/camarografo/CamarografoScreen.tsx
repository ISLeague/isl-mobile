import React, { useState, useEffect, useCallback } from 'react';
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
import { Asset } from 'expo-asset';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';

// Watermark image
const WATERMARK_IMAGE = require('../../assets/watermark.png');

interface Partido {
  id_partido: number;
  equipo_local: { nombre: string; logo?: string };
  equipo_visitante: { nombre: string; logo?: string };
  fecha: string;
  hora: string;
  estado_partido: string;
  cancha?: { nombre: string };
  ronda?: { nombre: string; id_ronda?: number };
  id_ronda?: number;
  link_fotos?: string;
}

interface Pais {
  id_pais: number;
  nombre: string;
  emoji?: string;
}

interface Torneo {
  id_torneo: number;
  nombre: string;
  id_pais: number;
}

interface Edicion {
  id_edicion: number;
  nombre: string;
  id_torneo: number;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
}

interface EdicionCategoria {
  id_edicion_categoria: number;
  id_edicion: number;
  id_categoria: number;
  categoria?: Categoria;
}

interface Ronda {
  id_ronda: number;
  nombre: string;
  numero_ronda?: number;
  id_edicion_categoria: number;
}

export const CamarografoScreen = ({ navigation }: any) => {
  const { showSuccess, showError } = useToast();
  const { usuario, logout } = useAuth();

  // Filter states - All data
  const [allPaises, setAllPaises] = useState<Pais[]>([]);
  const [allTorneos, setAllTorneos] = useState<Torneo[]>([]);
  const [allEdiciones, setAllEdiciones] = useState<Edicion[]>([]);
  const [allCategorias, setAllCategorias] = useState<EdicionCategoria[]>([]);
  const [allRondas, setAllRondas] = useState<Ronda[]>([]);

  // Filtered data based on selection
  const [filteredTorneos, setFilteredTorneos] = useState<Torneo[]>([]);
  const [filteredEdiciones, setFilteredEdiciones] = useState<Edicion[]>([]);
  const [filteredCategorias, setFilteredCategorias] = useState<EdicionCategoria[]>([]);
  const [filteredRondas, setFilteredRondas] = useState<Ronda[]>([]);

  const [selectedPais, setSelectedPais] = useState<number | null>(null);
  const [selectedTorneo, setSelectedTorneo] = useState<number | null>(null);
  const [selectedEdicion, setSelectedEdicion] = useState<number | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [selectedRonda, setSelectedRonda] = useState<number | null>(null);

  // Main states
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPartido, setSelectedPartido] = useState<Partido | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [linkFotos, setLinkFotos] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [watermarkAsset, setWatermarkAsset] = useState<Asset | null>(null);

  // Load watermark asset on mount
  useEffect(() => {
    const loadWatermark = async () => {
      try {
        const asset = Asset.fromModule(WATERMARK_IMAGE);
        await asset.downloadAsync();
        setWatermarkAsset(asset);
      } catch (error) {
        console.error('Error loading watermark:', error);
      }
    };
    loadWatermark();
    loadAllData();
  }, []);

  // Load torneos when país changes
  useEffect(() => {
    if (selectedPais) {
      loadTorneos(selectedPais);
    } else {
      setFilteredTorneos([]);
    }
    setSelectedTorneo(null);
    setSelectedEdicion(null);
    setSelectedCategoria(null);
    setSelectedRonda(null);
    setPartidos([]);
  }, [selectedPais]);

  // Load ediciones when torneo changes
  useEffect(() => {
    if (selectedTorneo) {
      loadEdiciones(selectedTorneo);
    } else {
      setFilteredEdiciones([]);
    }
    setSelectedEdicion(null);
    setSelectedCategoria(null);
    setSelectedRonda(null);
    setPartidos([]);
  }, [selectedTorneo]);

  // Load categorias when edicion changes
  useEffect(() => {
    if (selectedEdicion) {
      loadCategorias(selectedEdicion);
    } else {
      setFilteredCategorias([]);
    }
    setSelectedCategoria(null);
    setSelectedRonda(null);
    setPartidos([]);
  }, [selectedEdicion]);

  // Load rondas when categoria changes
  useEffect(() => {
    if (selectedCategoria) {
      loadRondas(selectedCategoria);
    } else {
      setFilteredRondas([]);
    }
    setSelectedRonda(null);
    setPartidos([]);
  }, [selectedCategoria]);

  // Load partidos when ronda changes
  useEffect(() => {
    if (selectedRonda) {
      loadPartidos(selectedRonda);
    } else {
      setPartidos([]);
    }
  }, [selectedRonda]);

  const loadAllData = async () => {
    console.log('🚀 [CamarografoScreen] loadAllData - Iniciando carga de datos iniciales');
    setLoading(true);
    try {
      const response = await api.paises.list();
      console.log('✅ [CamarografoScreen] api.paises.list - Respuesta:', response);
      const paisesResult = Array.isArray(response) ? response : response.data || [];
      setAllPaises(paisesResult);
    } catch (error) {
      console.error('❌ [CamarografoScreen] Error al cargar países:', error);
      showError('Error al cargar países');
    } finally {
      setLoading(false);
    }
  };

  const loadTorneos = async (idPais: number) => {
    console.log(`🚀 [CamarografoScreen] loadTorneos - Cargando torneos para país: ${idPais}`);
    setLoadingFilters(true);
    try {
      const response = await api.torneos.list({ id_pais: idPais });
      console.log('✅ [CamarografoScreen] api.torneos.list - Respuesta:', response);
      setFilteredTorneos(response.data || []);
    } catch (error) {
      console.error('❌ [CamarografoScreen] Error al cargar torneos:', error);
      showError('Error al cargar torneos');
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadEdiciones = async (idTorneo: number) => {
    console.log(`🚀 [CamarografoScreen] loadEdiciones - Cargando ediciones para torneo: ${idTorneo}`);
    setLoadingFilters(true);
    try {
      const response = await api.ediciones.list({ id_torneo: idTorneo });
      console.log('✅ [CamarografoScreen] api.ediciones.list - Respuesta:', response);
      setFilteredEdiciones(response.data || []);
    } catch (error) {
      console.error('❌ [CamarografoScreen] Error al cargar ediciones:', error);
      showError('Error al cargar ediciones');
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadCategorias = async (idEdicion: number) => {
    console.log(`🚀 [CamarografoScreen] loadCategorias - Cargando categorías para edición: ${idEdicion}`);
    setLoadingFilters(true);
    try {
      const response = await api.edicionCategorias.list({ id_edicion: idEdicion });
      console.log('✅ [CamarografoScreen] api.edicionCategorias.list - Respuesta:', JSON.stringify(response, null, 2));
      const items = Array.isArray(response.data) ? response.data : response.data?.data || [];

      // Loggear los nombres de las categorías encontradas para depuración
      const categoryNames = items.map((i: any) => i.categorias?.nombre || i.categoria?.nombre || 'Sin nombre');
      console.log(`📂 [CamarografoScreen] Categorías procesadas:`, categoryNames);

      setFilteredCategorias(items);
    } catch (error) {
      console.error('❌ [CamarografoScreen] Error al cargar categorías:', error);
      showError('Error al cargar categorías');
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadRondas = async (idEdicionCategoria: number) => {
    console.log(`🚀 [CamarografoScreen] loadRondas - Cargando rondas para categoría: ${idEdicionCategoria}`);
    setLoadingFilters(true);
    try {
      const response = await api.rondas.list({ id_edicion_categoria: idEdicionCategoria });
      console.log('✅ [CamarografoScreen] api.rondas.list - Respuesta:', response);
      setFilteredRondas(response.data || []);
    } catch (error: any) {
      const is404 = error.response?.status === 404;
      const endpoint = error.config?.url || '/rondas';
      const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${endpoint}` : endpoint;

      console.error(`❌ [CamarografoScreen] FALLO CARGA DE RONDAS:`, {
        url: fullUrl,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorMessage: error.message,
        apiResponse: error.response?.data,
        params: error.config?.params
      });

      if (is404) {
        showError('No se encontraron rondas configuradas');
      } else {
        showError('Error de red al cargar rondas');
      }
      setFilteredRondas([]);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadPartidos = async (idRonda: number) => {
    console.log(`🚀 [CamarografoScreen] loadPartidos - Cargando partidos para ronda: ${idRonda}`);
    setLoadingFilters(true);
    const result = await safeAsync(
      async () => {
        const response = await api.partidos.list({ id_ronda: idRonda });
        console.log('✅ [CamarografoScreen] api.partidos.list - Respuesta:', response);
        return response.data || [];
      },
      'loadPartidos',
      {
        fallbackValue: [], onError: (err) => {
          console.error('❌ [CamarografoScreen] Error al cargar partidos:', err);
          showError('Error al cargar partidos');
        }
      }
    );
    setPartidos(result);
    setLoadingFilters(false);
  };

  const handleRefresh = async () => {
    if (selectedRonda) {
      setRefreshing(true);
      await loadPartidos(selectedRonda);
      setRefreshing(false);
    }
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
        selectionLimit: 2, // Solo 2 fotos
      });

      if (!result.canceled && result.assets) {
        setUploadingImages(true);
        const processedImages = await Promise.all(
          result.assets.slice(0, 2).map(async (asset) => {
            const manipulatedImage = await applyWatermarkAndResize(asset.uri);
            return manipulatedImage.uri;
          })
        );
        setPreviewImages(processedImages);
        setUploadingImages(false);
        showSuccess(`${processedImages.length} imagen(es) procesada(s) con watermark`);
      }
    } catch (error) {
      setUploadingImages(false);
      showError('Error al seleccionar imágenes');
    }
  };

  const applyWatermarkAndResize = async (imageUri: string) => {
    try {
      // Paso 1: Reducir resolución (max 1200px de ancho)
      const resized = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // El watermark se aplica visualmente en la UI como overlay
      // La imagen final con watermark se genera en el backend
      // Aquí guardamos la imagen procesada para preview
      const processed = await ImageManipulator.manipulateAsync(
        resized.uri,
        [],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      return processed;
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
      { fallbackValue: null, onError: () => showError('Error al guardar') }
    );

    setSaving(false);

    if (result && result.success) {
      showSuccess('Link de fotos guardado exitosamente');
      setShowModal(false);
      setSelectedPartido(null);
      setLinkFotos('');
      setPreviewImages([]);
      if (selectedRonda) {
        await loadPartidos(selectedRonda);
      }
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
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
            <Text style={styles.infoText}>{item.fecha || 'Fecha Pendiente'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.hora || 'Hora Pendiente'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="stadium" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.cancha?.nombre || 'Cancha Pendiente'}</Text>
          </View>
        </View>

        {hasLink && (
          <View style={styles.linkIndicator}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.linkIndicatorText}>Fotos cargadas</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterDropdown = (
    label: string,
    items: any[],
    selectedValue: number | null,
    onSelect: (value: number | null) => void,
    displayKey: string = 'nombre',
    valueKey: string = 'id',
    disabled: boolean = false,
    isCategory: boolean = false
  ) => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {items.map((item) => {
          const value = item[valueKey] || item.id_pais || item.id_torneo || item.id_edicion || item.id_edicion_categoria || item.id_ronda;
          // Para categorías, el nombre puede venir en item.categorias.nombre o item.categoria.nombre
          const display = item.categorias?.nombre || item.categoria?.nombre || item[displayKey] || item.nombre;
          const isSelected = selectedValue === value;

          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.filterChip,
                isCategory && styles.categoryChip,
                isSelected && styles.filterChipSelected,
                isSelected && isCategory && styles.categoryChipSelected,
                disabled && styles.filterChipDisabled
              ]}
              onPress={() => !disabled && onSelect(isSelected ? null : value)}
              disabled={disabled}
            >
              {item.emoji && <Text style={styles.filterEmoji}>{item.emoji}</Text>}
              <Text style={[
                styles.filterChipText,
                isSelected && styles.filterChipTextSelected,
                isCategory && styles.categoryChipText
              ]}>
                {display}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

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

      {/* Content Scrolleable */}
      <FlatList
        data={partidos}
        renderItem={renderPartido}
        keyExtractor={(item) => item.id_partido.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            {/* Filters Section */}
            <View style={styles.filtersSection}>
              {/* País */}
              {allPaises.length > 0 && renderFilterDropdown(
                'País',
                allPaises,
                selectedPais,
                setSelectedPais,
                'nombre',
                'id_pais'
              )}

              {/* Torneo */}
              {selectedPais && filteredTorneos.length > 0 && renderFilterDropdown(
                'Torneo',
                filteredTorneos,
                selectedTorneo,
                setSelectedTorneo,
                'nombre',
                'id_torneo'
              )}

              {/* Edición */}
              {selectedTorneo && filteredEdiciones.length > 0 && renderFilterDropdown(
                'Edición',
                filteredEdiciones,
                selectedEdicion,
                setSelectedEdicion,
                'nombre',
                'id_edicion'
              )}

              {/* Categoría */}
              {selectedEdicion && filteredCategorias.length > 0 && renderFilterDropdown(
                'Categoría',
                filteredCategorias,
                selectedCategoria,
                setSelectedCategoria,
                'nombre',
                'id_edicion_categoria',
                false,
                true
              )}

              {/* Ronda */}
              {selectedCategoria && filteredRondas.length > 0 && renderFilterDropdown(
                'Ronda',
                filteredRondas,
                selectedRonda,
                setSelectedRonda,
                'nombre',
                'id_ronda'
              )}

              {loadingFilters && (
                <View style={styles.loadingFilters}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingFiltersText}>Cargando...</Text>
                </View>
              )}
            </View>

            {/* Info Banner */}
            {selectedRonda && (
              <View style={styles.infoBanner}>
                <MaterialCommunityIcons name="information" size={20} color={colors.info} />
                <Text style={styles.infoBannerText}>
                  Toca un partido para agregar el link de fotos y hasta 2 imágenes de preview
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando partidos...</Text>
            </View>
          ) : !selectedCategoria ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="filter" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>Selecciona los filtros para ver los partidos</Text>
            </View>
          ) : filteredRondas.length === 0 && !loadingFilters ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.warning} />
              <Text style={styles.emptyText}>No hay rondas creadas</Text>
              <Text style={styles.emptySubtext}>Esta categoría aún no tiene un fixture generado</Text>
            </View>
          ) : !selectedRonda ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-search" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>Selecciona una ronda</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="soccer" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>No hay partidos disponibles</Text>
            </View>
          )
        }
      />

      {/* Modal */}
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
                    {selectedPartido.fecha || 'Fecha Pendiente'} - {selectedPartido.hora || 'Hora Pendiente'}
                  </Text>
                </View>
              )}

              {/* Link de Fotos */}
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
                <Text style={styles.inputHint}>Link con todas las fotos del partido</Text>
              </View>

              {/* Fotos de Preview - Máximo 2 */}
              <View style={styles.previewSection}>
                <Text style={styles.inputLabel}>Fotos de ejemplo (máx. 2)</Text>
                <Text style={styles.inputHint}>
                  Las fotos se subirán con watermark al bucket de almacenamiento
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
                        <View style={styles.watermarkOverlay}>
                          <Image source={WATERMARK_IMAGE} style={styles.watermarkImage} />
                        </View>
                        <View style={styles.lowResBadge}>
                          <MaterialCommunityIcons name="image-size-select-small" size={12} color={colors.white} />
                          <Text style={styles.lowResText}>Preview</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {previewImages.length < 2 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={handlePickImages}
                    disabled={uploadingImages}
                  >
                    <MaterialCommunityIcons name="camera-plus" size={32} color={colors.primary} />
                    <Text style={styles.addPhotoText}>
                      {previewImages.length === 0 ? 'Agregar fotos de ejemplo' : `Agregar 1 más`}
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
  filtersSection: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundGray,
    marginRight: 8,
    gap: 6,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  categoryChip: {
    width: 65,
    height: 65,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: 10,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  filterChipDisabled: {
    opacity: 0.5,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  filterChipTextSelected: {
    color: colors.white,
  },
  loadingFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingFiltersText: {
    fontSize: 13,
    color: colors.textSecondary,
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
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
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
  previewSection: {
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
    marginTop: 16,
  },
  uploadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
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
  watermarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  watermarkImage: {
    width: '120%',
    height: '120%',
    resizeMode: 'contain',
    opacity: 0.15,
    transform: [{ rotate: '-30deg' }],
  },
  lowResBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowResText: {
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
    marginTop: 16,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
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
});
