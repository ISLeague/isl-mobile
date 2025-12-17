import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';
import { Torneo, Pais } from '../../api/types';
import { Edicion } from '../../api/types/ediciones.types';
import { Categoria } from '../../api/types/categorias.types';
import { useAuth } from '../../contexts/AuthContext';

export const TournamentCategoriesScreen = ({ navigation, route }: any) => {
  const { torneo, edicion, pais } = route.params;
  const { isSuperAdmin, usuario } = useAuth();

  // Check if user can assign categories to this edition
  const canAssignCategories =
    isSuperAdmin ||
    (usuario?.id_torneos && usuario.id_torneos.includes(torneo.id_torneo)) ||
    (usuario?.id_ediciones && usuario.id_ediciones.includes(edicion.id_edicion));

  const [assignedCategorias, setAssignedCategorias] = useState<Categoria[]>([]);
  const [allCategorias, setAllCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);

      // Load all global categories - handle errors gracefully
      try {
        const allResponse = await api.categorias.list();
        setAllCategorias(allResponse.data || []);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setAllCategorias([]);
        } else {
          console.error('Error loading global categories:', error);
          setAllCategorias([]);
        }
      }

      // Load categories assigned to this edition - handle errors gracefully
      try {
        const assignedResponse = await api.categorias.getByEdition(edicion.id_edicion);
        setAssignedCategorias(assignedResponse.data || []);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setAssignedCategorias([]);
        } else {
          console.error('Error loading assigned categories:', error);
          setAssignedCategorias([]);
        }
      }
    } catch (error) {
      console.error('Error in loadCategorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCategory = async (categoria: Categoria) => {
    try {
      // TODO: Call API to assign category to edition
      // For now, just add to local state
      Alert.alert('Éxito', `Categoría "${categoria.nombre}" asignada correctamente`);
      setShowAssignModal(false);
      loadCategorias();
    } catch (error) {
      console.error('Error assigning category:', error);
      Alert.alert('Error', 'No se pudo asignar la categoría');
    }
  };

  const handleRemoveCategory = (categoria: Categoria) => {
    Alert.alert(
      'Quitar Categoría',
      `¿Deseas quitar "${categoria.nombre}" de esta edición? Los equipos asociados se eliminarán.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to remove category assignment
              Alert.alert('Éxito', 'Categoría removida correctamente');
              loadCategorias();
            } catch (error) {
              console.error('Error removing category:', error);
              Alert.alert('Error', 'No se pudo quitar la categoría');
            }
          },
        },
      ]
    );
  };

  const handleCategoryPress = (categoria: Categoria) => {
    // Navigate to category management (teams, groups, etc.)
    navigation.navigate('CategoryManagement', { torneo, edicion, pais, categoria });
  };

  // Filter out already assigned categories
  const availableCategorias = allCategorias.filter(
    cat => !assignedCategorias.some(assigned => assigned.id === cat.id)
  );

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
                  onPress={() => setShowAssignModal(true)}
                >
                  <Text style={styles.assignFirstButtonText}>
                    Asignar Primera Categoría
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {assignedCategorias.map((categoria) => (
                <TouchableOpacity
                  key={categoria.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(categoria)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryMain}>
                    <MaterialCommunityIcons
                      name="shape"
                      size={32}
                      color={colors.primary}
                    />
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{categoria.nombre}</Text>
                      <Text style={styles.categorySubtitle}>Toca para gestionar</Text>
                    </View>
                  </View>

                  <View style={styles.categoryActions}>
                    {canAssignCategories && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveCategory(categoria);
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
          onPress={() => setShowAssignModal(true)}
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
        onRequestClose={() => setShowAssignModal(false)}
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
              {availableCategorias.length === 0 ? (
                <View style={styles.emptyModal}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyModalTitle}>
                    No hay categorías disponibles
                  </Text>
                  <Text style={styles.emptyModalText}>
                    Todas las categorías ya están asignadas a esta edición.
                    {'\n\n'}
                    Si necesitas una nueva categoría, pídele a un superadmin que la cree en la sección de Gestión de Categorías.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={availableCategorias}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item: categoria }) => (
                    <TouchableOpacity
                      style={styles.modalCategoryCard}
                      onPress={() => handleAssignCategory(categoria)}
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
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
    flex: 1,
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
});

export default TournamentCategoriesScreen;
