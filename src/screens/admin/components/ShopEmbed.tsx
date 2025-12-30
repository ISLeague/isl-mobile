import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Partido, Equipo } from '../../../types';
import { mockPartidos, mockEquipos } from '../../../data/mockData';
import { formatDate } from '../../../utils/formatters';
import { useToast } from '../../../contexts/ToastContext';

const { width } = Dimensions.get('window');

interface ShopEmbedProps {
  navigation: any;
  equipoFavoritoId?: number; // ID del equipo favorito del fan
  edicionCategoriaId?: number;
}

interface PartidoConFotos extends Partido {
  equipo_local: Equipo;
  equipo_visitante: Equipo;
}

export const ShopEmbed: React.FC<ShopEmbedProps> = ({
  navigation,
  equipoFavoritoId,
  edicionCategoriaId,
}) => {
  const { showInfo } = useToast();
  const [loading, setLoading] = useState(true);
  const [partidosConFotos, setPartidosConFotos] = useState<PartidoConFotos[]>([]);
  const [equipoFavorito, setEquipoFavorito] = useState<Equipo | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    loadData();
  }, [equipoFavoritoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Obtener equipo favorito si existe
      if (equipoFavoritoId) {
        const equipo = mockEquipos.find(e => e.id_equipo === equipoFavoritoId);
        setEquipoFavorito(equipo || null);
      }

      // Filtrar partidos que tienen fotos cargadas
      const partidosFiltrados = mockPartidos
        .filter(p => {
          // Solo partidos con preview_images o link_fotos
          const tienePhotos = (p.preview_images && p.preview_images.length > 0) || p.link_fotos;
          
          // Si hay equipo favorito, filtrar solo partidos de ese equipo
          if (equipoFavoritoId && tienePhotos) {
            return p.id_equipo_local === equipoFavoritoId || p.id_equipo_visitante === equipoFavoritoId;
          }
          
          return tienePhotos;
        })
        .map(p => ({
          ...p,
          equipo_local: mockEquipos.find(e => e.id_equipo === p.id_equipo_local)!,
          equipo_visitante: mockEquipos.find(e => e.id_equipo === p.id_equipo_visitante)!,
        }))
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setPartidosConFotos(partidosFiltrados);

      // Inicializar índice de imagen seleccionada para cada partido
      const initialIndexes: { [key: number]: number } = {};
      partidosFiltrados.forEach(p => {
        initialIndexes[p.id_partido] = 0;
      });
      setSelectedImageIndex(initialIndexes);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPress = (partido: PartidoConFotos) => {
    if (partido.link_fotos) {
      Linking.openURL(partido.link_fotos);
    } else {
      showInfo('El enlace de compra no está disponible');
    }
  };

  const handleImagePress = (partidoId: number, index: number) => {
    setSelectedImageIndex(prev => ({
      ...prev,
      [partidoId]: index,
    }));
  };

  const renderPartidoCard = (partido: PartidoConFotos) => {
    const previewImages = partido.preview_images || [];
    const currentIndex = selectedImageIndex[partido.id_partido] || 0;
    
    // Si no hay imágenes de preview pero hay link, mostrar placeholder
    const hasImages = previewImages.length > 0;

    return (
      <View key={partido.id_partido} style={styles.partidoCard}>
        {/* Header del partido */}
        <View style={styles.partidoHeader}>
          <View style={styles.equiposRow}>
            <View style={styles.equipoInfo}>
              <Image
                source={partido.equipo_local.logo ? { uri: partido.equipo_local.logo } : require('../../../assets/InterLOGO.png')}
                style={styles.equipoLogo}
                resizeMode="contain"
              />
              <Text style={styles.equipoNombre} numberOfLines={1}>
                {partido.equipo_local.nombre}
              </Text>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.fechaText}>{formatDate(partido.fecha)}</Text>
            </View>

            <View style={styles.equipoInfo}>
              <Image
                source={partido.equipo_visitante.logo ? { uri: partido.equipo_visitante.logo } : require('../../../assets/InterLOGO.png')}
                style={styles.equipoLogo}
                resizeMode="contain"
              />
              <Text style={styles.equipoNombre} numberOfLines={1}>
                {partido.equipo_visitante.nombre}
              </Text>
            </View>
          </View>

          {/* Marcador si está finalizado */}
          {partido.estado_partido === 'Finalizado' && (
            <View style={styles.marcadorContainer}>
              <Text style={styles.marcadorText}>
                {partido.marcador_local} - {partido.marcador_visitante}
              </Text>
            </View>
          )}
        </View>

        {/* Grid de imágenes de preview */}
        {hasImages ? (
          <View style={styles.imagesSection}>
            {/* Imagen principal */}
            <View style={styles.mainImageContainer}>
              <Image
                source={{ uri: previewImages[currentIndex] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              <View style={styles.watermarkOverlay}>
                <MaterialCommunityIcons name="watermark" size={48} color="rgba(255,255,255,0.3)" />
              </View>
            </View>

            {/* Thumbnails */}
            {previewImages.length > 1 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailsContainer}
              >
                {previewImages.slice(0, 5).map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.thumbnail,
                      currentIndex === index && styles.thumbnailActive,
                    ]}
                    onPress={() => handleImagePress(partido.id_partido, index)}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.previewHint}>
              <MaterialCommunityIcons name="information-outline" size={12} color={colors.textSecondary} />
              {' '}Imágenes de muestra con marca de agua
            </Text>
          </View>
        ) : (
          <View style={styles.noImagesContainer}>
            <MaterialCommunityIcons name="image-multiple" size={48} color={colors.textLight} />
            <Text style={styles.noImagesText}>Fotos disponibles para compra</Text>
          </View>
        )}

        {/* Botón de compra */}
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => handleBuyPress(partido)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="cart" size={20} color={colors.white} />
          <Text style={styles.buyButtonText}>Comprar Fotos</Text>
          <MaterialCommunityIcons name="open-in-new" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando fotos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con equipo favorito */}
      {equipoFavorito && (
        <View style={styles.favoritoHeader}>
          <Image
            source={equipoFavorito.logo ? { uri: equipoFavorito.logo } : require('../../../assets/InterLOGO.png')}
            style={styles.favoritoLogo}
            resizeMode="contain"
          />
          <View style={styles.favoritoInfo}>
            <Text style={styles.favoritoLabel}>Fotos de tu equipo</Text>
            <Text style={styles.favoritoNombre}>{equipoFavorito.nombre}</Text>
          </View>
          <MaterialCommunityIcons name="heart" size={24} color={colors.primary} />
        </View>
      )}

      {/* Lista de partidos con fotos */}
      {partidosConFotos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="camera-off" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>
            {equipoFavorito 
              ? `No hay fotos disponibles de ${equipoFavorito.nombre}`
              : 'No hay fotos disponibles'
            }
          </Text>
          <Text style={styles.emptyText}>
            Las fotos de los partidos aparecerán aquí cuando estén disponibles para compra
          </Text>
        </View>
      ) : (
        <View style={styles.partidosList}>
          <Text style={styles.sectionTitle}>
            {partidosConFotos.length} partido{partidosConFotos.length !== 1 ? 's' : ''} con fotos
          </Text>
          {partidosConFotos.map(partido => renderPartidoCard(partido))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
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
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  favoritoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoritoLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  favoritoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  favoritoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  favoritoNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  partidosList: {
    paddingBottom: 20,
  },
  partidoCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  partidoHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  equiposRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipoInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  equipoLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  equipoNombre: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  fechaText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  marcadorContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  marcadorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  imagesSection: {
    padding: 12,
  },
  mainImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.backgroundGray,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  watermarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  thumbnailsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  previewHint: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  noImagesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.backgroundGray,
  },
  noImagesText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default ShopEmbed;
