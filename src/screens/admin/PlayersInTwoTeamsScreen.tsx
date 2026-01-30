import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';

interface EquipoInfo {
  id_equipo: number;
  nombre: string;
  categoria: string;
}

interface PlayerInTwoTeams {
  dni: string;
  nombre_completo: string;
  equipos: EquipoInfo[];
}

export const PlayersInTwoTeamsScreen = ({ navigation, route }: any) => {
  const { torneo, edicion, pais } = route.params;

  const [loading, setLoading] = useState(true);
  const [playersInTwoTeams, setPlayersInTwoTeams] = useState<PlayerInTwoTeams[]>([]);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    loadPlayersInTwoTeams();
  }, []);

  const loadPlayersInTwoTeams = async () => {
    try {
      setLoading(true);
      setProgress('Cargando categorías...');

      // 1. Cargar categorías de la edición
      const categoriasResponse = await api.edicionCategorias.list({
        id_edicion: edicion.id_edicion,
      });

      // Manejar diferentes formatos de respuesta
      let categorias = categoriasResponse.data?.data || categoriasResponse.data || [];
      if (!Array.isArray(categorias)) {
        categorias = [];
      }

      //console.log(`Encontradas ${categorias.length} categorías`);

      // Mapa para guardar jugadores por DNI
      const playersByDni: Map<string, { nombre_completo: string; equipos: EquipoInfo[] }> = new Map();

      // 2. Para cada categoría, cargar equipos y jugadores
      for (let i = 0; i < categorias.length; i++) {
        const categoria = categorias[i];
        const categoriaNombre = categoria.categoria?.nombre || `Categoría ${i + 1}`;
        setProgress(`Procesando ${categoriaNombre}...`);

        try {
          // Cargar equipos de esta categoría
          const equiposResponse = await api.equipos.list(categoria.id_edicion_categoria);
          let equipos = equiposResponse.data || [];
          if (!Array.isArray(equipos)) {
            equipos = [];
          }

          //console.log(`  - ${equipos.length} equipos en ${categoriaNombre}`);

          for (const equipo of equipos) {
            try {
              // Cargar jugadores del equipo
              const jugadoresResponse = await api.jugadores.list(equipo.id_equipo);

              // Manejar diferentes formatos de respuesta
              let jugadores = jugadoresResponse.data?.jugadores || jugadoresResponse.data || [];
              if (!Array.isArray(jugadores)) {
                jugadores = [];
              }

              for (const jugador of jugadores) {
                if (jugador.dni && jugador.dni.trim()) {
                  const dniNormalizado = jugador.dni.trim().toLowerCase();

                  const equipoInfo: EquipoInfo = {
                    id_equipo: equipo.id_equipo,
                    nombre: equipo.nombre,
                    categoria: categoriaNombre,
                  };

                  if (playersByDni.has(dniNormalizado)) {
                    const existing = playersByDni.get(dniNormalizado)!;
                    // Verificar que no sea el mismo equipo
                    const yaEstaEnEquipo = existing.equipos.some(
                      e => e.id_equipo === equipo.id_equipo
                    );
                    if (!yaEstaEnEquipo) {
                      existing.equipos.push(equipoInfo);
                    }
                  } else {
                    playersByDni.set(dniNormalizado, {
                      nombre_completo: jugador.nombre_completo,
                      equipos: [equipoInfo],
                    });
                  }
                }
              }
            } catch (error) {
              //console.log(`Error cargando jugadores de ${equipo.nombre}:`, error);
            }
          }
        } catch (error) {
          //console.log(`Error cargando equipos de ${categoriaNombre}:`, error);
        }
      }

      // 3. Filtrar solo jugadores que están en 2+ equipos
      const duplicados: PlayerInTwoTeams[] = [];
      playersByDni.forEach((value, dni) => {
        if (value.equipos.length >= 2) {
          duplicados.push({
            dni: dni.toUpperCase(),
            nombre_completo: value.nombre_completo,
            equipos: value.equipos,
          });
        }
      });

      // Ordenar por nombre
      duplicados.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));

      //console.log(`Total jugadores en 2+ equipos: ${duplicados.length}`);
      setPlayersInTwoTeams(duplicados);
    } catch (error) {
      //console.error('Error loading players:', error);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analizando jugadores...</Text>
          <Text style={styles.loadingSubtext}>{progress}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{'←'}</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {pais?.emoji && <Text style={styles.paisEmoji}>{pais.emoji}</Text>}
            <View style={styles.headerText}>
              <Text style={styles.title}>Jugadores en 2 Equipos</Text>
              <Text style={styles.subtitle}>
                {torneo.nombre} - Edición {edicion.numero}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoBannerText}>
            Jugadores registrados en múltiples equipos dentro de esta edición (pueden estar en diferentes categorías).
          </Text>
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          {playersInTwoTeams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={64}
                color={colors.success}
              />
              <Text style={styles.emptyTitle}>No hay jugadores en dos equipos</Text>
              <Text style={styles.emptySubtitle}>
                Todos los jugadores están registrados en un solo equipo dentro de esta edición.
              </Text>
            </View>
          ) : (
            <View style={styles.playersList}>
              <View style={styles.countHeader}>
                <Text style={styles.countText}>
                  {playersInTwoTeams.length} jugador{playersInTwoTeams.length !== 1 ? 'es' : ''} encontrado{playersInTwoTeams.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {playersInTwoTeams.map((player, index) => (
                <View key={player.dni + index} style={styles.playerCard}>
                  <View style={styles.playerHeader}>
                    <MaterialCommunityIcons
                      name="account-alert"
                      size={28}
                      color={colors.warning}
                    />
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.nombre_completo}</Text>
                      <Text style={styles.playerDni}>DNI: {player.dni}</Text>
                    </View>
                    <View style={styles.teamCountBadge}>
                      <Text style={styles.teamCountText}>{player.equipos.length}</Text>
                    </View>
                  </View>

                  <View style={styles.teamsContainer}>
                    {player.equipos.map((item, idx) => (
                      <View key={item.id_equipo} style={styles.teamRow}>
                        <View style={styles.teamBullet}>
                          <Text style={styles.bulletText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.teamInfo}>
                          <Text style={styles.teamName}>{item.nombre}</Text>
                          <Text style={styles.teamCategory}>{item.categoria}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  paisEmoji: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  playersList: {
    gap: 12,
  },
  countHeader: {
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  playerCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  playerDni: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  teamCountBadge: {
    backgroundColor: colors.warning,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  teamsContainer: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamBullet: {
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  teamCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default PlayersInTwoTeamsScreen;
