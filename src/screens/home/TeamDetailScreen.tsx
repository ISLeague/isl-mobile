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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { GradientHeader, FAB, Card, InfoCard, Skeleton } from '../../components/common';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useTeamFollow } from '../../hooks';
import { Equipo, Jugador, PlantillaEquipo } from '../../types';
import { mockEquipos, mockJugadores, mockPlantillas, mockGrupos } from '../../data/mockData';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync } from '../../utils/errorHandling';
import { calculateAge } from '../../utils';

interface TeamDetailScreenProps {
  navigation: any;
  route: any;
}

export const TeamDetailScreen: React.FC<TeamDetailScreenProps> = ({ navigation, route }) => {
  const { equipoId } = route.params as { equipoId: number };
  const { isAdmin, usuario, isGuest } = useAuth();
  const { followedTeam } = useTeamFollow(usuario?.id_usuario || 0);
  const pagerRef = useRef<PagerView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { showSuccess, showError, showWarning } = useToast();

  // Estado de carga
  const [loading, setLoading] = useState(true);

  // Estado para el modal de importar CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // Verificar si este equipo es el favorito del usuario
  const isFollowedTeam = followedTeam?.id_equipo === equipoId && !isGuest;

  // Tabs - Solo mostrar "Fotos" si es el equipo favorito Y no es invitado
  const tabs = [
    { id: 'estadisticas', label: 'Estadísticas' },
    { id: 'jugadores', label: 'Jugadores' },
    ...(isFollowedTeam ? [{ id: 'fotos', label: 'Fotos' }] : []),
  ];

  const [activeTab, setActiveTab] = useState('estadisticas');

  const [equipo] = useState<Equipo>(
    mockEquipos.find((e) => e.id_equipo === equipoId)!
  );

  // Obtener jugadores del equipo
  const plantilla = mockPlantillas.filter((p) => p.id_equipo === equipoId && p.activo_en_equipo);
  const jugadores = plantilla.map((p) => mockJugadores.find((j) => j.id_jugador === p.id_jugador)!);

  // Obtener grupo del equipo
  const grupoEquipo = mockGrupos[0]; // Mock

  // Fotos de ejemplo para preview (solo para fans con equipo favorito)
  const mockPhotos = [
    { id: 1, url: 'https://via.placeholder.com/300x200/E31E24/FFFFFF?text=Foto+1' },
    { id: 2, url: 'https://via.placeholder.com/300x200/1976D2/FFFFFF?text=Foto+2' },
    { id: 3, url: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Foto+3' },
    { id: 4, url: 'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Foto+4' },
  ];

  // Simular carga de datos
  useEffect(() => {
    // Simulamos un delay de carga (en producción, esto sería una llamada a API)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [equipoId]);

  // Estadísticas del equipo
  const estadisticasEquipo = {
    partidos_jugados: 10,
    partidos_ganados: 7,
    partidos_empatados: 2,
    partidos_perdidos: 1,
    goles_favor: 28,
    goles_contra: 12,
    diferencia_goles: 16,
    puntos: 23,
    posicion: 1,
    tarjetas_amarillas: 15,
    tarjetas_rojas: 2,
  };

  const handleTabPress = (tabId: string, index: number) => {
    pagerRef.current?.setPage(index);
    setActiveTab(tabId);
  };

  // Defensive: if the tabs array changes (e.g. Fotos tab is removed because the
  // user unfollowed the team), ensure the activeTab is valid and the PagerView
  // isn't left pointing to a non-existent page. This prevents runtime errors
  // where a child becomes null and a library tries to access `.props` on it.
  useEffect(() => {
    const stillExists = tabs.some((t) => t.id === activeTab);
    if (!stillExists) {
      setActiveTab('estadisticas');
      // Reset pager to the first page safely
      try {
        pagerRef.current?.setPage(0);
      } catch (err) {
        // swallow any errors from native module if pager isn't mounted yet
        // actual crash was caused by accessing removed child; this ensures
        // we don't propagate that exception.
        // console.warn('PagerView reset failed', err);
      }
    }
  }, [isFollowedTeam]);

  const handleAddPlayer = () => {
    navigation.navigate('PlayerForm', { equipoId, mode: 'create' });
  };

  const handleImportCSV = () => {
    setImportText('');
    setShowImportModal(true);
  };

  const parseImportText = (text: string) => {
    const lines = text.trim().split('\n');
    const jugadores: Array<{
      nombre: string;
      dni: string;
      fechaNacimiento: string;
      dorsal?: number;
      esRefuerzo: boolean;
    }> = [];
    const errores: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Verificar que empiece con "JUGADOR:"
      if (!trimmedLine.toUpperCase().startsWith('JUGADOR:')) {
        errores.push(`Línea ${index + 1}: Debe empezar con "JUGADOR:"`);
        return;
      }

      // Remover el prefijo "JUGADOR:" y parsear los datos
      const datos = trimmedLine.substring(8).trim();
      const partes = datos.split(',').map(p => p.trim());

      if (partes.length < 4) {
        errores.push(`Línea ${index + 1}: Faltan datos (mínimo: nombre, dni, fecha de nacimiento, refuerzo)`);
        return;
      }

      const nombre = partes[0];
      const dni = partes[1];
      const fechaNacimiento = partes[2];
      const dorsalStr = partes.length > 4 ? partes[3] : undefined;
      const refuerzoStr = partes.length > 4 ? partes[4] : partes[3];

      // Validar nombre
      if (!nombre || nombre.length < 2) {
        errores.push(`Línea ${index + 1}: Nombre inválido`);
        return;
      }

      // Validar DNI
      if (!dni || dni.length < 7) {
        errores.push(`Línea ${index + 1}: DNI inválido`);
        return;
      }

      // Validar formato de fecha DD/MM/YYYY
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(fechaNacimiento)) {
        errores.push(`Línea ${index + 1}: Fecha debe estar en formato DD/MM/YYYY`);
        return;
      }

      // Validar que la fecha sea válida
      const [dia, mes, anio] = fechaNacimiento.split('/').map(Number);
      const fecha = new Date(anio, mes - 1, dia);
      if (fecha.getDate() !== dia || fecha.getMonth() !== mes - 1 || fecha.getFullYear() !== anio) {
        errores.push(`Línea ${index + 1}: Fecha inválida`);
        return;
      }

      // Validar dorsal si existe
      let dorsal: number | undefined;
      if (dorsalStr) {
        const dorsalNum = parseInt(dorsalStr);
        if (isNaN(dorsalNum) || dorsalNum < 1 || dorsalNum > 99) {
          errores.push(`Línea ${index + 1}: Dorsal debe ser un número entre 1 y 99`);
          return;
        }
        dorsal = dorsalNum;
      }

      // Validar refuerzo (0 o 1)
      if (!refuerzoStr || (refuerzoStr !== '0' && refuerzoStr !== '1')) {
        errores.push(`Línea ${index + 1}: Refuerzo debe ser 0 (no refuerzo) o 1 (refuerzo)`);
        return;
      }
      const esRefuerzo = refuerzoStr === '1';

      jugadores.push({ nombre, dni, fechaNacimiento, dorsal, esRefuerzo });
    });

    return { jugadores, errores };
  };

  const handleConfirmImport = async () => {
    if (!importText.trim()) {
      showError('Debes pegar el texto con los datos de los jugadores', 'Campo Vacío');
      return;
    }

    const { jugadores, errores } = parseImportText(importText);

    if (errores.length > 0) {
      Alert.alert(
        'Errores en el Formato',
        `Se encontraron ${errores.length} error(es):\n\n${errores.slice(0, 5).join('\n')}${
          errores.length > 5 ? `\n\n...y ${errores.length - 5} más` : ''
        }`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (jugadores.length === 0) {
      showError('No se encontraron jugadores válidos en el texto', 'Sin Datos');
      return;
    }

    Alert.alert(
      'Confirmar Importación',
      `Se importarán ${jugadores.length} jugador(es) al equipo "${equipo.nombre}".\n\n¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          onPress: async () => {
            await safeAsync(
              async () => {
                // TODO: Llamar a la API para crear los jugadores
                console.log('Importando jugadores:', jugadores);
                
                setShowImportModal(false);
                setImportText('');
                showSuccess(
                  `${jugadores.length} jugador(es) importado(s) exitosamente`,
                  'Importación Exitosa'
                );
                
                // Opcional: Recargar datos
              },
              'TeamDetailScreen - handleConfirmImport',
              {
                onError: (error) => {
                  showError(error.message, 'Error al Importar');
                },
              }
            );
          },
        },
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

  const handlePreviewPhotos = async () => {
    // TODO: Obtener link de preview desde la API
    const previewUrl = 'https://www.youtube.com';
    const supported = await Linking.canOpenURL(previewUrl);
    
    if (supported) {
      await Linking.openURL(previewUrl);
    } else {
      showError('No se puede abrir el navegador', 'Error');
    }
  };

  const handleBuyPhotos = async () => {
    // TODO: Obtener link de compra desde la API
    const url = 'https://www.google.com';
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      showError('No se puede abrir el navegador', 'Error');
    }
  };

  const handleClearRoster = () => {
    if (jugadores.length === 0) {
      showWarning('El equipo no tiene jugadores en su plantilla', 'Plantilla Vacía');
      return;
    }

    Alert.alert(
      'Vaciar Plantilla',
      `¿Estás seguro de que quieres eliminar TODOS los ${jugadores.length} jugadores de "${equipo.nombre}"? Esta acción no se puede deshacer.`,
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
                showSuccess(`Plantilla de "${equipo.nombre}" vaciada exitosamente`, 'Plantilla Vaciada');
                
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
    
    // Buscar si el jugador es refuerzo
    const plantillaEntry = plantilla.find(p => p.id_jugador === jugador.id_jugador);
    const esRefuerzo = plantillaEntry?.es_refuerzo || false;
    
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
            {/* Número de Camiseta en lugar de foto */}
            <View style={styles.playerNumberBadge}>
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
          source={equipo?.logo ? { uri: equipo.logo } : require('../../assets/InterLOGO.png')}
          style={styles.teamLogo}
          resizeMode="contain"
        />
        <Text style={styles.teamName}>{equipo?.nombre || 'Equipo'}</Text>
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
                  {/* Estadísticas Compactas Estilo Barcelona */}
                  <View style={styles.compactStatsContainer}>
                    <View style={styles.compactStatsGrid}>
                      <View style={[styles.compactStatBox, { backgroundColor: colors.textSecondary }]}>
                        <Text style={[styles.compactStatLabel, { color: colors.white }]}>TOTAL</Text>
                        <Text style={[styles.compactStatValue, { color: colors.white }]}>{estadisticasEquipo.partidos_jugados}</Text>
                      </View>
                      <View style={[styles.compactStatBox, { backgroundColor: colors.success }]}>
                        <Text style={[styles.compactStatLabel, { color: colors.white }]}>W</Text>
                        <Text style={[styles.compactStatValue, { color: colors.white }]}>{estadisticasEquipo.partidos_ganados}</Text>
                      </View>
                      <View style={[styles.compactStatBox, { backgroundColor: colors.textLight }]}>
                        <Text style={[styles.compactStatLabel, { color: colors.white }]}>D</Text>
                        <Text style={[styles.compactStatValue, { color: colors.white }]}>{estadisticasEquipo.partidos_empatados}</Text>
                      </View>
                      <View style={[styles.compactStatBox, { backgroundColor: colors.error }]}>
                        <Text style={[styles.compactStatLabel, { color: colors.white }]}>L</Text>
                        <Text style={[styles.compactStatValue, { color: colors.white }]}>{estadisticasEquipo.partidos_perdidos}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Siguiente Partido */}
                  <View style={styles.nextMatchContainer}>
                    <Card style={styles.nextMatchCard}>
                      <View style={styles.matchRow}>
                        <View style={styles.matchTeam}>
                          <Image
                            source={equipo?.logo ? { uri: equipo.logo } : require('../../assets/InterLOGO.png')}
                            style={styles.matchTeamLogo}
                          />
                          <Text style={styles.matchTeamName} numberOfLines={2}>
                            {equipo.nombre}
                          </Text>
                        </View>
                        <View style={styles.matchDetails}>
                          <Text style={styles.matchDate}>21/03/25</Text>
                          <Text style={styles.matchTime}>3:30 PM</Text>
                          <Text style={styles.matchVenue} numberOfLines={1}>
                            Campo 1
                          </Text>
                        </View>
                        <View style={styles.matchTeam}>
                          <Image
                            source={mockEquipos[1]?.logo ? { uri: mockEquipos[1].logo } : require('../../assets/InterLOGO.png')}
                            style={styles.matchTeamLogo}
                          />
                          <Text style={styles.matchTeamName} numberOfLines={2}>
                            {mockEquipos[1]?.nombre || 'TBD'}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </View>

                  {/* Partidos Recientes */}
                  <View style={styles.recentMatchesContainer}>
                    <Text style={styles.sectionTitle}>Partidos Recientes</Text>
                    <View style={styles.recentMatchesList}>
                      <View style={[styles.resultCircle, { backgroundColor: colors.success }]}>
                        <Text style={styles.resultCircleText}>W</Text>
                      </View>
                      <View style={[styles.resultCircle, { backgroundColor: colors.textLight }]}>
                        <Text style={styles.resultCircleText}>D</Text>
                      </View>
                      <View style={[styles.resultCircle, { backgroundColor: colors.error }]}>
                        <Text style={styles.resultCircleText}>L</Text>
                      </View>
                      <View style={[styles.resultCircle, { backgroundColor: colors.success }]}>
                        <Text style={styles.resultCircleText}>W</Text>
                      </View>
                      <View style={[styles.resultCircle, { backgroundColor: colors.success }]}>
                        <Text style={styles.resultCircleText}>W</Text>
                      </View>
                    </View>
                  </View>

                  <InfoCard
                    title="Grupo"
                    value={grupoEquipo.nombre}
                    icon="shield"
                    iconColor={colors.primary}
                  />

                  {/* Estadísticas Detalladas */}
                  <Card style={styles.statsCard}>
                    <Text style={styles.cardTitle}>Estadísticas Detalladas</Text>
                    
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{estadisticasEquipo.partidos_jugados}</Text>
                        <Text style={styles.statLabel}>Partidos</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.success }]}>
                          {estadisticasEquipo.partidos_ganados}
                        </Text>
                        <Text style={styles.statLabel}>Ganados</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                          {estadisticasEquipo.partidos_empatados}
                        </Text>
                        <Text style={styles.statLabel}>Empatados</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.error }]}>
                          {estadisticasEquipo.partidos_perdidos}
                        </Text>
                        <Text style={styles.statLabel}>Perdidos</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{estadisticasEquipo.goles_favor}</Text>
                        <Text style={styles.statLabel}>Goles a Favor</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{estadisticasEquipo.goles_contra}</Text>
                        <Text style={styles.statLabel}>Goles en Contra</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[
                          styles.statValue, 
                          { color: estadisticasEquipo.diferencia_goles > 0 ? colors.success : estadisticasEquipo.diferencia_goles < 0 ? colors.error : colors.textPrimary }
                        ]}>
                          {estadisticasEquipo.diferencia_goles > 0 ? '+' : ''}{estadisticasEquipo.diferencia_goles}
                        </Text>
                        <Text style={styles.statLabel}>Diferencia</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                          {estadisticasEquipo.puntos}
                        </Text>
                        <Text style={styles.statLabel}>Puntos</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{estadisticasEquipo.posicion}º</Text>
                        <Text style={styles.statLabel}>Posición</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="card" size={32} color="#FFD700" />
                        <Text style={styles.statValue}>{estadisticasEquipo.tarjetas_amarillas}</Text>
                        <Text style={styles.statLabel}>Amarillas</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="card" size={32} color={colors.error} />
                        <Text style={styles.statValue}>{estadisticasEquipo.tarjetas_rojas}</Text>
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

          // TAB: Fotos (solo si isFollowedTeam)
          if (tab.id === 'fotos') {
            return (
              <View key={tab.id} style={styles.page}>
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                  {isAdmin ? (
                    // Vista Admin: Gestionar links de fotos
                    <View style={styles.photosContainer}>
                      <View style={styles.adminPhotoHeader}>
                        <MaterialCommunityIcons name="link-variant" size={32} color={colors.primary} />
                        <Text style={styles.adminPhotoTitle}>Gestión de Enlaces de Fotos</Text>
                      </View>

                      <Card style={styles.photoLinkCard}>
                        <View style={styles.photoLinkSection}>
                          <View style={styles.photoLinkHeader}>
                            <MaterialCommunityIcons name="eye-outline" size={24} color={colors.info} />
                            <Text style={styles.photoLinkTitle}>Link de Preview</Text>
                          </View>
                          <Text style={styles.photoLinkSubtitle}>
                            Enlace para ver vista previa de las fotos (ej: YouTube, Vimeo)
                          </Text>
                          <TouchableOpacity 
                            style={styles.editLinkButton}
                            onPress={() => {
                              // TODO: Abrir modal para editar link de preview
                              showSuccess('Editar link de preview');
                            }}
                          >
                            <MaterialCommunityIcons name="pencil" size={20} color={colors.white} />
                            <Text style={styles.editLinkButtonText}>Actualizar Link de Preview</Text>
                          </TouchableOpacity>
                        </View>
                      </Card>

                      <Card style={styles.photoLinkCard}>
                        <View style={styles.photoLinkSection}>
                          <View style={styles.photoLinkHeader}>
                            <MaterialCommunityIcons name="cart-outline" size={24} color={colors.success} />
                            <Text style={styles.photoLinkTitle}>Link de Compra</Text>
                          </View>
                          <Text style={styles.photoLinkSubtitle}>
                            Enlace para comprar fotos en alta resolución
                          </Text>
                          <TouchableOpacity 
                            style={[styles.editLinkButton, { backgroundColor: colors.success }]}
                            onPress={() => {
                              // TODO: Abrir modal para editar link de compra
                              showSuccess('Editar link de compra');
                            }}
                          >
                            <MaterialCommunityIcons name="pencil" size={20} color={colors.white} />
                            <Text style={styles.editLinkButtonText}>Actualizar Link de Compra</Text>
                          </TouchableOpacity>
                        </View>
                      </Card>
                    </View>
                  ) : (
                    // Vista Fan: Preview y compra con botones separados
                    <View style={styles.photosContainer}>
                      <Text style={styles.photosSectionTitle}>Galería del Equipo</Text>
                      <Text style={styles.photosSectionSubtitle}>
                        Accede a las fotos del equipo
                      </Text>

                      {/* Botón de Preview */}
                      <TouchableOpacity 
                        style={styles.previewPhotosButton} 
                        onPress={handlePreviewPhotos}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="play-circle" size={28} color={colors.white} />
                        <View style={styles.photoButtonTextContainer}>
                          <Text style={styles.photoButtonTitle}>Ver Preview</Text>
                          <Text style={styles.photoButtonSubtitle}>Vista previa de las fotos</Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right" size={24} color={colors.white} />
                      </TouchableOpacity>

                      {/* Botón de Compra */}
                      <TouchableOpacity 
                        style={styles.buyPhotosButton} 
                        onPress={handleBuyPhotos}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="cart" size={28} color={colors.white} />
                        <View style={styles.photoButtonTextContainer}>
                          <Text style={styles.photoButtonTitle}>Comprar Fotos</Text>
                          <Text style={styles.photoButtonSubtitle}>Fotos en alta resolución</Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right" size={24} color={colors.white} />
                      </TouchableOpacity>

                      <View style={styles.photoInfoCard}>
                        <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
                        <Text style={styles.photoInfoText}>
                          Visualiza el preview para ver las fotos disponibles antes de comprar
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.bottomSpacing} />
                </ScrollView>
              </View>
            );
          }

          // Fallback (nunca debería llegar aquí)
          return null;
        })}
      </PagerView>

      {/* Modal de Importar Jugadores */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Importar Jugadores</Text>
              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.instructionsCard}>
                <MaterialCommunityIcons name="information" size={24} color={colors.info} />
                <View style={styles.instructionsTextContainer}>
                  <Text style={styles.instructionsTitle}>Formato de Importación</Text>
                  <Text style={styles.instructionsText}>
                    Pega el texto con los datos de los jugadores. Cada línea representa un jugador con el mismo formato que usarías al agregarlo individualmente:
                  </Text>
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleTitle}>Con número de camiseta:</Text>
                    <Text style={styles.exampleText}>
                      JUGADOR: Juan Pérez, 12345678, 15/05/2000, 10, 0
                    </Text>
                    <Text style={styles.exampleSubtext}>
                      (nombre, dni, fecha, dorsal, refuerzo)
                    </Text>
                    
                    <Text style={[styles.exampleTitle, { marginTop: 12 }]}>Sin número de camiseta:</Text>
                    <Text style={styles.exampleText}>
                      JUGADOR: María García, 87654321, 23/08/1998, 1
                    </Text>
                    <Text style={styles.exampleSubtext}>
                      (nombre, dni, fecha, refuerzo)
                    </Text>
                  </View>
                  <Text style={styles.instructionsNote}>
                    📋 Campos obligatorios:{'\n'}
                    • Nombre completo{'\n'}
                    • DNI (7-10 dígitos){'\n'}
                    • Fecha de nacimiento (DD/MM/YYYY){'\n'}
                    • Refuerzo (0 = jugador normal, 1 = refuerzo){'\n'}
                    {'\n'}
                    ⚽ Campos opcionales:{'\n'}
                    • Número de camiseta (1-99){'\n'}
                    {'\n'}
                    ✅ Cada jugador debe estar en una línea nueva
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Pega aquí los datos:</Text>
              <TextInput
                style={styles.textArea}
                value={importText}
                onChangeText={setImportText}
                placeholder="JUGADOR: nombre, dni, DD/MM/YYYY, dorsal, refuerzo"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowImportModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmImport}
                >
                  <MaterialCommunityIcons name="check" size={20} color={colors.white} />
                  <Text style={styles.confirmButtonText}>Importar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
});
