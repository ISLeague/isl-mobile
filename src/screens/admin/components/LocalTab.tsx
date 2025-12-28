import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Cancha, Local as LocalType } from '../../../api/types';
import { useAuth } from '../../../contexts/AuthContext';
import { safeAsync } from '../../../utils/errorHandling';
import api from '../../../api';

interface LocalTabProps {
  idEdicionCategoria: number;
  onCreateLocal?: () => void;
  onCreateCancha?: (idLocal: number, nombreLocal: string) => void;
  onEditLocal?: (local: LocalType) => void;
  onDeleteLocal?: (idLocal: number) => void;
  onEditCancha?: (cancha: Cancha, nombreLocal: string) => void;
  onDeleteCancha?: (idCancha: number, nombreLocal: string) => void;
}

export const LocalTab: React.FC<LocalTabProps> = ({
  idEdicionCategoria,
  onCreateLocal,
  onCreateCancha,
  onEditLocal,
  onDeleteLocal,
  onEditCancha,
  onDeleteCancha,
}) => {
  const { isAdmin } = useAuth();
  const [locales, setLocales] = useState<LocalType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocales();
  }, [idEdicionCategoria]);

  const loadLocales = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        // Load locales from API
        const localesResponse = await api.locales.list(idEdicionCategoria);
        const allLocales = localesResponse.success && localesResponse.data?.locales
          ? localesResponse.data.locales
          : [];

        // Load canchas for each local
        const localesConCanchas = await Promise.all(
          allLocales.map(async (local: LocalType) => {
            const canchasResponse = await api.canchas.list(local.id_local);
            const canchas = canchasResponse.success && canchasResponse.data?.canchas
              ? canchasResponse.data.canchas
              : [];

            return {
              ...local,
              canchas: canchas as Cancha[],
            };
          })
        );

        return localesConCanchas;
      },
      'LocalTab - loadLocales',
      {
        fallbackValue: [],
      }
    );

    if (result) {
      setLocales(result);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando locales...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      {/* Botón para crear nuevo local - Solo para admins */}
      {isAdmin && onCreateLocal && (
        <TouchableOpacity style={styles.createButton} onPress={onCreateLocal}>
          <MaterialCommunityIcons name="plus-circle" size={24} color={colors.white} />
          <Text style={styles.createButtonText}>Crear Nuevo Local</Text>
        </TouchableOpacity>
      )}

      {locales.map((local) => (
        <View key={local.id_local} style={styles.localCard}>
          <View style={styles.localHeader}>
            <View style={styles.localIconContainer}>
              <MaterialCommunityIcons name="stadium" size={28} color="#BE0127" />
            </View>
            <View style={styles.localInfo}>
              <Text style={styles.localName}>{local.nombre}</Text>
              <Text style={styles.localCanchas}>
                {local.canchas?.length || 0} {(local.canchas?.length || 0) === 1 ? 'cancha' : 'canchas'}
              </Text>
            </View>
            {/* Botones de editar/eliminar local - Solo admins */}
            {isAdmin && (
              <View style={styles.actionButtons}>
                {onEditLocal && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEditLocal(local)}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
                {onDeleteLocal && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      Alert.alert(
                        'Confirmar eliminación',
                        `¿Estás seguro de eliminar el local "${local.nombre}"?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: () => onDeleteLocal(local.id_local),
                          },
                        ]
                      );
                    }}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.mapButtonsContainer}>
            <TouchableOpacity
              style={styles.mapButtonFull}
              onPress={() => openGoogleMaps(local.latitud, local.longitud, local.nombre)}
            >
              <Image source={require('../../../assets/google-maps.png')} style={styles.mapButtonIcon} resizeMode="contain" />
              <Text style={styles.mapButtonText}>Google Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapButtonFull}
              onPress={() => openWaze(local.latitud, local.longitud)}
            >
              <Image source={require('../../../assets/waze.png')} style={styles.mapButtonIcon} resizeMode="contain" />
              <Text style={styles.mapButtonText}>Waze</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de canchas */}
          {local.canchas && local.canchas.length > 0 && (
            <View style={styles.canchasContainer}>
              <Text style={styles.canchasTitle}>Canchas:</Text>
              {local.canchas.map((cancha) => (
                <View key={cancha.id_cancha} style={styles.canchaItem}>
                  <MaterialCommunityIcons name="soccer-field" size={16} color={colors.textSecondary} />
                  <Text style={styles.canchaName}>{cancha.nombre}</Text>
                  {/* Botones de editar/eliminar cancha - Solo admins */}
                  {isAdmin && (
                    <View style={styles.canchaActions}>
                      {onEditCancha && (
                        <TouchableOpacity
                          style={styles.canchaActionButton}
                          onPress={() => onEditCancha(cancha, local.nombre)}
                        >
                          <MaterialCommunityIcons name="pencil" size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                      {onDeleteCancha && (
                        <TouchableOpacity
                          style={styles.canchaActionButton}
                          onPress={() => {
                            Alert.alert(
                              'Confirmar eliminación',
                              `¿Estás seguro de eliminar la cancha "${cancha.nombre}"?`,
                              [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                  text: 'Eliminar',
                                  style: 'destructive',
                                  onPress: () => onDeleteCancha(cancha.id_cancha, local.nombre),
                                },
                              ]
                            );
                          }}
                        >
                          <MaterialCommunityIcons name="delete" size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Botón para crear cancha - Solo admins */}
          {isAdmin && onCreateCancha && (
            <TouchableOpacity
              style={styles.createCanchaButton}
              onPress={() => onCreateCancha(local.id_local, local.nombre)}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.createCanchaText}>Agregar Cancha</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  localCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  localHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  localIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  localInfo: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  localCanchas: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  canchasContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  canchasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  canchaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  canchaName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  canchaActions: {
    flexDirection: 'row',
    gap: 6,
  },
  canchaActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mapButtonFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
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
  createCanchaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  createCanchaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
});
