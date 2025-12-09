import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { mockApi } from '../../api/mockApi';

export const TournamentDetailScreen = ({ navigation, route }: any) => {
  const { torneo } = route.params;
  const [ediciones, setEdiciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEdiciones();
  }, []);

  const loadEdiciones = async () => {
    try {
      const data = await mockApi.main.getEditionsByTournament(torneo.id_torneo);
      setEdiciones(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminOptions = [
    {
      section: 'Configuración',
      items: [
        { icon: '📋', title: 'Ediciones', subtitle: 'Gestionar temporadas', screen: 'ManageEditions' },
        { icon: '🏅', title: 'Categorías', subtitle: 'SUB16, SUB18, etc.', screen: 'ManageCategories' },
      ],
    },
    {
      section: 'Competición',
      items: [
        { icon: '⚽', title: 'Equipos', subtitle: 'Gestionar equipos', screen: 'ManageTeams' },
        { icon: '👥', title: 'Jugadores', subtitle: 'Plantillas', screen: 'ManagePlayers' },
        { icon: '📊', title: 'Grupos', subtitle: 'Fase de grupos', screen: 'ManageGroups' },
        { icon: '📅', title: 'Fixture', subtitle: 'Calendario de partidos', screen: 'ManageFixture' },
      ],
    },
    {
      section: 'Resultados',
      items: [
        { icon: '⚽', title: 'Cargar Resultados', subtitle: 'Marcadores y eventos', screen: 'LoadResults' },
        { icon: '📈', title: 'Clasificación', subtitle: 'Tabla de posiciones', screen: 'Standings' },
        { icon: '🏆', title: 'Eliminatorias', subtitle: 'Knockout/Playoff', screen: 'ManageKnockout' },
      ],
    },
    {
      section: 'Contenido',
      items: [
        { icon: '📸', title: 'Fotos', subtitle: 'Galerías de equipos', screen: 'ManagePhotos' },
        { icon: '🔔', title: 'Notificaciones', subtitle: 'Avisos a usuarios', screen: 'SendNotifications' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{torneo.nombre}</Text>
          <Text style={styles.subtitle}>Panel de Administración</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{ediciones.length}</Text>
            <Text style={styles.statLabel}>Ediciones</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>16</Text>
            <Text style={styles.statLabel}>Equipos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>48</Text>
            <Text style={styles.statLabel}>Partidos</Text>
          </View>
        </View>

        {/* Admin Options */}
        {adminOptions.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.optionCard}
                onPress={() => {
                  navigation.navigate(item.screen, { torneo });
                }}
              >
                <View style={styles.optionIcon}>
                  <Text style={styles.optionEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{item.title}</Text>
                  <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.optionArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
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
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  optionArrow: {
    fontSize: 24,
    color: colors.textLight,
  },
});

export default TournamentDetailScreen;