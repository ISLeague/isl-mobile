import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { minigamesService, Sala, SalaJugador } from '../../../api/services/minigames.service';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

interface Props {
  navigation: any;
  route: {
    params: {
      id_sala: string;
      codigo_sala: string;
      isHost: boolean;
    };
  };
}

export const ImpostorLobbyScreen = ({ navigation, route }: Props) => {
  const { id_sala, codigo_sala } = route.params;
  const { user } = useAuth();
  
  const [sala, setSala] = useState<Sala | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingGame, setStartingGame] = useState(false);

  const loadSala = async () => {
    try {
      const data = await minigamesService.getSala({ id_sala });
      setSala(data);
    } catch (error) {
      console.error('Error loading sala:', error);
      Alert.alert('Error', 'No se pudo cargar la sala');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Cargar sala inicialmente y cada 3 segundos (polling)
  useFocusEffect(
    useCallback(() => {
      loadSala();
      const interval = setInterval(loadSala, 3000);
      return () => clearInterval(interval);
    }, [id_sala])
  );

  const isHost = sala?.id_host === user?.id;

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(codigo_sala);
    Alert.alert('Copiado', 'Código copiado al portapapeles');
  };

  const handleStartRound = async () => {
    if (!sala || sala.jugadores.length < 3) {
      Alert.alert('Error', 'Se necesitan al menos 3 jugadores');
      return;
    }

    setStartingGame(true);
    try {
      await minigamesService.startRound(id_sala);
      navigation.navigate('ImpostorGame', { id_sala, codigo_sala });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'No se pudo iniciar');
    } finally {
      setStartingGame(false);
    }
  };

  const handleLeaveSala = async () => {
    Alert.alert(
      'Salir de la sala',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await minigamesService.leaveSala(id_sala);
              navigation.goBack();
            } catch (error) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const getModoLabel = (modo: string) => {
    switch (modo) {
      case 'jugadores': return '⚽ Jugadores';
      case 'clubes': return '🛡️ Clubes';
      case 'mixto': return '🔀 Mixto';
      default: return modo;
    }
  };

  const renderJugador = ({ item, index }: { item: SalaJugador; index: number }) => {
    const esHost = sala?.id_host === item.id_usuario;
    const esTu = user?.id === item.id_usuario;

    return (
      <View style={styles.jugadorItem}>
        <View style={styles.jugadorAvatar}>
          <MaterialCommunityIcons
            name="account"
            size={28}
            color={colors.white}
          />
        </View>
        <View style={styles.jugadorInfo}>
          <Text style={styles.jugadorNombre}>
            {item.nombre_display}
            {esTu && ' (Tú)'}
          </Text>
          {esHost && (
            <View style={styles.hostBadge}>
              <MaterialCommunityIcons name="crown" size={12} color={colors.warning} />
              <Text style={styles.hostText}>Host</Text>
            </View>
          )}
        </View>
        <Text style={styles.jugadorNumero}>#{index + 1}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando sala...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleLeaveSala}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sala de Espera</Text>
      </View>

      {/* Código de Sala */}
      <TouchableOpacity style={styles.codeContainer} onPress={handleCopyCode}>
        <Text style={styles.codeLabel}>Código de sala</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{codigo_sala}</Text>
          <MaterialCommunityIcons name="content-copy" size={24} color={colors.primary} />
        </View>
        <Text style={styles.codeTip}>Toca para copiar</Text>
      </TouchableOpacity>

      {/* Info de la sala */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Modo</Text>
          <Text style={styles.infoValue}>{getModoLabel(sala?.modo_juego || '')}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Jugadores</Text>
          <Text style={styles.infoValue}>{sala?.jugadores.length || 0}</Text>
        </View>
      </View>

      {/* Lista de Jugadores */}
      <View style={styles.jugadoresContainer}>
        <Text style={styles.jugadoresTitle}>Jugadores en la sala</Text>
        <FlatList
          data={sala?.jugadores || []}
          renderItem={renderJugador}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.jugadoresList}
        />
      </View>

      {/* Botón de Iniciar (solo host) */}
      {isHost && (
        <View style={styles.footer}>
          {(sala?.jugadores.length || 0) < 3 ? (
            <Text style={styles.waitingText}>
              Esperando jugadores... ({sala?.jugadores.length}/3 mínimo)
            </Text>
          ) : (
            <TouchableOpacity
              style={[styles.startButton, startingGame && styles.buttonDisabled]}
              onPress={handleStartRound}
              disabled={startingGame}
            >
              {startingGame ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="play" size={28} color={colors.white} />
                  <Text style={styles.startButtonText}>Iniciar Ronda</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Mensaje para no-host */}
      {!isHost && (
        <View style={styles.footer}>
          <Text style={styles.waitingText}>
            Esperando a que el host inicie la partida...
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  codeContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: colors.primary,
  },
  codeTip: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  jugadoresContainer: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 16,
  },
  jugadoresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  jugadoresList: {
    gap: 8,
  },
  jugadorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
  },
  jugadorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jugadorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jugadorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hostText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  jugadorNumero: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
  },
  waitingText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textLight,
    paddingVertical: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
