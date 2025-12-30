import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common';
import { Cancha, Local } from '../../api/types';
import { safeAsync } from '../../utils/errorHandling';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';

interface LocalDetailScreenProps {
  route: any;
  navigation: any;
}

export const LocalDetailScreen: React.FC<LocalDetailScreenProps> = ({ route, navigation }) => {
  const { local: localParam } = route.params;
  const { showError } = useToast();

  const [local] = useState<Local>(localParam);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCanchas();
  }, [local.id_local]);

  const loadCanchas = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        const response = await api.canchas.list(local.id_local);
        return response.success && response.data?.canchas ? response.data.canchas : [];
      },
      'LocalDetailScreen - loadCanchas',
      {
        fallbackValue: [],
        onError: () => showError('Error al cargar las canchas'),
      }
    );

    setCanchas(result);
    setLoading(false);
  };

  const openWaze = (latitud: number, longitud: number) => {
    const url = `waze://?ll=${latitud},${longitud}&navigate=yes`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else Linking.openURL(`https://waze.com/ul?ll=${latitud},${longitud}&navigate=yes`);
    });
  };

  const openGoogleMaps = (latitud: number, longitud: number, nombre: string) => {
    const url = Platform.select({
      ios: `maps://maps.google.com/maps?q=${latitud},${longitud}&ll=${latitud},${longitud}`,
      android: `geo:${latitud},${longitud}?q=${latitud},${longitud}(${nombre})`,
    });
    Linking.canOpenURL(url!).then(supported => {
      if (supported) Linking.openURL(url!);
      else Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{local.nombre}</Text>
        </View>

        {/* Foto del local */}
        {local.foto_principal && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: local.foto_principal }}
              style={styles.localPhoto}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Información del Local */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Información del Local</Text>

          {/* Dirección */}
          {local.direccion && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{local.direccion}</Text>
            </View>
          )}

          {/* Teléfono */}
          {local.telefono && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{local.telefono}</Text>
            </View>
          )}

          {/* Email */}
          {local.email && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{local.email}</Text>
            </View>
          )}

          {/* Capacidad */}
          {local.capacidad_total && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
              <Text style={styles.infoText}>Capacidad: {local.capacidad_total} personas</Text>
            </View>
          )}

          {/* Coordenadas */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {local.latitud.toFixed(6)}, {local.longitud.toFixed(6)}
            </Text>
          </View>
        </Card>

        {/* Servicios */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Servicios Disponibles</Text>

          <View style={styles.servicesGrid}>
            <View style={[styles.serviceItem, local.tiene_estacionamiento && styles.serviceActive]}>
              <MaterialCommunityIcons
                name="parking"
                size={28}
                color={local.tiene_estacionamiento ? colors.success : colors.textLight}
              />
              <Text style={[styles.serviceText, local.tiene_estacionamiento && styles.serviceTextActive]}>
                Estacionamiento
              </Text>
            </View>

            <View style={[styles.serviceItem, local.tiene_vestuarios && styles.serviceActive]}>
              <MaterialCommunityIcons
                name="hanger"
                size={28}
                color={local.tiene_vestuarios ? colors.success : colors.textLight}
              />
              <Text style={[styles.serviceText, local.tiene_vestuarios && styles.serviceTextActive]}>
                Vestuarios
              </Text>
            </View>

            <View style={[styles.serviceItem, local.tiene_iluminacion && styles.serviceActive]}>
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={28}
                color={local.tiene_iluminacion ? colors.success : colors.textLight}
              />
              <Text style={[styles.serviceText, local.tiene_iluminacion && styles.serviceTextActive]}>
                Iluminación
              </Text>
            </View>
          </View>
        </Card>

        {/* Navegación */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Navegar al Local</Text>

          <View style={styles.mapButtonsContainer}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openGoogleMaps(local.latitud, local.longitud, local.nombre)}
            >
              <Image
                source={require('../../assets/google-maps.png')}
                style={styles.mapButtonIcon}
                resizeMode="contain"
              />
              <Text style={styles.mapButtonText}>Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openWaze(local.latitud, local.longitud)}
            >
              <Image
                source={require('../../assets/waze.png')}
                style={styles.mapButtonIcon}
                resizeMode="contain"
              />
              <Text style={styles.mapButtonText}>Waze</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Canchas */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>
            Canchas ({canchas.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando canchas...</Text>
            </View>
          ) : canchas.length > 0 ? (
            canchas.map((cancha) => (
              <View key={cancha.id_cancha} style={styles.canchaCard}>
                <View style={styles.canchaHeader}>
                  <MaterialCommunityIcons name="soccer-field" size={24} color={colors.primary} />
                  <Text style={styles.canchaName}>{cancha.nombre}</Text>
                </View>

                {/* Información de la cancha */}
                <View style={styles.canchaInfo}>
                  {cancha.tipo_superficie && (
                    <View style={styles.canchaInfoItem}>
                      <MaterialCommunityIcons name="texture-box" size={16} color={colors.textSecondary} />
                      <Text style={styles.canchaInfoText}>Superficie: {cancha.tipo_superficie}</Text>
                    </View>
                  )}

                  {cancha.dimensiones && (
                    <View style={styles.canchaInfoItem}>
                      <MaterialCommunityIcons name="ruler" size={16} color={colors.textSecondary} />
                      <Text style={styles.canchaInfoText}>Dimensiones: {cancha.dimensiones}</Text>
                    </View>
                  )}

                  {cancha.capacidad_espectadores && (
                    <View style={styles.canchaInfoItem}>
                      <MaterialCommunityIcons name="account-group" size={16} color={colors.textSecondary} />
                      <Text style={styles.canchaInfoText}>
                        Capacidad: {cancha.capacidad_espectadores} espectadores
                      </Text>
                    </View>
                  )}
                </View>

                {/* Servicios de la cancha */}
                <View style={styles.canchaServices}>
                  {cancha.tiene_iluminacion && (
                    <View style={styles.canchaServiceBadge}>
                      <MaterialCommunityIcons name="lightbulb-on" size={14} color={colors.success} />
                      <Text style={styles.canchaServiceText}>Iluminación</Text>
                    </View>
                  )}

                  {cancha.tiene_gradas && (
                    <View style={styles.canchaServiceBadge}>
                      <MaterialCommunityIcons name="stairs" size={14} color={colors.success} />
                      <Text style={styles.canchaServiceText}>Gradas</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No hay canchas registradas</Text>
            </View>
          )}
        </Card>
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
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  photoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.backgroundGray,
  },
  localPhoto: {
    width: '100%',
    height: '100%',
  },
  card: {
    margin: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  serviceItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceActive: {
    backgroundColor: '#F0F9F0',
    borderColor: colors.success,
  },
  serviceText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: colors.textLight,
    fontWeight: '600',
  },
  serviceTextActive: {
    color: colors.success,
  },
  mapButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundGray,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  mapButtonIcon: {
    width: 24,
    height: 24,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  canchaCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  canchaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  canchaName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  canchaInfo: {
    marginBottom: 12,
  },
  canchaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  canchaInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  canchaServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  canchaServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.success,
  },
  canchaServiceText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
