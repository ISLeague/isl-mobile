import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import * as DocumentPicker from 'expo-document-picker';
import { GradientHeader, FAB, Card, InfoCard, Skeleton } from '../../components/common';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import { calculateAge } from '../../utils';
import api from '../../api';
import type { Equipo, EstadisticasDetalleEquipo, ImagenEquipo } from '../../api/types/equipos.types';
import { getLogoUri } from '../../utils/imageUtils';
import type { Jugador } from '../../api/types/jugadores.types';
import type { Grupo } from '../../api/types/grupos.types';
import type { Partido } from '../../api/types/partidos.types';

interface TeamDetailScreenProps {
  navigation: any;
  route: any;
}

// Helper para colores de posición
const getBadgeColor = (posicion?: string) => {
  const pos = posicion?.toLowerCase() || '';
  if (pos.includes('portero') || pos.includes('arquero')) return '#FFD700'; // Gold
  if (pos.includes('defensa')) return '#C0C0C0'; // Silver
  if (pos.includes('medio') || pos.includes('volante')) return '#CD7F32'; // Bronze
  return '#E5E4E2'; // Light Silver / Platinum (Delantero y otros)
};

export const TeamDetailScreen: React.FC<TeamDetailScreenProps> = ({ navigation, route }) => {
  const { equipoId } = route.params as { equipoId: number };
  const { isAdmin } = useAuth();
  const pagerRef = useRef<PagerView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { showSuccess, showError, showWarning } = useToast();

  // Estado de carga
  const [loading, setLoading] = useState(true);

  // Tabs - Fotos se muestra para todos
  const tabs = [
    { id: 'estadisticas', label: 'Estadísticas' },
    { id: 'jugadores', label: 'Jugadores' },
    { id: 'fotos', label: 'Fotos' },
  ];

  const [activeTab, setActiveTab] = useState('estadisticas');

  // Estado del equipo y datos relacionados - se cargan desde la API
  const [equipo, setEquipo] = useState<Equipo>();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [estadisticasEquipo, setEstadisticasEquipo] = useState<EstadisticasDetalleEquipo | null>(null);
  const [grupoEquipo, setGrupoEquipo] = useState<Grupo | null>(null);
  const [imagenesEquipo, setImagenesEquipo] = useState<ImagenEquipo[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Cargar datos del equipo, jugadores y estadísticas desde la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Load team data
        const equipoResponse = await api.equipos.getById(equipoId);
        if (equipoResponse.data) {
          setEquipo(equipoResponse.data);
        }

        // Load players by team ID
        const jugadoresResponse = await api.jugadores.list(equipoId);
        if (jugadoresResponse.success && jugadoresResponse.data.jugadores) {
          setJugadores(jugadoresResponse.data.jugadores);
        }

        // TODO: Load team statistics from API
        // For now, set default values
        setEstadisticasEquipo({
          partidos_jugados: 0,
          partidos_ganados: 0,
          partidos_empatados: 0,
          partidos_perdidos: 0,
          goles_favor: 0,
          goles_contra: 0,
          diferencia_goles: 0,
          puntos: 0,
          posicion: 0,
          tarjetas_amarillas: 0,
          tarjetas_rojas: 0,
        });

        // TODO: Load group information from API
        // For now, set to null
        setGrupoEquipo(null);

      } catch (error) {
        console.error('Error fetching team data:', error);
        showError('No se pudo cargar la información del equipo');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [equipoId]);

  // Cargar imágenes del equipo cuando se navega al tab de fotos
  useEffect(() => {
    if (activeTab === 'fotos' && imagenesEquipo.length === 0 && !loadingImages) {
      const loadImagenes = async () => {
        setLoadingImages(true);
        const result = await safeAsync(
          async () => {
            const response = await api.equipos.getImagenes(equipoId);
            return response;
          },
          'TeamDetailScreen - loadImagenes',
          {
            fallbackValue: null,
            onError: (error) => {
              showError('No se pudieron cargar las imágenes del equipo', 'Error');
            }
          }
        );

        if (result && result.success) {
          setImagenesEquipo(result.data);
        }
        setLoadingImages(false);
      };

      loadImagenes();
    }
  }, [activeTab, equipoId]);

  const handleTabPress = (tabId: string, index: number) => {
    pagerRef.current?.setPage(index);
    setActiveTab(tabId);
  };

  const handleAddPlayer = () => {
    navigation.navigate('PlayerForm', { equipoId, mode: 'create' });
  };

  const handleImportCSV = () => {
    Alert.alert(
      'Formato del Archivo CSV',
      'El archivo CSV debe tener las siguientes columnas en este orden:\n\n' +
      '1. Nombre completo\n' +
      '2. DNI\n' +
      '3. Fecha de nacimiento (YYYY-MM-DD)\n' +
      '4. Número de camiseta (opcional)\n' +
      '5. Posición\n' +
      '6. Pie dominante\n' +
      '7. Altura en cm (opcional)\n' +
      '8. Peso en kg (opcional)\n' +
      '9. Nacionalidad\n' +
      '10. Es refuerzo (0 o 1)\n' +
      '11. Es capitán (0 o 1)\n\n' +
      'Ejemplo:\n' +
      'Juan Pérez,12345678,2000-05-15,10,Delantero,derecho,175,70,Argentina,0,0\n\n' +
      '¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Seleccionar CSV',
          onPress: async () => {
            try {
              // Pick CSV file from device
              const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
                copyToCacheDirectory: true,
              });

              if (result.canceled) {
                return;
              }

              const file = result.assets[0];

              // Show confirmation with filename
              Alert.alert(
                'Confirmar Importación',
                `Archivo seleccionado:\n${file.name}\n\n¿Deseas importar los jugadores de este archivo?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Importar',
                    onPress: async () => {
                      try {
                        // Create file object in React Native format
                        const csvFile = {
                          uri: file.uri,
                          type: 'text/csv',
                          name: file.name,
                        } as any;

                        // Upload CSV
                        const uploadResult = await safeAsync(
                          async () => {
                            const apiResponse = await api.jugadores.createBulk(equipoId, csvFile);
                            return apiResponse;
                          },
                          'importCSV',
                          {
                            severity: 'high',
                            fallbackValue: null,
                            onError: (error) => {
                              showError('Error al importar el archivo CSV', 'Error');
                            }
                          }
                        );

                        if (uploadResult && uploadResult.success) {
                          const { total_processed, successful, failed, errors } = uploadResult.data;

                          if (failed > 0) {
                            // Show errors
                            const errorMessages = errors.map((e: any) =>
                              `Fila ${e.row}: ${e.error}`
                            ).join('\n');

                            Alert.alert(
                              'Importación completada con errores',
                              `Total procesados: ${total_processed}\nExitosos: ${successful}\nFallidos: ${failed}\n\nErrores:\n${errorMessages}`,
                              [{ text: 'OK' }]
                            );
                          } else {
                            showSuccess(
                              `${successful} jugadores importados correctamente para ${equipo?.nombre}`,
                              '¡Éxito!'
                            );
                          }

                          // Reload players list
                          const jugadoresResponse = await api.jugadores.list(equipoId);
                          if (jugadoresResponse.success && jugadoresResponse.data.jugadores) {
                            setJugadores(jugadoresResponse.data.jugadores);
                          }
                        }
                      } catch (error) {
                        console.error('Error uploading CSV:', error);
                        showError('Error al importar el archivo', 'Error');
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error picking CSV:', error);
              showError('Error al seleccionar el archivo', 'Error');
            }
          }
        }
      ]
    );
  };

  const handleEditPlayer = (jugador: Jugador) => {
    navigation.navigate('PlayerForm', { equipoId, jugador, mode: 'edit' });
  };

  const handleDeletePlayer = (jugador: Jugador) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar a ${jugador.nombre_completo} del equipo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            console.log('Eliminando jugador:', jugador.id_jugador);
          },
        },
      ]
    );
  };

  const handleEditTeam = () => {
    navigation.navigate('EditTeam', { equipo });
  };

  const handleMoveToGroup = () => {
    navigation.navigate('MoveTeamToGroup', { equipo });
  };

  const handleViewPhotos = () => {
    navigation.navigate('TeamPhotos', { equipoId });
  };

  const handleClearRoster = () => {
    if (jugadores.length === 0) {
      showWarning('El equipo no tiene jugadores en su plantilla', 'Plantilla Vacía');
      return;
    }

    Alert.alert(
      'Vaciar Plantilla',
      `¿Estás seguro de que quieres eliminar TODOS los ${jugadores.length} jugadores de "${equipo?.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todos',
          style: 'destructive',
          onPress: async () => {
            await safeAsync(
              async () => {
                // TODO: Llamar a la API para eliminar todos los jugadores del equipo
                // await api.teams.clearRoster(equipoId);

                console.log('Vaciando plantilla del equipo:', equipoId);
                showSuccess(`Plantilla de "${equipo?.nombre ?? 'Equipo'}" vaciada exitosamente`, 'Plantilla Vaciada');

                // Opcional: Volver atrás o recargar
                // navigation.goBack();
              },
              'TeamDetailScreen - handleClearRoster',
              {
                onError: (error) => {
                  showError(error.message, 'Error al Vaciar Plantilla');
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleManagePhotoLinks = () => {
    Alert.alert(
      'Gestionar Enlaces de Fotos',
      '¿Qué enlace deseas actualizar?',
      [
        {
          text: 'Link de Preview',
          onPress: () => {
            // TODO: Abrir modal para actualizar link de preview
            Alert.prompt(
              'Actualizar Link de Preview',
              'Ingresa la URL del preview (ej: YouTube, Vimeo)',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Guardar',
                  onPress: (url?: string) => {
                    if (url) {
                      // TODO: Guardar en API
                      console.log('Nuevo link de preview:', url);
                      showSuccess('Link de preview actualizado', 'Éxito');
                    }
                  },
                },
              ],
              'plain-text',
              'https://www.youtube.com'
            );
          },
        },
        {
          text: 'Link de Compra',
          onPress: () => {
            // TODO: Abrir modal para actualizar link de compra
            Alert.prompt(
              'Actualizar Link de Compra',
              'Ingresa la URL de compra de fotos',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Guardar',
                  onPress: (url?: string) => {
                    if (url) {
                      // TODO: Guardar en API
                      console.log('Nuevo link de compra:', url);
                      showSuccess('Link de compra actualizado', 'Éxito');
                    }
                  },
                },
              ],
              'plain-text',
              'https://www.google.com'
            );
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderPlayerCard = (jugador: Jugador) => {
    const edad = calculateAge(jugador.fecha_nacimiento);

    // Check if player is a reinforcement (from API data)
    const esRefuerzo = jugador.es_refuerzo || false;

    // Formatear nombre según el rol del usuario
    const formatPlayerName = (nombreCompleto: string) => {
      if (isAdmin) {
        return nombreCompleto; // Admin ve nombre completo
      }

      // Fan: mostrar "Nombre A." (primera letra del apellido)
      const partes = nombreCompleto.trim().split(' ');
      if (partes.length === 1) {
        return partes[0]; // Si solo hay una palabra, mostrarla completa
      }

      const nombre = partes[0];
      const apellidoInicial = partes[partes.length - 1].charAt(0).toUpperCase();
      return `${nombre} ${apellidoInicial}.`;
    };

    if (loading) {
      return (
        <Card key={`skeleton-${jugador.id_jugador}`} style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <Skeleton width={50} height={50} borderRadius={8} />
            <View style={styles.playerInfo}>
              <Skeleton width={150} height={16} style={{ marginBottom: 8 }} />
              <Skeleton width={100} height={12} />
            </View>
          </View>
        </Card>
      );
    }

    return (
      <TouchableOpacity
        key={jugador.id_jugador}
        onPress={() => navigation.navigate('PlayerDetail', { playerId: jugador.id_jugador })}
        activeOpacity={0.7}
      >
        <Card style={styles.playerCard}>
          <View style={styles.playerHeader}>
            {/* Número de Camiseta con color según posición */}
            <View style={[
              styles.playerNumberBadge,
              { backgroundColor: getBadgeColor(jugador.posicion) }
            ]}>
              <Text style={styles.playerNumberText}>#{jugador.numero_camiseta}</Text>
            </View>
            <View style={styles.playerInfo}>
              <View style={styles.playerNameRow}>
                <Text style={styles.playerName}>{formatPlayerName(jugador.nombre_completo)}</Text>
                {esRefuerzo && (
                  <View style={styles.refuerzoBadge}>
                    <Text style={styles.refuerzoText}>R</Text>
                  </View>
                )}
              </View>
              {/* Mostrar edad solo para admin */}
              {isAdmin && (
                <Text style={styles.playerDetails}>
                  {edad} años
                </Text>
              )}
              {/* Mostrar DNI solo para admin */}
              {isAdmin && (
                <Text style={styles.playerDetails}>
                  DNI: {jugador.dni}
                </Text>
              )}
            </View>
            {isAdmin && (
              <View style={styles.playerActions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditPlayer(jugador);
                  }}
                  style={styles.actionButton}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePlayer(jugador);
                  }}
                  style={styles.actionButton}
                >
                  <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Mostrar loading mientras se carga el equipo
  if (loading || !equipo) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <GradientHeader
          title="Cargando..."
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando información del equipo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title=""
        onBackPress={() => navigation.goBack()}
        rightElement={
          isAdmin ? (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleManagePhotoLinks} style={styles.headerButton}>
                <MaterialCommunityIcons name="camera" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearRoster} style={styles.headerButton}>
                <MaterialCommunityIcons name="account-remove" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditTeam} style={styles.headerButton}>
                <MaterialCommunityIcons name="pencil" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      {/* Logo del Equipo */}
      <View style={styles.logoContainer}>
        <Image
          source={getLogoUri(equipo.logo) || require('../../assets/InterLOGO.png')}
          style={styles.teamLogo}
          resizeMode="contain"
        />
        <Text style={styles.teamName}>{equipo.nombre}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => handleTabPress(tab.id, index)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* PagerView con contenido de tabs */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => {
          const index = e.nativeEvent.position;
          if (index >= 0 && index < tabs.length) {
            setActiveTab(tabs[index].id);
          }
        }}
      >
        {tabs.map((tab) => {
          // TAB: Estadísticas
          if (tab.id === 'estadisticas') {
            return (
              <View key={tab.id} style={styles.page}>
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                  {/* Información del Equipo */}
                  {(equipo.nombre_corto || equipo.color_primario || equipo.nombre_delegado) && (
                    <View style={styles.teamInfoSection}>
                      {equipo.nombre_corto && (
                        <InfoCard
                          title="Nombre Corto"
                          value={equipo.nombre_corto}
                          icon="text-short"
                          iconColor={colors.primary}
                        />
                      )}

                      {/* Colores del Equipo */}
                      {(equipo.color_primario || equipo.color_secundario) && (
                        <Card style={styles.colorsCard}>
                          <Text style={styles.cardTitle}>Colores del Equipo</Text>
                          <View style={styles.colorsContainer}>
                            {equipo.color_primario && (
                              <View style={styles.colorItem}>
                                <View
                                  style={[
                                    styles.colorPreview,
                                    {
                                      backgroundColor: equipo.color_primario,
                                      borderWidth: equipo.color_primario.toLowerCase() === '#ffffff' ? 1 : 0,
                                      borderColor: colors.border,
                                    },
                                  ]}
                                />
                                <Text style={styles.colorLabel}>Primario</Text>
                                <Text style={styles.colorValue}>{equipo.color_primario}</Text>
                              </View>
                            )}
                            {equipo.color_secundario && (
                              <View style={styles.colorItem}>
                                <View
                                  style={[
                                    styles.colorPreview,
                                    {
                                      backgroundColor: equipo.color_secundario,
                                      borderWidth: equipo.color_secundario.toLowerCase() === '#ffffff' ? 1 : 0,
                                      borderColor: colors.border,
                                    },
                                  ]}
                                />
                                <Text style={styles.colorLabel}>Secundario</Text>
                                <Text style={styles.colorValue}>{equipo.color_secundario}</Text>
                              </View>
                            )}
                          </View>
                        </Card>
                      )}

                      {/* Información del Delegado - Solo Admin */}
                      {isAdmin && (equipo.nombre_delegado || equipo.telefono_delegado || equipo.email_delegado) && (
                        <Card style={styles.delegadoCard}>
                          <Text style={styles.cardTitle}>Información del Delegado</Text>
                          {equipo.nombre_delegado && (
                            <View style={styles.delegadoRow}>
                              <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} />
                              <Text style={styles.delegadoText}>{equipo.nombre_delegado}</Text>
                            </View>
                          )}
                          {equipo.telefono_delegado && (
                            <View style={styles.delegadoRow}>
                              <MaterialCommunityIcons name="phone" size={20} color={colors.textSecondary} />
                              <Text style={styles.delegadoText}>{equipo.telefono_delegado}</Text>
                            </View>
                          )}
                          {equipo.email_delegado && (
                            <View style={styles.delegadoRow}>
                              <MaterialCommunityIcons name="email" size={20} color={colors.textSecondary} />
                              <Text style={styles.delegadoText}>{equipo.email_delegado}</Text>
                            </View>
                          )}
                        </Card>
                      )}
                    </View>
                  )}

                  {/* Estadísticas Compactas Estilo Barcelona */}
                  <View style={styles.compactStatsContainer}>
                    <View style={styles.compactStatsGrid}>
                      <View style={[styles.compactStatBox, { backgroundColor: colors.textSecondary }]}>
                        <Text style={[styles.compactStatLabel, { color: colors.white }]}>TOTAL</Text>
                        <Text style={[styles.compactStatValue, { color: colors.white }]}>{estadisticasEquipo?.partidos_jugados ?? 0}</Text>
                      </View>
                      <View style={[styles.compactStatBox, { backgroundColor: colors.success }]}>
                        <Text style={[styles.compactStatLabel, { color: colors.white }]}>W</Text>
                        <Text style={[styles.compactStatValue, { color: colors.white }]}>{estadisticasEquipo?.partidos_ganados ?? 0}</Text>
                      </View>
                      <View style={[styles.compactStatBox, { backgroundColor: colors.textLight }]}>
                        <Text style={[styles.compactStatLabel, { color: colors.white }]}>D</Text>
                        <Text style={[styles.compactStatValue, { color: colors.white }]}>{estadisticasEquipo?.partidos_empatados ?? 0}</Text>
                      </View>
                      <View style={[styles.compactStatBox, { backgroundColor: colors.error }]}>
                        <Text style={[styles.compactStatLabel, { color: colors.white }]}>L</Text>
                        <Text style={[styles.compactStatValue, { color: colors.white }]}>{estadisticasEquipo?.partidos_perdidos ?? 0}</Text>
                      </View>
                    </View>
                  </View>

                  {/* TODO: Siguiente Partido - Requires API endpoint for upcoming matches */}
                  {/* TODO: Partidos Recientes - Requires API endpoint for recent matches */}

                  {/* Removed Grupo InfoCard - Team name comes from API */}

                  {/* Estadísticas Detalladas */}
                  <Card style={styles.statsCard}>
                    <Text style={styles.cardTitle}>Estadísticas Detalladas</Text>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.success }]}>{estadisticasEquipo?.goles_favor ?? 0}</Text>
                        <Text style={styles.statLabel}>Goles a Favor</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.error }]}>{estadisticasEquipo?.goles_contra ?? 0}</Text>
                        <Text style={styles.statLabel}>Goles en Contra</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="card" size={32} color="#FFD700" />
                        <Text style={styles.statValue}>{estadisticasEquipo?.tarjetas_amarillas ?? 0}</Text>
                        <Text style={styles.statLabel}>Amarillas</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="card" size={32} color={colors.error} />
                        <Text style={styles.statValue}>{estadisticasEquipo?.tarjetas_rojas ?? 0}</Text>
                        <Text style={styles.statLabel}>Rojas</Text>
                      </View>
                    </View>
                  </Card>

                  <View style={styles.bottomSpacing} />
                </ScrollView>
              </View>
            );
          }

          // TAB: Jugadores
          if (tab.id === 'jugadores') {
            return (
              <View key={tab.id} style={styles.page}>
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                  {/* Botones de Acción (Admin) */}
                  {isAdmin && (
                    <View style={styles.adminActions}>
                      <TouchableOpacity style={styles.adminButtonSecondary} onPress={handleImportCSV}>
                        <MaterialCommunityIcons name="file-upload" size={20} color={colors.info} />
                        <Text style={styles.adminButtonSecondaryText}>Importar CSV</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.adminButton} onPress={handleMoveToGroup}>
                        <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.white} />
                        <Text style={styles.adminButtonText}>Mover de Grupo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Lista de Jugadores */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Plantilla</Text>
                      <Text style={styles.sectionSubtitle}>
                        {jugadores.length} {jugadores.length === 1 ? 'jugador' : 'jugadores'}
                      </Text>
                    </View>

                    {jugadores.length === 0 ? (
                      <Card style={styles.emptyCard}>
                        <MaterialCommunityIcons
                          name="account-multiple-outline"
                          size={48}
                          color={colors.textLight}
                          style={styles.emptyIcon}
                        />
                        <Text style={styles.emptyText}>No hay jugadores en este equipo</Text>
                      </Card>
                    ) : (
                      jugadores.map((jugador) => renderPlayerCard(jugador))
                    )}
                  </View>

                  <View style={styles.bottomSpacing} />
                </ScrollView>
              </View>
            );
          }

          // TAB: Fotos
          if (tab.id === 'fotos') {
            return (
              <View key={tab.id} style={styles.page}>
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.photosContainer}>
                    <View style={styles.photosHeader}>
                      <MaterialCommunityIcons name="image-multiple" size={28} color={colors.primary} />
                      <View style={styles.photosHeaderText}>
                        <Text style={styles.photosSectionTitle}>Galería del Equipo</Text>
                        <Text style={styles.photosSectionSubtitle}>
                          {imagenesEquipo.length} {imagenesEquipo.length === 1 ? 'imagen' : 'imágenes'}
                        </Text>
                      </View>
                    </View>

                    {loadingImages ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Cargando imágenes...</Text>
                      </View>
                    ) : imagenesEquipo.length === 0 ? (
                      <Card style={styles.emptyPhotosCard}>
                        <MaterialCommunityIcons
                          name="image-off-outline"
                          size={64}
                          color={colors.textLight}
                          style={styles.emptyIcon}
                        />
                        <Text style={styles.emptyPhotosText}>No hay imágenes disponibles</Text>
                        <Text style={styles.emptyPhotosSubtext}>
                          Este equipo aún no ha subido fotos
                        </Text>
                      </Card>
                    ) : (
                      <View style={styles.photosGrid}>
                        {imagenesEquipo.map((imagen) => (
                          <TouchableOpacity
                            key={imagen.id_imagen}
                            style={styles.photoCard}
                            activeOpacity={0.7}
                            onPress={() => {
                              // TODO: Abrir modal para ver imagen en tamaño completo
                              Linking.openURL(imagen.url);
                            }}
                          >
                            <Image
                              source={{ uri: imagen.url_thumbnail || imagen.url }}
                              style={styles.photoImage}
                              resizeMode="cover"
                            />
                            {imagen.descripcion && (
                              <View style={styles.photoDescriptionOverlay}>
                                <Text style={styles.photoDescription} numberOfLines={2}>
                                  {imagen.descripcion}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.bottomSpacing} />
                </ScrollView>
              </View>
            );
          }

          // Fallback (nunca debería llegar aquí)
          return null;
        })}
      </PagerView>

      {isAdmin && activeTab === 'jugadores' && (
        <FAB onPress={handleAddPlayer} icon="person-add" color={colors.success} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamLogo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  tabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
    marginVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  adminActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  adminButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  adminButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.info,
  },
  adminButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  adminButtonSecondaryText: {
    color: colors.info,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  playerCard: {
    marginBottom: 12,
    padding: 12,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  playerNumberBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  refuerzoBadge: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  refuerzoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  playerDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  playerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  photosContainer: {
    padding: 20,
  },
  adminPhotoHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  adminPhotoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 12,
  },
  photoLinkCard: {
    marginBottom: 16,
  },
  photoLinkSection: {
    gap: 12,
  },
  photoLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  photoLinkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  photoLinkSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  editLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.info,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  editLinkButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  photosSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  photosSectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  previewPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.info,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.success,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  photoButtonTextContainer: {
    flex: 1,
  },
  photoButtonTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  photoButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
  },
  photoInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  photoInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 80,
  },
  // Estilos compactos estilo Barcelona
  compactStatsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  compactStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  compactStatBox: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactStatLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  compactStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  nextMatchContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    marginBottom: 24,
  },
  nextMatchCard: {
    padding: 16,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  matchTeam: {
    flex: 1,
    alignItems: 'center',
    maxWidth: '30%',
  },
  matchTeamLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 8,
  },
  matchTeamName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  matchDetails: {
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 80,
  },
  matchDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  matchTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  matchVenue: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  recentMatchesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  recentMatchesList: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resultCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCircleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  // Estilos del Modal de Importar
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    marginBottom: 24,
  },
  instructionsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  exampleBox: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  exampleSubtext: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  instructionsNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 200,
    maxHeight: 300,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Estilos para información del equipo
  teamInfoSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  colorsCard: {
    padding: 16,
  },
  colorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 20,
  },
  colorItem: {
    alignItems: 'center',
    flex: 1,
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  colorValue: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  delegadoCard: {
    padding: 16,
  },
  delegadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  delegadoText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  // Estilos para estado de carga
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Estilos para galería de fotos
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  photosHeaderText: {
    flex: 1,
  },
  emptyPhotosCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyPhotosText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyPhotosSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.backgroundGray,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoDescriptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  photoDescription: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
  },
});
