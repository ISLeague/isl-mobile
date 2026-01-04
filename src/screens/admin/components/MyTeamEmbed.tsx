import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, SearchBar, Modal } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { useTeamFollow } from '../../../hooks';
import { useAuth } from '../../../contexts/AuthContext';
import { Equipo, Clasificacion } from '../../../api/types';
import { safeAsync } from '../../../utils/errorHandling';
import api from '../../../api';

interface MyTeamEmbedProps {
  navigation: any;
  edicionCategoriaId: number;
}

export const MyTeamEmbed: React.FC<MyTeamEmbedProps> = ({ navigation, edicionCategoriaId }) => {
  const { isGuest } = useAuth();
  const { followedTeam, loading, followTeam } = useTeamFollow(edicionCategoriaId);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);

  // Load equipos and clasificaciones from API
  useEffect(() => {
    const loadData = async () => {
      const result = await safeAsync(
        async () => {
          const equiposResponse = await api.equipos.list(edicionCategoriaId);
          const equiposData = equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];

          // TODO: Load clasificaciones from API when grupo ID is available
          // For now, we'll leave it empty as we don't have a direct endpoint
          return { equipos: equiposData, clasificaciones: [] };
        },
        'MyTeamEmbed - loadData',
        {
          fallbackValue: { equipos: [], clasificaciones: [] },
        }
      );

      if (result) {
        setEquipos(result.equipos);
        setClasificaciones(result.clasificaciones);
      }
    };

    loadData();
  }, [edicionCategoriaId]);

  // Manual search filtering
  const filteredEquipos = equipos.filter(equipo => {
    if (!searchQuery) return true;
    const equipoNombre = equipo.nombre?.toLowerCase() || '';
    return equipoNombre.includes(searchQuery.toLowerCase());
  });

  // Si es invitado, mostrar mensaje
  if (isGuest) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="account-alert-outline" size={80} color={colors.primary} />
        <Text style={styles.emptyTitle}>Función no disponible</Text>
        <Text style={styles.emptyText}>
          Debes iniciar sesión o crear una cuenta para seguir a tu equipo favorito
        </Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            Alert.alert(
              'Iniciar Sesión',
              '¿Deseas ir a la pantalla de inicio de sesión?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') },
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="login" size={24} color={colors.white} />
          <Text style={styles.searchButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Asegurar que el modal se cierre cuando followedTeam cambie
  useEffect(() => {
    if (followedTeam) {
      setShowSearchModal(false);
    }
  }, [followedTeam]);

  const handleSelectTeam = async (equipo: Equipo) => {
    // Cerrar el modal primero
    setShowSearchModal(false);
    setSearchQuery('');
    // Luego actualizar el equipo
    await followTeam(equipo);
  };

  // Mostrar pantalla de carga inicial
  if (loading && !followedTeam) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Pantalla de selección de equipo
  if (!followedTeam) {
    return (
      <View style={styles.container}>
        {/* Fondo con círculos rojos */}
        <View style={styles.backgroundContainer}>
        </View>

        <View style={styles.centerContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/InterLOGO.png')}
              style={styles.appLogo}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.emptyTitle}>Selecciona tu equipo</Text>
          <Text style={styles.emptyText}>Busca y elige el equipo que quieres seguir en esta categoría</Text>

          {/* Botón rojo grande */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearchModal(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="magnify" size={24} color={colors.white} />
            <Text style={styles.searchButtonText}>Buscar Equipo</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de búsqueda */}
        <Modal
          visible={showSearchModal}
          onClose={() => {
            setShowSearchModal(false);
            setSearchQuery('');
          }}
          title="Buscar Equipo"
        >
          <View style={styles.modalContent}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar equipo..."
              onClear={() => setSearchQuery('')}
            />

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {filteredEquipos.map((equipo) => (
                <TouchableOpacity
                  key={equipo.id_equipo}
                  style={styles.teamItem}
                  onPress={() => handleSelectTeam(equipo)}
                >
                  <Image
                    source={equipo.logo ? { uri: equipo.logo } : require('../../../assets/InterLOGO.png')}
                    style={styles.teamItemLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.teamItemName}>{equipo.nombre}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }

  const handleTeamPress = () => {
    try {
      navigation.navigate('TeamDetail', { equipoId: followedTeam.id_equipo });
    } catch (error) {
      // console.error('MyTeamEmbed - Navigation error:', error);
    }
  };

  // Obtener estadísticas del equipo
  // TODO: Load team stats from clasificacion API when available
  const teamStats = clasificaciones.find(c => c.id_equipo === followedTeam.id_equipo) || {
    pj: 0,
    gf: 0,
    puntos: 0,
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Card style={styles.teamCard}>
            <TouchableOpacity 
              onPress={handleTeamPress} 
              activeOpacity={0.7}
              accessible={true}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.teamHeader}>
                <Image
                  source={followedTeam.logo ? { uri: followedTeam.logo } : require('../../../assets/InterLOGO.png')}
                  style={styles.teamLogo}
                />
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{followedTeam.nombre}</Text>
                  <View style={styles.followingBadge}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                    <Text style={styles.followingText}>Siguiendo</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsSection}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{teamStats.pj}</Text>
                  <Text style={styles.statLabel}>Partidos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{teamStats.gf}</Text>
                  <Text style={styles.statLabel}>Goles</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{teamStats.puntos}</Text>
                  <Text style={styles.statLabel}>Puntos</Text>
                </View>
              </View>

              <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>Ver Detalles</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </Card>

          {/* Botón para cambiar equipo - FUERA de la tarjeta */}
          <TouchableOpacity
            style={styles.changeTeamButton}
            onPress={() => setShowSearchModal(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.white} />
            <Text style={styles.changeTeamButtonText}>Cambiar Equipo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de búsqueda (fuera del ScrollView) */}
      <Modal
        visible={showSearchModal}
        onClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
        }}
        title="Cambiar Equipo"
      >
        <View style={styles.modalContent}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar equipo..."
            onClear={() => setSearchQuery('')}
          />

          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {filteredEquipos.map((equipo) => (
              <TouchableOpacity
                key={equipo.id_equipo}
                style={styles.teamItem}
                onPress={() => handleSelectTeam(equipo)}
              >
                <Image
                  source={equipo.logo ? { uri: equipo.logo } : require('../../../assets/InterLOGO.png')}
                  style={styles.teamItemLogo}
                  resizeMode="contain"
                />
                <Text style={styles.teamItemName}>{equipo.nombre}</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: colors.primary,
  },
  circleTop: {
    width: 300,
    height: 300,
    top: -100,
    right: -50,
    opacity: 0.9,
  },
  circleBottom: {
    width: 250,
    height: 250,
    bottom: -80,
    left: -70,
    opacity: 0.8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 24,
  },
  appLogo: {
    width: 120,
    height: 120,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingTop: 16,
  },
  modalList: {
    flex: 1,
    marginTop: 16,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  selectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  teamCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  teamLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  teamInfo: {
    flex: 1,
  },
  arrowButton: {
    padding: 8,
    marginLeft: 8,
  },
  arrowButtonAbsolute: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  teamName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  followingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followingText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: colors.backgroundGray,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  changeTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    gap: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  changeTeamButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
  },
  teamsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamItemLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 16,
  },
  teamItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});