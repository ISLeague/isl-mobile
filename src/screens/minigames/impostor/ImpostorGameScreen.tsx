import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { minigamesService, MiCarta, Sala } from '../../../api/services/minigames.service';
import { useAuth } from '../../../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
  route: {
    params: {
      id_sala: string;
      codigo_sala: string;
    };
  };
}

export const ImpostorGameScreen = ({ navigation, route }: Props) => {
  const { id_sala, codigo_sala } = route.params;
  const { user } = useAuth();
  
  const [carta, setCarta] = useState<MiCarta | null>(null);
  const [sala, setSala] = useState<Sala | null>(null);
  const [loading, setLoading] = useState(true);
  const [endingGame, setEndingGame] = useState(false);

  const loadData = async () => {
    try {
      const [cartaData, salaData] = await Promise.all([
        minigamesService.getMyCard(id_sala),
        minigamesService.getSala({ id_sala }),
      ]);
      setCarta(cartaData);
      setSala(salaData);

      // Si la sala volvió a 'esperando', volver al lobby
      if (salaData.estado === 'esperando') {
        navigation.replace('ImpostorLobby', { id_sala, codigo_sala, isHost: false });
      }
    } catch (error) {
      console.error('Error loading game:', error);
      Alert.alert('Error', 'No se pudo cargar el juego');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Polling cada 3 segundos para detectar fin de partida
    const interval = setInterval(async () => {
      try {
        const salaData = await minigamesService.getSala({ id_sala });
        if (salaData.estado === 'esperando') {
          navigation.replace('ImpostorLobby', { id_sala, codigo_sala, isHost: false });
        }
      } catch (error) {
        // Ignorar errores de polling
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [id_sala]);

  const isHost = sala?.id_host === user?.id;

  const handleEndGame = async () => {
    Alert.alert(
      'Terminar Partida',
      '¿Estás seguro de que quieres terminar la partida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'destructive',
          onPress: async () => {
            setEndingGame(true);
            try {
              await minigamesService.endGame(id_sala);
              navigation.replace('ImpostorLobby', { id_sala, codigo_sala, isHost: true });
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error?.message || 'No se pudo terminar');
            } finally {
              setEndingGame(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tu carta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roundText}>Ronda {carta?.ronda || 1}</Text>
      </View>

      {/* Carta */}
      <View style={styles.cardContainer}>
        {carta?.es_impostor ? (
          // CARTA DEL IMPOSTOR
          <View style={[styles.card, styles.impostorCard]}>
            <View style={styles.impostorIconContainer}>
              <MaterialCommunityIcons
                name="incognito"
                size={100}
                color={colors.white}
              />
            </View>
            <Text style={styles.impostorTitle}>¡ERES EL IMPOSTOR!</Text>
            <Text style={styles.impostorSubtitle}>
              Finge que sabes quién es el jugador/club...
            </Text>
            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="eye-off" size={24} color={colors.error} />
              <Text style={styles.warningText}>¡No muestres tu pantalla!</Text>
            </View>
          </View>
        ) : (
          // CARTA NORMAL
          <View style={styles.card}>
            {carta?.contenido?.imagen_url ? (
              <Image
                source={{ uri: carta.contenido.imagen_url }}
                style={styles.cardImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.cardPlaceholder}>
                <MaterialCommunityIcons
                  name={carta?.contenido?.tipo === 'club' ? 'shield' : 'account'}
                  size={80}
                  color={colors.primary}
                />
              </View>
            )}
            <Text style={styles.cardName}>{carta?.contenido?.nombre || 'Desconocido'}</Text>
            <View style={styles.tipoBadge}>
              <MaterialCommunityIcons
                name={carta?.contenido?.tipo === 'club' ? 'shield' : 'soccer'}
                size={16}
                color={colors.white}
              />
              <Text style={styles.tipoText}>
                {carta?.contenido?.tipo === 'club' ? 'Club' : 'Jugador'}
              </Text>
            </View>
            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="eye-off" size={24} color={colors.warning} />
              <Text style={styles.warningText}>¡No muestres tu pantalla!</Text>
            </View>
          </View>
        )}
      </View>

      {/* Instrucciones */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          {carta?.es_impostor
            ? 'Intenta descubrir qué jugador o club tienen los demás sin que te descubran.'
            : 'Encuentra al impostor. Él no sabe qué jugador/club tienes tú.'}
        </Text>
      </View>

      {/* Botón Terminar (solo host) */}
      {isHost && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.endButton, endingGame && styles.buttonDisabled]}
            onPress={handleEndGame}
            disabled={endingGame}
          >
            {endingGame ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="stop" size={24} color={colors.white} />
                <Text style={styles.endButtonText}>Terminar Partida</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.white,
  },
  roundText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: width - 48,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  impostorCard: {
    backgroundColor: '#1a1a2e',
  },
  impostorIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  impostorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'center',
  },
  impostorSubtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
  },
  cardImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tipoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,193,7,0.1)',
    borderRadius: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  instructions: {
    padding: 20,
    marginHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
