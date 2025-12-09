import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface FixtureEmbedProps {
  navigation: any;
  isAdmin?: boolean;
  idEdicionCategoria?: number;
}

export const FixtureEmbed: React.FC<FixtureEmbedProps> = ({ navigation, isAdmin = false, idEdicionCategoria }) => {
  const handleOpenFixture = () => {
    navigation.navigate('FixtureManagement', { isAdmin, idEdicionCategoria });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="calendar-month" size={80} color={colors.primary} />
        <Text style={styles.title}>Gestión de Fixture</Text>
        <Text style={styles.description}>
          {isAdmin 
            ? 'Administra rondas, partidos y genera fixture automático para los grupos'
            : 'Consulta el calendario completo de partidos y sus resultados'
          }
        </Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleOpenFixture}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-right-circle" size={24} color={colors.white} />
          <Text style={styles.buttonText}>
            {isAdmin ? 'Administrar Fixture' : 'Ver Fixture'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
