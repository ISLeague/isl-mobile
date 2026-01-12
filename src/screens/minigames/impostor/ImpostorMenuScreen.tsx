import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { minigamesService } from '../../../api/services/minigames.service';

type ModoJuego = 'jugadores' | 'clubes' | 'mixto';

export const ImpostorMenuScreen = ({ navigation }: any) => {
  const [codigoSala, setCodigoSala] = useState('');
  const [modoJuego, setModoJuego] = useState<ModoJuego>('jugadores');
  const [loading, setLoading] = useState(false);

  const handleCreateSala = async () => {
    setLoading(true);
    try {
      // ID 1 es el minijuego Impostor (ajusta según tu BD)
      const result = await minigamesService.createSala(1, modoJuego);
      navigation.navigate('ImpostorLobby', { 
        id_sala: result.id_sala,
        codigo_sala: result.codigo_sala,
        isHost: true
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'No se pudo crear la sala');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSala = async () => {
    if (codigoSala.length < 4) {
      Alert.alert('Error', 'Ingresa un código válido');
      return;
    }

    setLoading(true);
    try {
      const result = await minigamesService.joinSala(codigoSala.toUpperCase());
      navigation.navigate('ImpostorLobby', { 
        id_sala: result.id_sala,
        codigo_sala: result.codigo_sala,
        isHost: false
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'No se pudo unir a la sala');
    } finally {
      setLoading(false);
    }
  };

  const modos: { key: ModoJuego; label: string; icon: string }[] = [
    { key: 'jugadores', label: 'Jugadores', icon: 'account' },
    { key: 'clubes', label: 'Clubes', icon: 'shield' },
    { key: 'mixto', label: 'Mixto', icon: 'shuffle-variant' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="incognito"
              size={60}
              color={colors.white}
            />
          </View>
          <Text style={styles.title}>Impostor</Text>
          <Text style={styles.subtitle}>
            Adivina quién es el impostor entre tus amigos
          </Text>
        </View>

        {/* Crear Sala */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆕 Crear Sala</Text>
          
          <Text style={styles.label}>Modo de juego</Text>
          <View style={styles.modoContainer}>
            {modos.map((modo) => (
              <TouchableOpacity
                key={modo.key}
                style={[
                  styles.modoButton,
                  modoJuego === modo.key && styles.modoButtonActive,
                ]}
                onPress={() => setModoJuego(modo.key)}
              >
                <MaterialCommunityIcons
                  name={modo.icon as any}
                  size={24}
                  color={modoJuego === modo.key ? colors.white : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.modoText,
                    modoJuego === modo.key && styles.modoTextActive,
                  ]}
                >
                  {modo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleCreateSala}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
                <Text style={styles.primaryButtonText}>Crear Sala</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Separador */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>o</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Unirse a Sala */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Unirse a Sala</Text>
          
          <Text style={styles.label}>Código de sala</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: ABC123"
            placeholderTextColor={colors.textLight}
            value={codigoSala}
            onChangeText={(text) => setCodigoSala(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={handleJoinSala}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="login" size={24} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Unirse</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: colors.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 20,
    padding: 8,
  },
  headerIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  section: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  modoButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
    gap: 4,
  },
  modoButtonActive: {
    backgroundColor: colors.primary,
  },
  modoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modoTextActive: {
    color: colors.white,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textLight,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
    color: colors.textPrimary,
  },
});
