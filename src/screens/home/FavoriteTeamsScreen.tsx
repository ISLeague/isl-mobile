import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GradientHeader } from '../../components/common';
import { colors } from '../../theme/colors';
import api from '../../api';
import { SeguimientoEquipo } from '../../api/types/seguimiento-equipos.types';
import { useToast } from '../../contexts/ToastContext';
import { useFocusEffect } from '@react-navigation/native';

interface FavoriteTeamsScreenProps {
  navigation: any;
}

export const FavoriteTeamsScreen: React.FC<FavoriteTeamsScreenProps> = ({ navigation }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<SeguimientoEquipo[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.seguimientoEquipos.list();
      if (response.success && response.data?.equipos_favoritos) {
        setEquipos(response.data.equipos_favoritos);
      }
    } catch (error) {
      showError('Error al cargar equipos favoritos');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePreferencia = async (
    seguimiento: SeguimientoEquipo,
    campo: keyof SeguimientoEquipo
  ) => {
    try {
      setUpdatingId(seguimiento.id_seguimiento);
      const newValue = !seguimiento[campo];

      await api.seguimientoEquipos.updatePreferencias(seguimiento.id_seguimiento, {
        [campo]: newValue,
      });

      // Actualizar estado local
      setEquipos(prev =>
        prev.map(eq =>
          eq.id_seguimiento === seguimiento.id_seguimiento
            ? { ...eq, [campo]: newValue }
            : eq
        )
      );

      showSuccess('Preferencias actualizadas');
    } catch (error) {
      showError('Error al actualizar preferencias');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUnfollow = (seguimiento: SeguimientoEquipo) => {
    Alert.alert(
      'Dejar de seguir',
      `¿Dejar de seguir a ${seguimiento.equipo?.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.seguimientoEquipos.delete(seguimiento.id_seguimiento);
              setEquipos(prev => prev.filter(eq => eq.id_seguimiento !== seguimiento.id_seguimiento));
              showSuccess('Dejaste de seguir al equipo');
            } catch (error) {
              showError('Error al dejar de seguir');
            }
          },
        },
      ]
    );
  };

  const renderEquipo = ({ item }: { item: SeguimientoEquipo }) => (
    <View style={styles.equipoCard}>
      <View style={styles.equipoHeader}>
        <TouchableOpacity
          style={styles.equipoInfo}
          onPress={() => navigation.navigate('TeamDetail', { equipoId: item.equipo?.id_equipo })}
          activeOpacity={0.7}
        >
          <Image
            source={
              item.equipo?.logo
                ? { uri: item.equipo.logo }
                : require('../../assets/InterLOGO.png')
            }
            style={styles.equipoLogo}
            resizeMode="contain"
          />
          <View style={styles.equipoTexts}>
            <Text style={styles.equipoNombre}>{item.equipo?.nombre}</Text>
            <Text style={styles.categoriaTexto}>
              {item.edicion_categoria?.categoria?.nombre} • {item.edicion_categoria?.edicion?.nombre}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleUnfollow(item)}
          style={styles.unfollowButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="heart-off" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Preferencias de Notificaciones */}
      <View style={styles.preferenciasContainer}>
        <Text style={styles.preferenciasTitle}>Notificaciones</Text>

        <View style={styles.preferencia}>
          <View style={styles.preferenciaInfo}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.preferenciaLabel}>Partidos próximos</Text>
          </View>
          <Switch
            value={item.notificar_partidos}
            onValueChange={() => handleTogglePreferencia(item, 'notificar_partidos')}
            disabled={updatingId === item.id_seguimiento}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.preferencia}>
          <View style={styles.preferenciaInfo}>
            <MaterialCommunityIcons name="trophy" size={20} color={colors.success} />
            <Text style={styles.preferenciaLabel}>Resultados finales</Text>
          </View>
          <Switch
            value={item.notificar_resultados}
            onValueChange={() => handleTogglePreferencia(item, 'notificar_resultados')}
            disabled={updatingId === item.id_seguimiento}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.preferencia}>
          <View style={styles.preferenciaInfo}>
            <MaterialCommunityIcons name="soccer" size={20} color={colors.warning} />
            <Text style={styles.preferenciaLabel}>Goles en tiempo real</Text>
          </View>
          <Switch
            value={item.notificar_goles}
            onValueChange={() => handleTogglePreferencia(item, 'notificar_goles')}
            disabled={updatingId === item.id_seguimiento}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.preferencia}>
          <View style={styles.preferenciaInfo}>
            <MaterialCommunityIcons name="card" size={20} color={colors.error} />
            <Text style={styles.preferenciaLabel}>Tarjetas</Text>
          </View>
          <Switch
            value={item.notificar_tarjetas}
            onValueChange={() => handleTogglePreferencia(item, 'notificar_tarjetas')}
            disabled={updatingId === item.id_seguimiento}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <GradientHeader title="Equipos Favoritos" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando equipos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader title="Equipos Favoritos" onBackPress={() => navigation.goBack()} />

      {equipos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="heart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No tienes equipos favoritos</Text>
          <Text style={styles.emptySubtitle}>
            Explora equipos y toca el ícono de corazón para seguirlos
          </Text>
        </View>
      ) : (
        <FlatList
          data={equipos}
          renderItem={renderEquipo}
          keyExtractor={item => item.id_seguimiento.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  equipoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  equipoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  equipoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  equipoLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  equipoTexts: {
    flex: 1,
  },
  equipoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  categoriaTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  unfollowButton: {
    padding: 8,
  },
  preferenciasContainer: {
    gap: 12,
  },
  preferenciasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  preferencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenciaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  preferenciaLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
});
