import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, colorPresets, ColorPreset } from '../../theme/colors';
import api from '../../api';
import PagerView from 'react-native-pager-view';
import { LocalTab } from './components/LocalTab';
import { SponsorTab } from './components/SponsorTab';
import { TeamsTab } from './components/TeamsTab';
import { GroupStageEmbed } from './components/GroupStageEmbed';
import { TheBestEmbed } from './components/TheBestEmbed';
import { MyTeamEmbed } from './components/MyTeamEmbed';
import { FixtureEmbedImproved } from './components/FixtureEmbedImproved';
import KnockoutEmbed from './components/KnockoutEmbed';
import { LeagueStatsEmbed } from './components/LeagueStatsEmbed';
import { useAuth } from '../../contexts/AuthContext';
import { SponsorSlider } from '../../components/common';
import { useTheme } from '../../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';


// ===============================
// Pantalla principal
// ===============================
export const CategoryManagementScreen = ({ navigation, route }: any) => {
  const pagerRef = useRef<PagerView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const tabRefs = useRef<{ [key: string]: View | null }>({});
  const { torneo, pais, categoria, edicionCategoria, edicion } = route.params;

  // Usar la categoria del edicionCategoria si existe, sino usar la categoria directa
  const initialCategoria = edicionCategoria?.categoria || categoria;

  const { isAdmin, isGuest, isSuperAdmin } = useAuth();
  const { setColorPreset, colorPreset, logo, gradient } = useTheme();
  const currentPreset = colorPresets[colorPreset];
  const logoScale = currentPreset.logoScale || 1;
  const [activeTab, setActiveTab] = useState('equipos');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState(initialCategoria);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  const [refreshLocalTab, setRefreshLocalTab] = useState(0);

  // Usar idEdicionCategoria desde los params directamente
  const [idEdicionCategoria, setIdEdicionCategoria] = useState<number | undefined>(
    edicionCategoria?.id_edicion_categoria
  );
  const [idFase, setIdFase] = useState<number | undefined>(undefined);

  // Tabs diferentes para admin y fan (invitados ven lo mismo que fans)
  const tabs = isAdmin
    ? [
      { id: 'equipos', label: 'Equipos' },
      { id: 'grupos', label: 'Grupos' },
      { id: 'fixture', label: 'Fixture' },
      { id: 'knockout', label: 'Knockout' },
      { id: 'stats', label: 'The Best' },
      { id: 'local', label: 'Local' },
      { id: 'sponsors', label: 'Sponsors' },
    ]
    : [
      // Fans e invitados ven todo (invitados verán mensajes al intentar acceder)
      { id: 'miequipo', label: 'Mi Equipo' },
      { id: 'grupos', label: 'Grupos' },
      { id: 'stats', label: 'The Best' },
      { id: 'fixture', label: 'Fixture' },
      { id: 'knockout', label: 'Knockout' },
      { id: 'thebest', label: 'The Best' },
      { id: 'local', label: 'Local' },
    ];

  // Animated values para el indicador
  const scrollX = useRef(new Animated.Value(0)).current;
  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  // Actualizar indicador cuando cambia scrollX o tabLayouts
  useEffect(() => {
    if (Object.keys(tabLayouts).length === tabs.length) {
      const listener = scrollX.addListener(({ value }) => {
        const currentIndex = Math.floor(value);
        const nextIndex = Math.min(Math.ceil(value), tabs.length - 1);
        const progress = value - currentIndex;

        const currentTab = tabLayouts[tabs[currentIndex]?.id];
        const nextTab = tabLayouts[tabs[nextIndex]?.id];

        if (currentTab && nextTab) {
          // Interpolar posición y ancho
          const left = currentTab.x + (nextTab.x - currentTab.x) * progress;
          const width = currentTab.width + (nextTab.width - currentTab.width) * progress;

          indicatorLeft.setValue(left);
          indicatorWidth.setValue(width);
        } else if (currentTab) {
          indicatorLeft.setValue(currentTab.x);
          indicatorWidth.setValue(currentTab.width);
        }
      });

      return () => scrollX.removeListener(listener);
    }
  }, [tabLayouts, tabs.length]);

  // Función para medir layout de un tab
  const handleTabLayout = (tabId: string, index: number) => (event: any) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const updated = { ...prev, [tabId]: { x, width } };

      // Inicializar indicador en el primer tab
      if (index === 0 && Object.keys(prev).length === 0) {
        indicatorLeft.setValue(x);
        indicatorWidth.setValue(width);
      }

      return updated;
    });
  };

  // Función para hacer scroll automático al tab seleccionado
  const scrollToTab = (index: number) => {
    const tabRef = tabRefs.current[tabs[index].id];
    if (tabRef && tabScrollRef.current) {
      tabRef.measureLayout(
        tabScrollRef.current as any,
        (x: number) => {
          tabScrollRef.current?.scrollTo({ x: x - 20, animated: true });
        },
        () => { }
      );
    }
  };

  const [refreshGroups, setRefreshGroups] = useState(0);
  const [refreshTeams, setRefreshTeams] = useState(0);

  // Refresh LocalTab and Groups when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      setRefreshLocalTab(prev => prev + 1);
      setRefreshGroups(prev => prev + 1);
      setRefreshTeams(prev => prev + 1);
    }, [])
  );

  useEffect(() => {
    loadCategorias();
  }, [edicion.id_edicion]);

  useEffect(() => {
    loadFaseGrupos();
  }, [idEdicionCategoria]);

  const loadCategorias = async () => {
    try {
      // First load all global categories to get names
      const allCategoriasResponse = await api.categorias.list();
      const allCategorias = allCategoriasResponse.data?.data || allCategoriasResponse.data || [];
      
      const response = await api.edicionCategorias.list({ id_edicion: edicion.id_edicion });
      if (response.success && response.data) {
        // Handle both { data: [...] } and { data: { data: [...] } }
        const categoriesArray = response.data.data || response.data || [];
        
        // Enrich with categoria info if not present
        const enrichedCategories = categoriesArray.map((edicionCat: any) => ({
          ...edicionCat,
          categoria: edicionCat.categoria || allCategorias.find((c: any) => c.id_categoria === edicionCat.id_categoria),
        }));
        
        setCategorias(enrichedCategories);
      }
    } catch (error) {
      // console.error('Error loading categorias:', error);
    }
  };

  const loadFaseGrupos = async () => {
    if (!idEdicionCategoria) {
      // console.warn('⚠️ [CategoryManagement] No idEdicionCategoria disponible para cargar fases');
      return;
    }

    try {

      const fasesResponse = await api.fases.list(idEdicionCategoria);
      if (fasesResponse.success && fasesResponse.data && fasesResponse.data.length > 0) {
        // Find the first "grupo" type fase
        const faseGrupos = fasesResponse.data.find(f => f.tipo === 'grupo');
        if (faseGrupos) {
          setIdFase(faseGrupos.id_fase);
        } else {
        }
      }
    } catch (error) {
      // console.error('Error loading fase de grupos:', error);
    }
  };


  const handleTabPress = (tabId: string) => {
    const index = tabs.findIndex((t) => t.id === tabId);
    pagerRef.current?.setPage(index);
    setActiveTab(tabId);
    scrollToTab(index);
  };

  const handleThemeSelect = (preset: ColorPreset) => {
    setColorPreset(preset);
    setShowThemeModal(false);
    Alert.alert(
      '¡Tema actualizado!',
      `Se ha aplicado el tema ${preset === 'red' ? 'Rojo' : preset === 'blue' ? 'Azul' : 'Rosa'} para todos los usuarios.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient colors={gradient as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        {/* --- HEADER --- */}
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <View style={styles.notificationDot} />
            <Ionicons name="notifications" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={isAdmin ? () => setShowThemeModal(true) : undefined}
            activeOpacity={isAdmin ? 0.7 : 1}
            disabled={!isAdmin}
          >
            <Image
              source={logo}
              style={[styles.logo, { transform: [{ scale: logoScale }] }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.tournamentName}>{torneo?.nombre || 'Torneo'}</Text>
            <TouchableOpacity style={styles.categorySelector} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
              <Text style={styles.categoryName}>{selectedCategoria?.nombre || 'Categoría'}</Text>
              <Ionicons
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.white}
                style={styles.dropdownIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {showCategoryPicker && categorias.length > 0 && (
          <View style={styles.categoryPicker}>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.id_edicion_categoria}
                style={styles.categoryOption}
                onPress={() => {
                  setSelectedCategoria(cat.categoria);
                  setIdEdicionCategoria(cat.id_edicion_categoria);
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    cat.id_edicion_categoria === idEdicionCategoria ? styles.categoryOptionActive : undefined,
                  ]}
                >
                  {cat.categoria?.nombre || 'Sin nombre'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* --- TABS --- */}
        <View style={styles.tabsContainer}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            style={styles.tabsScroll}
          >
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={tab.id}
                ref={(ref) => { tabRefs.current[tab.id] = ref; }}
                style={styles.tab}
                onLayout={handleTabLayout(tab.id, index)}
                onPress={() => {
                  setActiveTab(tab.id);
                  pagerRef.current?.setPage(index);
                  scrollToTab(index);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id ? styles.tabTextActive : undefined,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Indicador animado */}
            <Animated.View
              style={[
                styles.tabIndicatorAnimated,
                {
                  left: indicatorLeft,
                  width: indicatorWidth,
                },
              ]}
            />
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Contenido con PagerView optimizado */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageScroll={Animated.event(
          [{ nativeEvent: { position: scrollX, offset: new Animated.Value(0) } }],
          {
            useNativeDriver: false,
            listener: (e: any) => {
              const { position, offset } = e.nativeEvent;
              scrollX.setValue(position + offset);
            },
          }
        )}
        onPageSelected={(e) => {
          const index = e.nativeEvent.position;
          setActiveTab(tabs[index].id);
          scrollToTab(index);
        }}
      >
        {tabs.map((tab, index) => {
          // Renderizar página según el tab activo
          if (isAdmin) {
            // ADMIN: Grupos, Fixture, Knockout, Local, Sponsors
            if (tab.id === 'grupos') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <GroupStageEmbed
                    navigation={navigation}
                    isAdmin={true}
                    idFase={idFase}
                    idEdicionCategoria={idEdicionCategoria}
                    refreshTrigger={refreshGroups}
                  />
                </View>
              );
            } else if (tab.id === 'fixture') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <FixtureEmbedImproved navigation={navigation} isAdmin={true} idEdicionCategoria={idEdicionCategoria} />
                </View>
              );
            } else if (tab.id === 'knockout') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <KnockoutEmbed
                    navigation={navigation}
                    isAdmin={true}
                    isSuperAdmin={isSuperAdmin}
                    idEdicionCategoria={idEdicionCategoria}
                  />
                </View>
              );
            } else if (tab.id === 'equipos') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <TeamsTab
                    idEdicionCategoria={idEdicionCategoria || 1}
                    maxEquipos={edicionCategoria?.max_equipos}
                    refreshTrigger={refreshTeams}
                    onCreateTeam={() => navigation.navigate('CreateTeam', {
                      idEdicionCategoria: idEdicionCategoria || 1,
                    })}
                    onBulkCreateTeams={() => navigation.navigate('BulkCreateTeams', {
                      idEdicionCategoria: idEdicionCategoria || 1,
                    })}
                    onTeamPress={(equipo) => navigation.navigate('TeamDetail', { equipoId: equipo.id_equipo })}
                  />
                </View>
              );
            } else if (tab.id === 'stats') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <LeagueStatsEmbed navigation={navigation} idEdicionCategoria={idEdicionCategoria} />
                </View>
              );
            } else if (tab.id === 'local') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <LocalTab
                    idEdicionCategoria={idEdicionCategoria || 1}
                    refreshTrigger={refreshLocalTab}
                    navigation={navigation}
                    onCreateLocal={() => navigation.navigate('CreateLocal', { idEdicionCategoria: idEdicionCategoria || 1 })}
                    onCreateCancha={(idLocal, nombreLocal) =>
                      navigation.navigate('CreateCancha', { idLocal, nombreLocal })
                    }
                    onEditLocal={(local) => navigation.navigate('EditLocal', { local })}
                    onDeleteLocal={(idLocal) => {
                    }}
                    onEditCancha={(cancha, nombreLocal) =>
                      navigation.navigate('EditCancha', { cancha, nombreLocal })
                    }
                    onDeleteCancha={(idCancha, nombreLocal) => {
                    }}
                  />
                </View>
              );
            } else if (tab.id === 'sponsors') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <SponsorTab
                    idEdicionCategoria={idEdicionCategoria || 1}
                    onCreateSponsor={() => navigation.navigate('CreateSponsor', { idEdicionCategoria: idEdicionCategoria || 1 })}
                    onEditSponsor={(sponsor) => navigation.navigate('EditSponsor  ', { sponsor })}
                  />
                </View>
              );
            }
          } else {
            // FAN: Mi Equipo, Grupos, Fixture, Knockout, The Best, Local
            if (tab.id === 'miequipo') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <MyTeamEmbed
                    navigation={navigation}
                    edicionCategoriaId={selectedCategoria?.id_categoria}
                  />
                </View>
              );
            } else if (tab.id === 'grupos') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <GroupStageEmbed
                    navigation={navigation}
                    isAdmin={false}
                    idFase={idFase}
                    idEdicionCategoria={idEdicionCategoria}
                    refreshTrigger={refreshGroups}
                  />
                </View>
              );
            } else if (tab.id === 'fixture') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <FixtureEmbedImproved navigation={navigation} isAdmin={false} idEdicionCategoria={idEdicionCategoria} />
                </View>
              );
            } else if (tab.id === 'knockout') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <KnockoutEmbed
                    navigation={navigation}
                    isAdmin={false}
                    isSuperAdmin={false}
                    idEdicionCategoria={idEdicionCategoria}
                  />
                </View>
              );
            } else if (tab.id === 'stats') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <LeagueStatsEmbed navigation={navigation} idEdicionCategoria={idEdicionCategoria} />
                </View>
              );
            } else if (tab.id === 'thebest') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <TheBestEmbed navigation={navigation} idEdicionCategoria={idEdicionCategoria} />
                </View>
              );
            } else if (tab.id === 'local') {
              return (
                <View key={tab.id} style={styles.pageWrapper}>
                  <LocalTab
                    idEdicionCategoria={idEdicionCategoria || 1}
                    refreshTrigger={refreshLocalTab}
                    navigation={navigation}
                    onCreateLocal={undefined}
                    onCreateCancha={undefined}
                    onEditLocal={undefined}
                    onDeleteLocal={undefined}
                    onEditCancha={undefined}
                    onDeleteCancha={undefined}
                  />
                </View>
              );
            }
          }

          // Fallback
          return (
            <View key={tab.id} style={styles.pageWrapper}>
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Tab no implementado</Text>
              </View>
            </View>
          );
        })}
      </PagerView>

      {/* --- FOOTER - Solo para Fans --- */}
      {!isAdmin && (
        <View style={styles.footer}>
          <SponsorSlider autoScroll={true} />
        </View>
      )}

      {/* Modal de Selección de Tema */}
      <Modal
        visible={showThemeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Tema</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Elige el color del logo y tema de la aplicación</Text>

            <View style={styles.themesContainer}>
              {/* Tema Rojo */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  colorPreset === 'red' && styles.themeOptionSelected,
                ]}
                onPress={() => handleThemeSelect('red')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colorPresets.red.gradient as [string, string, ...string[]]}
                  style={styles.themeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={colorPresets.red.logo}
                    style={[styles.themeLogo, { transform: [{ scale: colorPresets.red.logoScale || 1 }] }]}
                    resizeMode="contain"
                  />
                </LinearGradient>
                <Text style={styles.themeName}>Rojo</Text>
                {colorPreset === 'red' && (
                  <View style={styles.selectedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Tema Azul */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  colorPreset === 'blue' && styles.themeOptionSelected,
                ]}
                onPress={() => handleThemeSelect('blue')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colorPresets.blue.gradient as [string, string, ...string[]]}
                  style={styles.themeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={colorPresets.blue.logo}
                    style={[styles.themeLogo, { transform: [{ scale: colorPresets.blue.logoScale || 1 }] }]}
                    resizeMode="contain"
                  />
                </LinearGradient>
                <Text style={styles.themeName}>Azul</Text>
                {colorPreset === 'blue' && (
                  <View style={styles.selectedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Tema Rosa */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  colorPreset === 'pink' && styles.themeOptionSelected,
                ]}
                onPress={() => handleThemeSelect('pink')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colorPresets.pink.gradient as [string, string, ...string[]]}
                  style={styles.themeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={colorPresets.pink.logo}
                    style={[styles.themeLogo, { transform: [{ scale: colorPresets.pink.logoScale || 1 }] }]}
                    resizeMode="contain"
                  />
                </LinearGradient>
                <Text style={styles.themeName}>Rosa</Text>
                {colorPreset === 'pink' && (
                  <View style={styles.selectedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.modalNote}>
              El tema se aplicará en toda la aplicación para todos los usuarios (admin y fans).
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '600',
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: '#BE0127',
  },
  notificationIcon: {
    fontSize: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logo: {
    width: 70,
    height: 70,
  },
  headerInfo: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 90,
    height: 3,
    backgroundColor: '#fff',
  },
  tournamentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 6,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
    marginRight: 6,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  categoryPicker: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  categoryOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  categoryOptionActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
  tabsContainer: {
    marginTop: 16,
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tabsScrollContent: {
    paddingRight: 20,
  },
  tab: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
  },
  tabIndicatorFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.white,
    borderRadius: 1.5,
  },
  tabIndicatorAnimated: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: colors.white,
    borderRadius: 1.5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },

  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  navigateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  footer: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.backgroundGray,
  },
  poweredText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
  },
  // Estilos del Modal de Temas
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  themesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  themeOption: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  themeGradient: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  themeLogo: {
    width: '90%',
    height: '90%',
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: colors.backgroundGray,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});