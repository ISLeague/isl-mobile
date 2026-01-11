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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import * as DocumentPicker from 'expo-document-picker';
import { GradientHeader, Card, InfoCard, Skeleton } from '../../components/common';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import { calculateAge } from '../../utils';
import api from '../../api';
import type { Equipo, ImagenEquipo } from '../../api/types/equipos.types';
import type { EstadisticasDetalleEquipo, JugadorEstadisticas } from '../../api/types/estadisticas.types';
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
  const { isAdmin, isSuperAdmin } = useAuth();
  const pagerRef = useRef<PagerView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { showSuccess, showError, showWarning } = useToast();

  // Estado de carga
  const [loading, setLoading] = useState(true);

  // Estados de feedback para operaciones
  const [importingCSV, setImportingCSV] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  // Estados para modales de registro de jugadores
  const [showCSVFormatModal, setShowCSVFormatModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [registrationResults, setRegistrationResults] = useState<{
    type: 'csv' | 'individual';
    successful: number;
    failed: number;
    total: number;
    errors: Array<{ row: number; error: string }>;
    newPlayers: Jugador[];
  } | null>(null);

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
  const [jugadoresConStats, setJugadoresConStats] = useState<JugadorEstadisticas[]>([]);
  const [estadisticasEquipo, setEstadisticasEquipo] = useState<EstadisticasDetalleEquipo | null>(null);
  const [ultimos5Partidos, setUltimos5Partidos] = useState<string[]>([]);
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
        let currentIdEdicionCategoria = 0;

        if (equipoResponse.data) {
          setEquipo(equipoResponse.data);
          currentIdEdicionCategoria = equipoResponse.data.id_edicion_categoria;
        }

        // Load players by team ID
        const jugadoresResponse = await api.jugadores.list(equipoId);
        if (jugadoresResponse.success && jugadoresResponse.data.jugadores) {
          setJugadores(jugadoresResponse.data.jugadores);
        }

        // Load detailed team statistics if we have the id_edicion_categoria
        if (currentIdEdicionCategoria > 0) {
          const statsResponse = await api.estadisticas.detalleEquipo(equipoId, currentIdEdicionCategoria, 50);
          if (statsResponse.success && statsResponse.data) {
            setEstadisticasEquipo(statsResponse.data.estadisticas_equipo);
            setJugadoresConStats(statsResponse.data.jugadores);
            setUltimos5Partidos(statsResponse.data.ultimos_5_partidos || []);
          }
        } else {
          // Set default values if stats cannot be loaded
          setEstadisticasEquipo({
            partidos_jugados: 0,
            partidos_ganados: 0,
            partidos_empatados: 0,
            partidos_perdidos: 0,
            goles_a_favor: 0,
            goles_en_contra: 0,
            tarjetas_amarillas: 0,
            tarjetas_rojas: 0,
          });
        }

        // TODO: Load group information from API
        // For now, set to null
        setGrupoEquipo(null);

      } catch (error) {
        // console.error('Error fetching team data:', error);
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

  // Recargar jugadores cuando se regresa de PlayerForm
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      // Solo recargar si ya tenemos datos cargados (no es la carga inicial)
      if (!loading && equipo) {

        const previousCount = jugadores.length;
        const previousJugadores = [...jugadores];

        const jugadoresResponse = await safeAsync(
          async () => {
            const response = await api.jugadores.list(equipoId);
            return response;
          },
          'TeamDetailScreen - reloadPlayers',
          {
            fallbackValue: null,
            onError: () => {
              // Silent error - no mostrar toast en recarga automática
            }
          }
        );

        if (jugadoresResponse && jugadoresResponse.success && jugadoresResponse.data.jugadores) {
          const newJugadores = jugadoresResponse.data.jugadores;
          setJugadores(newJugadores);

          // Mostrar modal de resultados si se agregó un nuevo jugador
          if (newJugadores.length > previousCount) {
            const playersAdded = newJugadores.length - previousCount;

            // Find the newly added players
            const addedPlayers = newJugadores.filter(
              (newPlayer: Jugador) => !previousJugadores.some(
                (oldPlayer: Jugador) => oldPlayer.id_jugador === newPlayer.id_jugador
              )
            );

            // Show results modal for individual player addition
            setRegistrationResults({
              type: 'individual',
              successful: playersAdded,
              failed: 0,
              total: playersAdded,
              errors: [],
              newPlayers: addedPlayers,
            });
            setShowResultsModal(true);
          }
        }
      }
    });

    return unsubscribe;
  }, [navigation, loading, equipo, equipoId, jugadores.length]);

  const handleViewPlayers = () => {
    // Close results modal
    setShowResultsModal(false);
    setRegistrationResults(null);

    // Switch to jugadores tab
    const jugadoresTabIndex = tabs.findIndex(tab => tab.id === 'jugadores');
    if (jugadoresTabIndex !== -1) {
      handleTabPress('jugadores', jugadoresTabIndex);
    }
  };

  const handleTabPress = (tabId: string, index: number) => {
    pagerRef.current?.setPage(index);
    setActiveTab(tabId);
  };

  const handleAddPlayer = () => {
    navigation.navigate('PlayerForm', { equipoId, mode: 'create' });
  };

  const handleImportCSV = () => {
    // Show CSV format modal first
    setShowCSVFormatModal(true);
  };

  const handleProceedWithCSVSelection = async () => {
    try {
      // Close format modal
      setShowCSVFormatModal(false);

      // Pick CSV file from device
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Start import process immediately
      setImportingCSV(true);
      setImportStatus('Procesando archivo CSV...');


      // Create file object in React Native format
      const csvFile = {
        uri: file.uri,
        type: 'text/csv',
        name: file.name,
      } as any;

      setImportStatus('Enviando datos al servidor...');

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
          onError: (error: any) => {
            // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            // console.error('❌ [ImportCSV] ERROR AL IMPORTAR');
            // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            // console.error('❌ [ImportCSV] Error completo:', error);
            // console.error('❌ [ImportCSV] Error message:', error?.message);
            // console.error('❌ [ImportCSV] Error name:', error?.name);

            // Información detallada de la respuesta HTTP
            if (error?.response) {
              // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              // console.error('📡 [ImportCSV] HTTP RESPONSE ERROR:');
              // console.error('  - Status:', error.response.status);
              // console.error('  - Status Text:', error.response.statusText);
              // console.error('  - Data:', JSON.stringify(error.response.data, null, 2));
              // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

              // Obtener mensaje específico del servidor
              const serverMessage = error.response.data?.message || error.response.data?.error;

              // Error 400 - Bad Request (formato inválido, datos incorrectos)
              if (error.response.status === 400) {
                // console.error('⚠️ [ImportCSV] ERROR 400 - BAD REQUEST');
                // console.error('⚠️ [ImportCSV] Mensaje del servidor:', serverMessage);

                setImportingCSV(false);
                setImportStatus('');

                // Mostrar mensaje específico del servidor
                showError(
                  serverMessage || 'El archivo CSV no cumple con el formato requerido.\n\nVerifica que tenga todas las columnas necesarias y que los datos estén en el formato correcto.',
                  'Formato de CSV Inválido'
                );
                return;
              }

              // Otros errores HTTP
              setImportingCSV(false);
              setImportStatus('');
              showError(
                serverMessage || 'Error al importar el archivo CSV',
                `Error (${error.response.status})`
              );
            } else if (error?.request) {
              // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              // console.error('📡 [ImportCSV] REQUEST ERROR (Sin respuesta del servidor)');
              // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

              setImportingCSV(false);
              setImportStatus('');
              showError('No se pudo conectar con el servidor', 'Error de Conexión');
            } else {
              // Error desconocido
              setImportingCSV(false);
              setImportStatus('');
              showError('Error al importar el archivo CSV', 'Error');
            }

            // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          }
        }
      );

      if (uploadResult && uploadResult.success) {
        const { total_processed, successful, failed, errors } = uploadResult.data;


        // Intentar recargar la lista de jugadores
        let newPlayers: Jugador[] = [];
        if (successful > 0) {
          setImportStatus('Recargando lista de jugadores...');

          const jugadoresResponse = await safeAsync(
            async () => {
              const response = await api.jugadores.list(equipoId);
              return response;
            },
            'ImportCSV - reloadPlayers',
            {
              fallbackValue: null,
              onError: (error) => {
                // console.error('⚠️ [ImportCSV] Error al recargar jugadores:', error);
                // No mostrar error al usuario, solo loguear
                // Los resultados se mostrarán de todos modos
              }
            }
          );

          if (jugadoresResponse && jugadoresResponse.success && jugadoresResponse.data.jugadores) {
            newPlayers = jugadoresResponse.data.jugadores;
            setJugadores(newPlayers);
          }
        }

        // Hide loading
        setImportingCSV(false);
        setImportStatus('');

        // Show results modal SIEMPRE (con errores o sin errores)
        setRegistrationResults({
          type: 'csv',
          successful,
          failed,
          total: total_processed,
          errors: errors || [],
          newPlayers,
        });
        setShowResultsModal(true);

        // Si TODOS fallaron, mostrar mensaje adicional
        if (successful === 0 && failed > 0) {
          // console.error('❌ [ImportCSV] TODOS LOS JUGADORES FALLARON');
        } else {
        }
      } else {
        setImportingCSV(false);
        setImportStatus('');
      }
    } catch (error) {
      // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // console.error('❌ [ImportCSV] ERROR INESPERADO AL PROCESAR CSV');
      // console.error('Error:', error);
      // console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      setImportingCSV(false);
      setImportStatus('');
      showError('Error inesperado al procesar el archivo CSV', 'Error');
    }
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
          onPress: async () => {
            const result = await safeAsync(
              async () => {
                const response = await api.jugadores.delete(jugador.id_jugador);
                return response;
              },
              'TeamDetailScreen - handleDeletePlayer',
              {
                onError: (error) => {
                  showError(error.message, 'Error al Eliminar Jugador');
                }
              }
            );

            if (result && result.success) {
              showSuccess(`${jugador.nombre_completo} eliminado exitosamente`);
              // Actualizar lista local
              setJugadores(prev => prev.filter(j => j.id_jugador !== jugador.id_jugador));
            }
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
            const result = await safeAsync(
              async () => {
                return await api.jugadores.clearSquad(equipoId);
              },
              'TeamDetailScreen - handleClearRoster',
              {
                onError: (error) => {
                  showError(error.message, 'Error al Vaciar Plantilla');
                },
              }
            );

            if (result && result.success) {
              showSuccess(`Plantilla de "${equipo?.nombre ?? 'Equipo'}" vaciada exitosamente`, 'Plantilla Vaciada');
              setJugadores([]); // Limpiar lista local
            }
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
        onPress={() => {
          console.log('🔍 [TeamDetail] Navigating to PlayerDetail with jugador:', jugador);
          console.log('🔍 [TeamDetail] jugador.id_jugador:', jugador.id_jugador);
          console.log('🔍 [TeamDetail] jugador.id_plantilla:', (jugador as any).id_plantilla);

          const playerId = jugador.id_jugador || (jugador as any).id_plantilla;
          console.log('🔍 [TeamDetail] Final playerId to navigate:', playerId);

          navigation.navigate('PlayerDetail', { playerId });
        }}
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
              {isAdmin || isSuperAdmin && (
                <Text style={styles.playerDetails}>
                  {edad} años
                </Text>
              )}
              {/* Mostrar DNI solo para superadmin */}
              {isAdmin || isSuperAdmin && (
                <Text style={styles.playerDetails}>
                  DNI: {jugador.dni}
                </Text>
              )}

              {/* Estadísticas del jugador si están disponibles */}
              {(() => {
                const playerStats = jugadoresConStats.find(j => j.nombre === jugador.nombre_completo || j.numero_camiseta === jugador.numero_camiseta);
                if (playerStats && playerStats.estadisticas) {
                  const { goles, asistencias, tarjetas_amarillas, tarjetas_rojas } = playerStats.estadisticas;
                  if (goles > 0 || asistencias > 0 || tarjetas_amarillas > 0 || tarjetas_rojas > 0) {
                    return (
                      <View style={styles.playerStatsRow}>
                        {goles > 0 && (
                          <View style={styles.miniStat}>
                            <MaterialCommunityIcons name="soccer" size={12} color={colors.textSecondary} />
                            <Text style={styles.miniStatText}>{goles}</Text>
                          </View>
                        )}
                        {asistencias > 0 && (
                          <View style={styles.miniStat}>
                            <MaterialCommunityIcons name="handball" size={12} color={colors.textSecondary} />
                            <Text style={styles.miniStatText}>{asistencias}</Text>
                          </View>
                        )}
                        {tarjetas_amarillas > 0 && (
                          <View style={styles.miniStat}>
                            <MaterialCommunityIcons name="card" size={12} color="#FFD700" />
                            <Text style={styles.miniStatText}>{tarjetas_amarillas}</Text>
                          </View>
                        )}
                        {tarjetas_rojas > 0 && (
                          <View style={styles.miniStat}>
                            <MaterialCommunityIcons name="card" size={12} color={colors.error} />
                            <Text style={styles.miniStatText}>{tarjetas_rojas}</Text>
                          </View>
                        )}
                      </View>
                    );
                  }
                }
                return null;
              })()}
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
              <TouchableOpacity onPress={handleMoveToGroup} style={styles.headerButton}>
                <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.white} />
              </TouchableOpacity>
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
                  {(equipo.nombre_corto || equipo.nombre_delegado) && (
                    <View style={styles.teamInfoSection}>
                      {equipo.nombre_corto && (
                        <InfoCard
                          title="Nombre Corto"
                          value={equipo.nombre_corto}
                          icon="text-short"
                          iconColor={colors.primary}
                        />
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

                  {/* Últimos 5 Partidos */}
                  {ultimos5Partidos.length > 0 && (
                    <View style={styles.recentMatchesContainer}>
                      <Text style={styles.sectionTitle}>Últimos Partidos</Text>
                      <View style={styles.recentMatchesList}>
                        {ultimos5Partidos.map((resultado, index) => (
                          <View
                            key={index}
                            style={[
                              styles.resultCircle,
                              {
                                backgroundColor:
                                  resultado === 'G'
                                    ? colors.success
                                    : resultado === 'E'
                                    ? colors.textLight
                                    : colors.error,
                              },
                            ]}
                          >
                            <Text style={styles.resultCircleText}>{resultado}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Estadísticas Detalladas */}
                  <Card style={styles.statsCard}>
                    <Text style={styles.cardTitle}>Estadísticas Detalladas</Text>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.success }]}>{estadisticasEquipo?.goles_a_favor ?? 0}</Text>
                        <Text style={styles.statLabel}>Goles a Favor</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.error }]}>{estadisticasEquipo?.goles_en_contra ?? 0}</Text>
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
                      <TouchableOpacity
                        style={[styles.adminButton, { flex: 1 }]}
                        onPress={handleAddPlayer}
                      >
                        <MaterialCommunityIcons name="account-plus" size={20} color={colors.white} />
                        <Text style={styles.adminButtonText}>Agregar Jugador</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.adminButton, { flex: 1 }]}
                        onPress={handleImportCSV}
                        disabled={importingCSV}
                      >
                        <MaterialCommunityIcons name="file-upload" size={20} color={colors.white} />
                        <Text style={styles.adminButtonText}>Importar CSV</Text>
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

      {/* Loading Overlay para operaciones */}
      {importingCSV && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>{importStatus}</Text>
          </View>
        </View>
      )}

      {/* CSV Format Modal */}
      <Modal
        visible={showCSVFormatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCSVFormatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Formato del Archivo CSV</Text>
                <TouchableOpacity
                  onPress={() => setShowCSVFormatModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <View style={styles.modalContent}>
                <View style={styles.instructionsCard}>
                  <MaterialCommunityIcons name="information" size={24} color={colors.info} />
                  <View style={styles.instructionsTextContainer}>
                    <Text style={styles.instructionsTitle}>Requisitos del Archivo</Text>
                    <Text style={styles.instructionsText}>
                      El archivo CSV debe contener las siguientes columnas en este orden exacto:
                    </Text>
                  </View>
                </View>

                {/* Column List */}
                <View style={styles.columnListCard}>
                  <Text style={styles.columnListTitle}>Columnas Requeridas:</Text>
                  {[
                    '1. Nombre completo',
                    '2. DNI',
                    '3. Fecha de nacimiento (YYYY-MM-DD)',
                    '4. Número de camiseta (opcional)',
                    '5. Posición',
                    '6. Pie dominante',
                    '7. Altura en cm (opcional)',
                    '8. Peso en kg (opcional)',
                    '9. Nacionalidad',
                    '10. Es refuerzo (0 o 1)',
                    '11. Es capitán (0 o 1)',
                  ].map((item, index) => (
                    <View key={index} style={styles.columnItem}>
                      <MaterialCommunityIcons
                        name="circle-small"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.columnItemText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Example */}
                <View style={styles.exampleBox}>
                  <Text style={styles.exampleTitle}>Ejemplo de Fila:</Text>
                  <Text style={styles.exampleText}>
                    Juan Pérez,12345678,2000-05-15,10,{'\n'}
                    Delantero,derecho,175,70,Argentina,0,0
                  </Text>
                </View>

                {/* Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowCSVFormatModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleProceedWithCSVSelection}
                  >
                    <MaterialCommunityIcons name="file-document" size={20} color={colors.white} />
                    <Text style={styles.confirmButtonText}>Seleccionar CSV</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowResultsModal(false);
          setRegistrationResults(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {registrationResults?.type === 'csv' ? 'Importación Completada' : 'Jugador Agregado'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowResultsModal(false);
                    setRegistrationResults(null);
                  }}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <View style={styles.modalContent}>
                {/* Success/Error Summary */}
                <View style={styles.resultsHeader}>
                  {registrationResults && registrationResults.successful > 0 && (
                    <View style={styles.resultSuccessCard}>
                      <MaterialCommunityIcons name="check-circle" size={48} color={colors.success} />
                      <Text style={styles.resultSuccessNumber}>{registrationResults.successful}</Text>
                      <Text style={styles.resultSuccessLabel}>
                        {registrationResults.successful === 1 ? 'Jugador Agregado' : 'Jugadores Agregados'}
                      </Text>
                    </View>
                  )}

                  {registrationResults && registrationResults.failed > 0 && (
                    <View style={styles.resultErrorCard}>
                      <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
                      <Text style={styles.resultErrorNumber}>{registrationResults.failed}</Text>
                      <Text style={styles.resultErrorLabel}>
                        {registrationResults.failed === 1 ? 'Error' : 'Errores'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Error Details */}
                {registrationResults && registrationResults.errors.length > 0 && (
                  <View style={styles.errorsSection}>
                    <Text style={styles.errorsSectionTitle}>Detalles de Errores:</Text>
                    {registrationResults.errors.map((error, index) => (
                      <View key={index} style={styles.errorItem}>
                        <MaterialCommunityIcons name="alert" size={16} color={colors.error} />
                        <Text style={styles.errorItemText}>
                          Fila {error.row}: {error.error}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Success Message */}
                {registrationResults && registrationResults.successful > 0 && (
                  <View style={styles.successMessageCard}>
                    <MaterialCommunityIcons name="party-popper" size={24} color={colors.success} />
                    <Text style={styles.successMessageText}>
                      {registrationResults.type === 'csv'
                        ? `Se importaron exitosamente ${registrationResults.successful} ${registrationResults.successful === 1 ? 'jugador' : 'jugadores'
                        } al equipo ${equipo?.nombre}.`
                        : `Se agregó exitosamente ${registrationResults.successful === 1 ? 'el jugador' : 'los jugadores'
                        } al equipo ${equipo?.nombre}.`}
                    </Text>
                  </View>
                )}

                {/* Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowResultsModal(false);
                      setRegistrationResults(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleViewPlayers}
                  >
                    <MaterialCommunityIcons name="account-group" size={20} color={colors.white} />
                    <Text style={styles.confirmButtonText}>Ver Jugadores</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // Estilos para loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Estilos para CSV Format Modal
  columnListCard: {
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  columnListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  columnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  columnItemText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  // Estilos para Results Modal
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  resultSuccessCard: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
  },
  resultSuccessNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
    marginTop: 8,
  },
  resultSuccessLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  resultErrorCard: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.error,
  },
  resultErrorNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.error,
    marginTop: 8,
  },
  resultErrorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  errorsSection: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 12,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    gap: 8,
  },
  errorItemText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  successMessageCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successMessageText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  playerStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  miniStatText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
});
