import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientHeader, Card } from '../../components/common';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Torneo, Edicion, Usuario } from '../../types';

interface TournamentAdminDashboardScreenProps {
  navigation: any;
}

export const TournamentAdminDashboardScreen: React.FC<TournamentAdminDashboardScreenProps> = ({ navigation }) => {
  const { usuario, suplantarIdentidad, usuarioReal } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => setLoading(false), 300);
  }, []);

  const handleTournamentPress = (torneo: Torneo, edicion: Edicion) => {
    navigation.navigate('TournamentCategories', {
      torneo,
      pais: torneo.pais,
    });
  };

  const handleProfile = () => {
    navigation.navigate('Main', {
      screen: 'Profile',
    });
  };

  const handleVerComoFan = () => {
    if (!usuario) return;
    
    // Si ya está suplantando, no hacer nada (ya es fan)
    if (usuarioReal) {
      navigation.navigate('Main', {
        screen: 'Home',
      });
      return;
    }
    
    // Crear un usuario fan temporal para suplantar
    const fanTemporal: Usuario = {
      id_usuario: 999999, // ID temporal
      email: `fan.temporal.${usuario.id_usuario}@isl.com`,
      rol: 'fan',
      id_pais: usuario.id_pais || 0,
      id_admin_suplantando: usuario.id_usuario,
    };
    
    // Usar suplantarIdentidad para cambiar el contexto
    suplantarIdentidad(fanTemporal.id_usuario);
    
    // Actualizar el usuario manualmente para que sea fan
    // (Esto es temporal hasta que la API real maneje la suplantación)
    setTimeout(() => {
      navigation.navigate('Main', {
        screen: 'Home',
      });
    }, 100);
  };

  if (!usuario?.torneos || usuario.torneos.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <GradientHeader
          title="Mis Torneos"
          rightElement={
            <TouchableOpacity onPress={handleProfile} style={styles.profileButton}>
              <MaterialCommunityIcons name="account-circle" size={28} color={colors.white} />
            </TouchableOpacity>
          }
        />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="trophy-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Sin torneos asignados</Text>
          <Text style={styles.emptyText}>
            No tienes torneos asignados actualmente. Contacta con el administrador.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Mis Torneos"
        rightElement={
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleVerComoFan} style={styles.fanButton}>
              <MaterialCommunityIcons name="eye" size={24} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleProfile} style={styles.profileButton}>
              <MaterialCommunityIcons name="account-circle" size={28} color={colors.white} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>¡Hola, Admin!</Text>
          <Text style={styles.subtitleText}>
            Tienes {usuario.torneos.length} {usuario.torneos.length === 1 ? 'torneo asignado' : 'torneos asignados'}
          </Text>
        </View>

        <View style={styles.tournamentsSection}>
          <Text style={styles.sectionTitle}>Tus Torneos</Text>
          
          {usuario.torneos.map((torneo: Torneo, index: number) => {
            const edicion = usuario.ediciones?.[index];
            if (!edicion) return null;

            return (
              <TouchableOpacity
                key={torneo.id_torneo}
                onPress={() => handleTournamentPress(torneo, edicion)}
                activeOpacity={0.7}
              >
                <Card style={styles.tournamentCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons name="trophy" size={32} color={colors.primary} />
                    </View>
                    <View style={styles.tournamentInfo}>
                      <Text style={styles.tournamentName}>{torneo.nombre}</Text>
                      <Text style={styles.editionText}>Edición {edicion.numero}</Text>
                      {torneo.pais && (
                        <View style={styles.countryRow}>
                          <Text style={styles.countryEmoji}>{torneo.pais.emoji}</Text>
                          <Text style={styles.countryName}>{torneo.pais.nombre}</Text>
                        </View>
                      )}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.quickAction}>
                      <MaterialCommunityIcons name="format-list-bulleted" size={16} color={colors.info} />
                      <Text style={styles.quickActionText}>Gestionar Categorías</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Selecciona un torneo para gestionar sus categorías, equipos y partidos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fanButton: {
    padding: 4,
  },
  profileButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tournamentsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  tournamentCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  editionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  countryEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  countryName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 13,
    color: colors.info,
    marginLeft: 6,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.info}15`,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    marginLeft: 8,
    lineHeight: 18,
  },
});
