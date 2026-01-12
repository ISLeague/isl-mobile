import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { minigamesService, Minijuego } from '../../api/services/minigames.service';

export const MinijuegosScreen = ({ navigation }: any) => {
  const [minijuegos, setMinijuegos] = useState<Minijuego[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await minigamesService.list();
      setMinijuegos(data);
    } catch (error) {
      console.error('Error loading minigames:', error);
      setMinijuegos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMinijuegoPress = (minijuego: Minijuego) => {
    if (minijuego.nombre_minijuego === 'Impostor') {
      navigation.navigate('ImpostorMenu');
    }
  };

  const getIconForMinijuego = (nombre: string) => {
    switch (nombre.toLowerCase()) {
      case 'impostor':
        return 'incognito';
      default:
        return 'gamepad-variant';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando minijuegos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Minijuegos</Text>
          <Text style={styles.subtitle}>Diviértete con tus amigos</Text>
        </View>

        {/* Lista de Minijuegos */}
        <View style={styles.gamesContainer}>
          {minijuegos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="gamepad-variant-outline"
                size={60}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>No hay minijuegos disponibles</Text>
            </View>
          ) : (
            minijuegos.map((minijuego) => (
              <TouchableOpacity
                key={minijuego.id}
                style={styles.gameCard}
                onPress={() => handleMinijuegoPress(minijuego)}
                activeOpacity={0.8}
              >
                <View style={styles.gameIconContainer}>
                  {minijuego.imagen_url ? (
                    <Image
                      source={{ uri: minijuego.imagen_url }}
                      style={styles.gameImage}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={getIconForMinijuego(minijuego.nombre_minijuego)}
                      size={50}
                      color={colors.white}
                    />
                  )}
                </View>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{minijuego.nombre_minijuego}</Text>
                  <Text style={styles.gameDescription} numberOfLines={2}>
                    {minijuego.description || 'Sin descripción'}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={28}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Próximamente */}
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonTitle}>Próximamente</Text>
          <View style={styles.comingSoonCard}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={40}
              color={colors.textLight}
            />
            <Text style={styles.comingSoonText}>Más minijuegos en camino...</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 4,
  },
  gamesContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  gameInfo: {
    flex: 1,
    marginLeft: 16,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gameDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  comingSoonContainer: {
    padding: 16,
    paddingTop: 8,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  comingSoonText: {
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 16,
  },
});
