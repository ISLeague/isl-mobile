import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { mockCategorias } from '../../data/mockData';
import { Categoria } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const TournamentCategoriesScreen = ({ navigation, route }: any) => {
  const { isAdmin, isTournamentAdmin } = useAuth();
  const { torneo, pais } = route.params;
  const [categorias, setCategorias] = useState<Categoria[]>(mockCategorias);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [tieneRestriccionEdad, setTieneRestriccionEdad] = useState(false);
  const [edadMaxima, setEdadMaxima] = useState('');
  const [permiteRefuerzos, setPermiteRefuerzos] = useState(false);
  const [maxRefuerzos, setMaxRefuerzos] = useState('');

  const handleSelectCategory = (categoria: Categoria) => {
    setSelectedCategory(categoria.id_categoria);
    // Navegar a la gestión de la categoría
    navigation.navigate('CategoryManagement', { torneo, pais, categoria });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es requerido');
      return;
    }

    if (tieneRestriccionEdad && (!edadMaxima || parseInt(edadMaxima) <= 0)) {
      Alert.alert('Error', 'Debes especificar una edad máxima válida');
      return;
    }

    if (permiteRefuerzos && (!maxRefuerzos || parseInt(maxRefuerzos) <= 0)) {
      Alert.alert('Error', 'Debes especificar el número máximo de refuerzos');
      return;
    }

    const newCategory: Categoria = {
      id_categoria: categorias.length + 1,
      nombre: newCategoryName,
      tiene_restriccion_edad: tieneRestriccionEdad,
      edad_maxima: tieneRestriccionEdad ? parseInt(edadMaxima) : undefined,
      permite_refuerzos: permiteRefuerzos,
      max_refuerzos: permiteRefuerzos ? parseInt(maxRefuerzos) : undefined,
    };

    setCategorias([...categorias, newCategory]);
    setShowModal(false);
    setNewCategoryName('');
    setTieneRestriccionEdad(false);
    setEdadMaxima('');
    setPermiteRefuerzos(false);
    setMaxRefuerzos('');
    Alert.alert('¡Éxito!', `Categoría "${newCategoryName}" creada`);
  };

  const handleDeleteCategory = (categoria: Categoria) => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro de eliminar "${categoria.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Llamar API
              // await api.categories.deleteCategory(categoria.id_categoria);
              console.log('Eliminar categoría:', categoria.id_categoria);
              setCategorias(categorias.filter(c => c.id_categoria !== categoria.id_categoria));
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (categoria: Categoria) => (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -20, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });

    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteButton,
          {
            opacity,
            transform: [{ translateX }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeDeleteButtonInner}
          onPress={() => handleDeleteCategory(categoria)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="delete" size={28} color={colors.white} />
          <Text style={styles.swipeDeleteText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
            <Text style={styles.title}>{torneo.nombre}</Text>
          </View>
        </View>

        {/* Categories List */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          
          {categorias.map((categoria) => {
            const content = (
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  selectedCategory === categoria.id_categoria && styles.categoryCardSelected,
                ]}
                onPress={() => handleSelectCategory(categoria)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryInfo}>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === categoria.id_categoria && styles.categoryNameSelected,
                  ]}>
                    {categoria.nombre}
                  </Text>
                </View>
                {selectedCategory === categoria.id_categoria && (
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkIconText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );

            if (isAdmin) {
              return (
                <Swipeable
                  key={categoria.id_categoria}
                  renderRightActions={renderRightActions(categoria)}
                  rightThreshold={40}
                  overshootRight={false}
                  friction={1.5}
                  overshootFriction={8}
                  enableTrackpadTwoFingerGesture
                >
                  {content}
                </Swipeable>
              );
            }

            return <View key={categoria.id_categoria}>{content}</View>;
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      </GestureHandlerRootView>

      {/* Floating Add Button - Solo para admins */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Category Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Agregar Categoría</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la Categoría *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: SUB20"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="characters"
                />
              </View>

              {/* Restricción de Edad */}
              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setTieneRestriccionEdad(!tieneRestriccionEdad)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, tieneRestriccionEdad && styles.checkboxChecked]}>
                    {tieneRestriccionEdad && (
                      <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Tiene restricción de edad</Text>
                </TouchableOpacity>

                {tieneRestriccionEdad && (
                  <View style={styles.subInputGroup}>
                    <Text style={styles.inputLabel}>Edad Máxima *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: 18"
                      value={edadMaxima}
                      onChangeText={setEdadMaxima}
                      placeholderTextColor={colors.textLight}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>

              {/* Refuerzos */}
              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setPermiteRefuerzos(!permiteRefuerzos)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, permiteRefuerzos && styles.checkboxChecked]}>
                    {permiteRefuerzos && (
                      <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Permite refuerzos</Text>
                </TouchableOpacity>

                {permiteRefuerzos && (
                  <View style={styles.subInputGroup}>
                    <Text style={styles.inputLabel}>Número Máximo de Refuerzos *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: 3"
                      value={maxRefuerzos}
                      onChangeText={setMaxRefuerzos}
                      placeholderTextColor={colors.textLight}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowModal(false);
                    setNewCategoryName('');
                    setTieneRestriccionEdad(false);
                    setEdadMaxima('');
                    setPermiteRefuerzos(false);
                    setMaxRefuerzos('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.confirmButtonText}>Agregar</Text>
                </TouchableOpacity>
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
    backgroundColor: colors.backgroundGray,
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
  },
  paisEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryNameSelected: {
    color: colors.primary,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  checkboxGroup: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  subInputGroup: {
    marginLeft: 36,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundGray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  swipeDeleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: 73,
    borderRadius: 10,
  },
  swipeDeleteButtonInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },	
  swipeDeleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default TournamentCategoriesScreen;