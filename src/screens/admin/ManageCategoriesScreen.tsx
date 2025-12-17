import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';
import { Categoria } from '../../api/types/categorias.types';
import { Pais } from '../../api/types';
import { useAuth } from '../../contexts/AuthContext';

export const ManageCategoriesScreen = ({ navigation, route }: any) => {
  const { pais } = route.params;
  const { isSuperAdmin } = useAuth();

  // Redirect if not superadmin
  useEffect(() => {
    if (!isSuperAdmin) {
      Alert.alert(
        'Acceso Denegado',
        'Solo los superadministradores pueden crear categorías globales',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [isSuperAdmin]);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.categorias.list();
      const categoriasArray = Array.isArray(response.data) ? response.data : [];
      setCategorias(categoriasArray);
    } catch (error: any) {
      // Handle 404 gracefully - no categories created yet
      if (error?.response?.status === 404) {
        setCategorias([]);
      } else {
        console.error('Error loading categories:', error);
        // Don't show alert, just set empty array - screen will show empty state
        setCategorias([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCategorias(true);
  };

  const handleCreateCategory = () => {
    setModalMode('create');
    setSelectedCategoria(null);
    setCategoriaNombre('');
    setShowModal(true);
  };

  const handleEditCategory = (categoria: Categoria) => {
    setModalMode('edit');
    setSelectedCategoria(categoria);
    setCategoriaNombre(categoria.nombre);
    setShowModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoriaNombre.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es obligatorio');
      return;
    }

    try {
      setIsSaving(true);

      if (modalMode === 'create') {
        await api.categorias.create({
          nombre: categoriaNombre.trim(),
        });
        Alert.alert('Éxito', 'Categoría creada correctamente');
      } else if (modalMode === 'edit' && selectedCategoria) {
        await api.categorias.update({
          id: selectedCategoria.id,
          nombre: categoriaNombre.trim(),
        });
        Alert.alert('Éxito', 'Categoría actualizada correctamente');
      }

      setShowModal(false);
      loadCategorias();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'No se pudo guardar la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = (categoria: Categoria) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.categorias.delete(categoria.id);
              Alert.alert('Éxito', 'Categoría eliminada correctamente');
              loadCategorias();
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
          },
        },
      ]
    );
  };

  const renderCategoryItem = ({ item: categoria }: { item: Categoria }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <MaterialCommunityIcons
          name="shape"
          size={32}
          color={colors.primary}
        />
        <Text style={styles.categoryName}>{categoria.nombre}</Text>
      </View>

      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCategory(categoria)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(categoria)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="delete"
            size={20}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="shape-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No hay categorías creadas</Text>
      <Text style={styles.emptySubtitle}>
        Las categorías son globales y pueden asignarse a cualquier edición
      </Text>
      <TouchableOpacity
        style={styles.createFirstButton}
        onPress={handleCreateCategory}
      >
        <Text style={styles.createFirstButtonText}>
          Crear Primera Categoría
        </Text>
      </TouchableOpacity>
    </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>Gestión de Categorías</Text>
          <Text style={styles.subtitle}>Categorías Globales</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons
          name="information"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.infoBannerText}>
          Las categorías creadas aquí son globales y pueden asignarse a cualquier edición de torneo
        </Text>
      </View>

      {/* Categories List */}
      <FlatList
        data={categorias}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Only show if there are categories */}
      {categorias.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateCategory}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre de la Categoría</Text>
                <TextInput
                  style={styles.input}
                  value={categoriaNombre}
                  onChangeText={setCategoriaNombre}
                  placeholder="Ej: SUB16, SUB18, Libre"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveCategory}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {modalMode === 'create' ? 'Crear' : 'Guardar'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
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
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
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
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  createFirstButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
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
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
});

export default ManageCategoriesScreen;
