import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GradientHeader, Card, Modal, SearchBar } from '../../components/common';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTeamFollow, useSearch } from '../../hooks';
import { Equipo, Jugador, ProximoPartido, Fotos } from '../../types';
import { formatDate } from '../../utils/formatters';
import { safeAsync, getUserFriendlyMessage } from '../../utils/errorHandling';

type Props = NativeStackScreenProps<any, 'MyTeam'>;

export const MyTeamScreen: React.FC<Props> = ({ navigation }) => {
  const { usuario, isGuest } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const { followedTeam, followTeam, changeTeam } = useTeamFollow(usuario?.id_usuario || 0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);

  // Mock data - TODO: Obtener de la API
  const availableTeams: Equipo[] = [
    {
      id_equipo: 1,
      nombre: 'Barcelona FC',
      logo: 'https://via.placeholder.com/50',
      id_edicion_categoria: 1,
    },
    {
      id_equipo: 2,
      nombre: 'Real Madrid',
      logo: 'https://via.placeholder.com/50',
      id_edicion_categoria: 1,
    },
    {
      id_equipo: 3,
      nombre: 'Manchester United',
      logo: 'https://via.placeholder.com/50',
      id_edicion_categoria: 1,
    },
  ];

  const {
    searchQuery,
    setSearchQuery,
    filteredData: filteredTeams,
    clearSearch,
  } = useSearch<Equipo>(availableTeams, 'nombre');

  // Mock data para el equipo seguido
  const teamPlayers: Jugador[] = [
    {
      id_jugador: 1,
      nombre_completo: 'Lionel Messi',
      numero_camiseta: 10,
      fecha_nacimiento: '1987-06-24',
      dni: '12345678',
      estado: 'activo',
      foto: 'https://via.placeholder.com/80',
    },
    {
      id_jugador: 2,
      nombre_completo: 'Cristiano Ronaldo',
      numero_camiseta: 7,
      fecha_nacimiento: '1985-02-05',
      dni: '87654321',
      estado: 'activo',
      foto: 'https://via.placeholder.com/80',
    },
  ];

  const teamStats = {
    partidos_jugados: 10,
    victorias: 7,
    empates: 2,
    derrotas: 1,
    goles_favor: 25,
    goles_contra: 8,
    posicion: 2,
  };

  const proximoPartido: ProximoPartido = {
    id_partido: 1,
    fecha: '2024-02-15',
    hora: '20:00',
    rival: {
      nombre: 'Real Madrid',
      logo: 'https://via.placeholder.com/50',
    },
    cancha: {
      nombre: 'Camp Nou',
      direccion: 'Barcelona',
    },
    local: true,
  };

  const teamPhotos: Fotos = {
    id_fotos: 1,
    link_fotos_totales: 'https://photos.example.com/album/123',
    link_preview: 'https://via.placeholder.com/300x200',
    id_equipo: 1,
  };

  const handleSelectTeam = useCallback(async (team: Equipo) => {
    // Verificar si es invitado
    if (isGuest) {
      showWarning(
        'Debes iniciar sesión para seguir equipos',
        'Funcionalidad no disponible'
      );
      return;
    }

    try {
      if (followedTeam) {
        await changeTeam(team);
        showSuccess(`Ahora sigues a ${team.nombre}`, 'Equipo cambiado');
      } else {
        await followTeam(team);
        showSuccess(`Ahora sigues a ${team.nombre}`, 'Equipo seleccionado');
      }
      setShowSearchModal(false);
      setShowChangeConfirm(false);
    } catch (error) {
      showError(
        getUserFriendlyMessage(error as Error),
        'Error al seleccionar equipo'
      );
    }
  }, [isGuest, followedTeam, changeTeam, followTeam, showSuccess, showError, showWarning]);

  const renderPlayerItem = useCallback(({ item }: { item: Jugador }) => (
    <TouchableOpacity
      style={styles.playerCard}
      onPress={() => navigation.navigate('PlayerDetail', { jugadorId: item.id_jugador })}
    >
      <Image
        source={{ uri: item.foto || 'https://via.placeholder.com/80' }}
        style={styles.playerPhoto}
      />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.nombre_completo}</Text>
        <View style={styles.playerNumber}>
          <MaterialCommunityIcons name="numeric" size={14} color={colors.textSecondary} />
          <Text style={styles.playerNumberText}>
            {item.numero_camiseta != null ? item.numero_camiseta : 'X'}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  ), [navigation]);

  const renderTeamSearchItem = useCallback(({ item }: { item: Equipo }) => (
    <TouchableOpacity
      style={styles.teamSearchItem}
      onPress={() => handleSelectTeam(item)}
    >
      <Image source={item.logo ? { uri: item.logo } : require('../../assets/InterLOGO.png')} style={styles.teamSearchLogo} />
      <Text style={styles.teamSearchName}>{item.nombre}</Text>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
    </TouchableOpacity>
  ), [handleSelectTeam]);

  // Vista cuando NO tiene equipo seguido
  if (!followedTeam) {
    return (
      <View style={styles.container}>
        <GradientHeader title="Mi Equipo" onBackPress={() => navigation.goBack()} />
        
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={isGuest ? "account-lock" : "shield-search"}
            size={80}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>
            {isGuest ? 'Funcionalidad no disponible' : 'No sigues ningún equipo'}
          </Text>
          <Text style={styles.emptyText}>
            {isGuest 
              ? 'Debes iniciar sesión o crear una cuenta para seguir equipos, ver fotos y acceder a todas las funcionalidades de ISL'
              : 'Busca y selecciona un equipo para seguir sus partidos y jugadores'
            }
          </Text>
          
          {isGuest ? (
            <View style={styles.guestButtonsContainer}>
              <TouchableOpacity
                style={styles.guestLoginButton}
                onPress={() => {
                  navigation.navigate('Login');
                }}
              >
                <MaterialCommunityIcons name="login" size={24} color={colors.white} />
                <Text style={styles.guestLoginButtonText}>Iniciar Sesión</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.guestRegisterButton}
                onPress={() => {
                  navigation.navigate('Register');
                }}
              >
                <MaterialCommunityIcons name="account-plus" size={24} color={colors.primary} />
                <Text style={styles.guestRegisterButtonText}>Crear Cuenta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setShowSearchModal(true)}
            >
              <MaterialCommunityIcons name="magnify" size={24} color={colors.white} />
              <Text style={styles.searchButtonText}>Buscar Equipo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Modal de búsqueda */}
        <Modal
          visible={showSearchModal}
          onClose={() => {
            setShowSearchModal(false);
            clearSearch();
          }}
          title="Buscar Equipo"
        >
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre..."
            onClear={clearSearch}
          />
          <FlatList
            data={filteredTeams}
            keyExtractor={(item) => item.id_equipo.toString()}
            renderItem={renderTeamSearchItem}
            style={styles.teamSearchList}
            contentContainerStyle={styles.teamSearchListContent}
          />
        </Modal>
      </View>
    );
  }

  // Vista cuando SÍ tiene equipo seguido
  return (
    <View style={styles.container}>
      <GradientHeader title="Mi Equipo" onBackPress={() => navigation.goBack()} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header del equipo */}
        <Card style={styles.teamHeader}>
          <View style={styles.teamHeaderContent}>
            <Image
              source={followedTeam.logo ? { uri: followedTeam.logo } : require('../../assets/InterLOGO.png')}
              style={styles.teamLogo}
            />
            <View style={styles.teamHeaderInfo}>
              <Text style={styles.teamName}>{followedTeam.nombre}</Text>
              <View style={styles.positionBadge}>
                <MaterialCommunityIcons name="medal" size={16} color={colors.warning} />
                <Text style={styles.positionText}>{teamStats.posicion}° Posición</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setShowChangeConfirm(true)}
            >
              <MaterialCommunityIcons name="sync" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Estadísticas del equipo */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{teamStats.partidos_jugados}</Text>
              <Text style={styles.statLabel}>PJ</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {teamStats.victorias}
              </Text>
              <Text style={styles.statLabel}>V</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{teamStats.empates}</Text>
              <Text style={styles.statLabel}>E</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {teamStats.derrotas}
              </Text>
              <Text style={styles.statLabel}>D</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{teamStats.goles_favor}</Text>
              <Text style={styles.statLabel}>GF</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{teamStats.goles_contra}</Text>
              <Text style={styles.statLabel}>GC</Text>
            </View>
          </View>
        </Card>

        {/* Próximo partido */}
        <Card style={styles.nextMatchCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="soccer-field"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Próximo Partido</Text>
          </View>
          
          <View style={styles.matchContent}>
            <View style={styles.matchTeams}>
              <View style={styles.matchTeam}>
                <Image source={followedTeam.logo ? { uri: followedTeam.logo } : require('../../assets/InterLOGO.png')} style={styles.matchLogo} />
                <Text style={styles.matchTeamName}>{followedTeam.nombre}</Text>
              </View>
              
              <Text style={styles.vsText}>VS</Text>
              
              <View style={styles.matchTeam}>
                <Image source={proximoPartido.rival.logo ? { uri: proximoPartido.rival.logo } : require('../../assets/InterLOGO.png')} style={styles.matchLogo} />
                <Text style={styles.matchTeamName}>{proximoPartido.rival.nombre}</Text>
              </View>
            </View>
            
            <View style={styles.matchInfo}>
              <View style={styles.matchInfoRow}>
                <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
                <Text style={styles.matchInfoText}>{formatDate(proximoPartido.fecha)}</Text>
              </View>
              <View style={styles.matchInfoRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.matchInfoText}>{proximoPartido.hora}</Text>
              </View>
              <View style={styles.matchInfoRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color={colors.textSecondary} />
                <Text style={styles.matchInfoText}>{proximoPartido.cancha.nombre}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Plantilla */}
        <Card style={styles.playersCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Plantilla</Text>
          </View>
          
          {teamPlayers.map((player) => (
            <View key={player.id_jugador}>
              {renderPlayerItem({ item: player })}
            </View>
          ))}
        </Card>

        {/* Fotos del equipo */}
        <Card style={styles.photosCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Fotos del Equipo</Text>
          </View>
          
          <TouchableOpacity onPress={() => {/* TODO: Abrir galería */}}>
            <Image
              source={{ uri: teamPhotos.link_preview }}
              style={styles.photoPreview}
            />
            <View style={styles.photoOverlay}>
              <MaterialCommunityIcons name="image-multiple" size={32} color={colors.white} />
              <Text style={styles.photoOverlayText}>Ver Todas las Fotos</Text>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Modal de confirmación de cambio */}
      <Modal
        visible={showChangeConfirm}
        onClose={() => setShowChangeConfirm(false)}
        title="Cambiar de Equipo"
      >
        <Text style={styles.confirmText}>
          ¿Deseas dejar de seguir a {followedTeam.nombre} y buscar otro equipo?
        </Text>
        <View style={styles.confirmButtons}>
          <TouchableOpacity
            style={[styles.confirmButton, styles.cancelButton]}
            onPress={() => setShowChangeConfirm(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, styles.acceptButton]}
            onPress={() => {
              setShowChangeConfirm(false);
              setShowSearchModal(true);
            }}
          >
            <Text style={styles.acceptButtonText}>Buscar Equipo</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal de búsqueda */}
      <Modal
        visible={showSearchModal}
        onClose={() => {
          setShowSearchModal(false);
          clearSearch();
        }}
        title="Buscar Equipo"
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre..."
          onClear={clearSearch}
        />
        <FlatList
          data={filteredTeams}
          keyExtractor={(item) => item.id_equipo.toString()}
          renderItem={renderTeamSearchItem}
          style={styles.teamSearchList}
          contentContainerStyle={styles.teamSearchListContent}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  // Estado vacío
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  // Header del equipo
  teamHeader: {
    margin: 16,
    marginBottom: 12,
  },
  teamHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 70,
    height: 70,
  },
  teamHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  changeButton: {
    padding: 8,
  },
  // Estadísticas
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Próximo partido
  nextMatchCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  matchContent: {
    gap: 16,
  },
  matchTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTeam: {
    flex: 1,
    alignItems: 'center',
  },
  matchLogo: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  matchTeamName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginHorizontal: 16,
  },
  matchInfo: {
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchInfoText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  // Plantilla
  playersCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  playerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  playerNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerNumberText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Fotos
  photosCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 12,
  },
  photoOverlayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 8,
  },
  // Modal de búsqueda
  teamSearchList: {
    maxHeight: 400,
    marginTop: 16,
  },
  teamSearchListContent: {
    gap: 8,
  },
  teamSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  teamSearchLogo: {
    width: 40,
    height: 40,
  },
  teamSearchName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Modal de confirmación
  confirmText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginVertical: 24,
    lineHeight: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundGray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Estilos para invitados
  guestButtonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  guestLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  guestLoginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  guestRegisterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundGray,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestRegisterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
