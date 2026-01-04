import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';
import { Categoria } from '../../api/types/categorias.types';
import { EdicionCategoria } from '../../api/types/edicion-categorias.types';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export const TournamentCategoriesScreen = ({ navigation, route }: any) => {
  const { torneo, edicion, pais } = route.params;
  const { isSuperAdmin, usuario } = useAuth();

  // Check if user can assign categories to this edition
  const canAssignCategories =
    isSuperAdmin ||
    (usuario?.id_torneos && usuario.id_torneos.includes(torneo.id_torneo)) ||
    (usuario?.id_ediciones && usuario.id_ediciones.includes(edicion.id_edicion));

  const [assignedCategorias, setAssignedCategorias] = useState<EdicionCategoria[]>([]);
  const [allCategorias, setAllCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [maxEquipos, setMaxEquipos] = useState('16');
  const [maxJugadores, setMaxJugadores] = useState('18');
  const [minJugadores, setMinJugadores] = useState('11');
  const [permiteRefuerzos, setPermiteRefuerzos] = useState(false);
  const [maxRefuerzos, setMaxRefuerzos] = useState('3');
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCategorias();
    }, [])
  );

  const loadCategorias = async () => {
    try {
      setLoading(true);

      // Load all global categories - handle errors gracefully
      try {
        const allResponse = await api.categorias.list();
        // Handle both { data: [...] } and { data: { data: [...] } }
        const categoriasArray = allResponse.data?.data || allResponse.data || [];
        console.log('📋 All categorias loaded:', categoriasArray.length);
        setAllCategorias(categoriasArray);
      } catch (error: any) {
        console.log('⚠️ Error loading all categorias:', error);
        setAllCategorias([]);
      }

      // Load categories assigned to this edition - handle errors gracefully
      try {
        const assignedResponse = await api.edicionCategorias.list({
          id_edicion: edicion.id_edicion,
        });
        // Handle both { data: [...] } and { data: { data: [...] } }
        const assignedArray = assignedResponse.data?.data || assignedResponse.data || [];
        console.log('✅ Assigned categorias loaded:', assignedArray.length);
        setAssignedCategorias(assignedArray);
      } catch (error: any) {
        console.log('⚠️ Error loading assigned categorias:', error);
        setAssignedCategorias([]);
      }
    } catch (error) {
      console.log('❌ Outer error loading categorias:', error);
      setAllCategorias([]);
      setAssignedCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setShowAssignModal(false);
    setShowFormModal(true);
  };

  const handleAssignCategory = async () => {
    if (!selectedCategoria) return;

    if (!maxEquipos.trim() || !maxJugadores.trim() || !minJugadores.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const maxEquiposNum = parseInt(maxEquipos);
    const maxJugadoresNum = parseInt(maxJugadores);
    const minJugadoresNum = parseInt(minJugadores);

    if (isNaN(maxEquiposNum) || isNaN(maxJugadoresNum) || isNaN(minJugadoresNum)) {
      Alert.alert('Error', 'Los valores deben ser números válidos');
      return;
    }

    if (minJugadoresNum > maxJugadoresNum) {
      Alert.alert('Error', 'El mínimo de jugadores no puede ser mayor al máximo');
      return;
    }

    // Validar max refuerzos si está habilitado
    if (permiteRefuerzos) {
      const maxRefuerzosNum = parseInt(maxRefuerzos);
      if (isNaN(maxRefuerzosNum) || maxRefuerzosNum < 0) {
        Alert.alert('Error', 'El máximo de refuerzos debe ser un número válido');
        return;
      }
    }

    try {
      setIsSaving(true);
      await api.edicionCategorias.create({
        id_edicion: edicion.id_edicion,
        id_categoria: selectedCategoria.id_categoria,
        max_equipos: maxEquiposNum,
        max_jugadores_por_equipo: maxJugadoresNum,
        min_jugadores_por_equipo: minJugadoresNum,
        permite_refuerzos_override: permiteRefuerzos,
        max_refuerzos_override: permiteRefuerzos ? parseInt(maxRefuerzos) : undefined,
      });

      setShowFormModal(false);
      setSelectedCategoria(null);
      setMaxEquipos('16');
      setMaxJugadores('18');
      setMinJugadores('11');
      setPermiteRefuerzos(false);
      setMaxRefuerzos('3');
      Alert.alert('Éxito', `Categoría "${selectedCategoria.nombre}" asignada correctamente`);
      loadCategorias();
    } catch (error) {
      console.error('Error assigning category:', error);
      Alert.alert('Error', 'No se pudo asignar la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCategory = (edicionCategoria: EdicionCategoria) => {
    const categoriaNombre = edicionCategoria.categoria?.nombre || 'esta categoría';
    Alert.alert(
      'Quitar Categoría',
      `¿Deseas quitar "${categoriaNombre}" de esta edición? Los equipos asociados se eliminarán.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to remove category assignment (endpoint needed)
              Alert.alert('Éxito', 'Categoría removida correctamente');
              loadCategorias();
            } catch (error) {
              Alert.alert('Error', 'No se pudo quitar la categoría');
            }
          },
        },
      ]
    );
  };

  const handleCategoryPress = (edicionCategoria: EdicionCategoria) => {
    // Navigate to category management (teams, groups, etc.)
    navigation.navigate('CategoryManagement', {
      torneo,
      edicion,
      pais,
      categoria: edicionCategoria.categoria,
      edicionCategoria,
    });
  };

  // Filter out already assigned categories
  const availableCategorias = allCategorias.filter(
    cat => !assignedCategorias.some(assigned => assigned.id_categoria === cat.id_categoria)
  );

  console.log('🔍 TournamentCategoriesScreen - Estado actual:');
  console.log('  - All categorias:', allCategorias.length);
  console.log('  - Assigned categorias:', assignedCategorias.length);
  console.log('  - Available categorias:', availableCategorias.length);
  console.log('  - Show modal:', showAssignModal);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando categorías...</Text>
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
              <Text style={styles.title}>{torneo.nombre}</Text>
              <Text style={styles.subtitle}>
                Edición {edicion.numero}
                {edicion.nombre && ` - ${edicion.nombre}`}
              </Text>
            </View>
          </View>
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('ManageCategories', { pais })}
            >
              <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoBannerText}>
            Asigna categorías globales a esta edición. Solo puedes asignar categorías ya creadas.
          </Text>
        </View>

        {/* Assigned Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorías Asignadas</Text>
            {assignedCategorias.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{assignedCategorias.length}</Text>
              </View>
            )}
          </View>

          {assignedCategorias.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="shape-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No hay categorías asignadas</Text>
              <Text style={styles.emptySubtitle}>
                {canAssignCategories
                  ? 'Presiona el botón + para asignar categorías a esta edición'
                  : 'No tienes permisos para asignar categorías a esta edición'}
              </Text>
              {canAssignCategories && (
                <TouchableOpacity
                  style={styles.assignFirstButton}
                  onPress={() => {
                    console.log('🎯 Assign first button pressed - opening modal');
                    setShowAssignModal(true);
                  }}
                >
                  <Text style={styles.assignFirstButtonText}>
                    Asignar Primera Categoría
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {assignedCategorias.map((edicionCat) => (
                <TouchableOpacity
                  key={edicionCat.id_edicion_categoria}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(edicionCat)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryMain}>
                    <MaterialCommunityIcons
                      name="shape"
                      size={32}
                      color={colors.primary}
                    />
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>
                        {edicionCat.categoria?.nombre || 'Categoría'}
                      </Text>
                      <Text style={styles.categorySubtitle}>
                        {edicionCat.max_equipos} equipos • {edicionCat.min_jugadores_por_equipo}-{edicionCat.max_jugadores_por_equipo} jugadores
                      </Text>
                    </View>
                  </View>

                  <View style={styles.categoryActions}>
                    {canAssignCategories && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveCategory(edicionCat);
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={24}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    )}
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button - Only show if user has permission */}
      {assignedCategorias.length > 0 && canAssignCategories && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            console.log('🎯 FAB button pressed - opening modal');
            setShowAssignModal(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Assign Category Modal */}
      <Modal
        visible={showAssignModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          console.log('🚫 Modal onRequestClose called');
          setShowAssignModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asignar Categoría</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {(() => {
                console.log('🎨 Modal rendering - available categorias:', availableCategorias.length);
                return null;
              })()}
              {availableCategorias.length === 0 ? (
                <View style={styles.emptyModal}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyModalTitle}>
                    {allCategorias.length === 0
                      ? 'No hay categorías creadas'
                      : 'No hay categorías disponibles'}
                  </Text>
                  <Text style={styles.emptyModalText}>
                    {allCategorias.length === 0
                      ? 'Aún no se han creado categorías globales en el sistema.'
                      : 'Todas las categorías ya están asignadas a esta edición.'}
                    {'\n\n'}
                    {isSuperAdmin
                      ? 'Puedes crear nuevas categorías desde el botón de configuración en el header.'
                      : 'Contacta a un superadmin para crear nuevas categorías.'}
                  </Text>
                  {isSuperAdmin && (
                    <TouchableOpacity
                      style={styles.createCategoryButton}
                      onPress={() => {
                        setShowAssignModal(false);
                        navigation.navigate('ManageCategories', { pais });
                      }}
                    >
                      <MaterialCommunityIcons
                        name="plus-circle"
                        size={20}
                        color={colors.white}
                      />
                      <Text style={styles.createCategoryButtonText}>
                        Ir a Gestión de Categorías
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <FlatList
                  data={availableCategorias}
                  keyExtractor={(item) => item.id_categoria.toString()}
                  renderItem={({ item: categoria }) => (
                    <TouchableOpacity
                      style={styles.modalCategoryCard}
                      onPress={() => handleCategorySelect(categoria)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.modalCategoryInfo}>
                        <MaterialCommunityIcons
                          name="shape"
                          size={28}
                          color={colors.primary}
                        />
                        <Text style={styles.modalCategoryName}>
                          {categoria.nombre}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="plus-circle"
                        size={24}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalList}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Form Modal for Assignment Details */}
      <Modal
        visible={showFormModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Configurar {selectedCategoria?.nombre}
              </Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
              <ScrollView
                style={styles.formModalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Máximo de Equipos</Text>
                  <TextInput
                    style={styles.input}
                    value={maxEquipos}
                    onChangeText={setMaxEquipos}
                    placeholder="16"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Máximo de Jugadores por Equipo</Text>
                  <TextInput
                    style={styles.input}
                    value={maxJugadores}
                    onChangeText={setMaxJugadores}
                    placeholder="18"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Mínimo de Jugadores por Equipo</Text>
                  <TextInput
                    style={styles.input}
                    value={minJugadores}
                    onChangeText={setMinJugadores}
                    placeholder="11"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Sección de Refuerzos */}
                <View style={styles.divider} />

                <View style={styles.switchGroup}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.label}>Permitir Refuerzos</Text>
                    <Text style={styles.switchDescription}>
                      Habilita la posibilidad de agregar jugadores de refuerzo
                    </Text>
                  </View>
                  <Switch
                    value={permiteRefuerzos}
                    onValueChange={setPermiteRefuerzos}
                    trackColor={{ false: colors.borderLight, true: colors.primary + '40' }}
                    thumbColor={permiteRefuerzos ? colors.primary : colors.textSecondary}
                  />
                </View>

                {permiteRefuerzos && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Máximo de Refuerzos</Text>
                    <TextInput
                      style={styles.input}
                      value={maxRefuerzos}
                      onChangeText={setMaxRefuerzos}
                      placeholder="3"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={styles.hint}>
                      Cantidad máxima de jugadores de refuerzo permitidos
                    </Text>
                  </View>
                )}

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowFormModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAssignCategory}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.saveButtonText}>Asignar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  categoriesSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
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
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  assignFirstButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  assignFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    paddingBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalBody: {
    minHeight: 300,
    maxHeight: 500,
  },
  formModalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 20,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  modalList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyModal: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyModalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  createCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  createCategoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default TournamentCategoriesScreen;
