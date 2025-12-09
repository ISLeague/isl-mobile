import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

export const SuplantacionBanner: React.FC = () => {
  const { usuario, usuarioReal, restaurarIdentidad } = useAuth();

  if (!usuarioReal || !usuario) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="account-switch" size={20} color={colors.white} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Suplantando identidad</Text>
          <Text style={styles.subtitle}>
            Viendo como: {usuario.email} ({usuario.rol})
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={restaurarIdentidad}>
        <Text style={styles.buttonText}>Restaurar</Text>
        <MaterialCommunityIcons name="restore" size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
