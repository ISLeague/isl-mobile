import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../api';

export const ManageFixtureScreen = ({ navigation, route }: any) => {
  const { torneo, pais, categoria } = route.params;
  
  // Estados
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categoria);
  const [activeTab, setActiveTab] = useState('Fixture');
  const [fases, setFases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFase, setSelectedFase] = useState<any>(null);

  // Formularios
  const [formData, setFormData] = useState({
    nombreRonda: '',
    fecha: '',
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar categorías si no las tenemos
      if (categorias.length === 0) {
        const cats = await api.categorias.getByEdition(torneo.id_edicion);
        setCategorias(cats.map(c => ({
          ...c.categoria,
          id_edicion_categoria: c.id_edicion_categoria,
        })));
      }
      
      // Cargar fases de la categoría seleccionada
      const fasesData = await api.competition.getPhases(selectedCategory.id_edicion_categoria);
      setFases(fasesData.map(fase => ({
        ...fase,
        expanded: false,
      })));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (cat: any) => {
    setSelectedCategory(cat);
    setShowCategoryModal(false);
  };

  const handleToggleFase = (id: number) => {
    setFases(fases.map(fase => ({
      ...fase,
      expanded: fase.id_fase === id ? !fase.expanded : fase.expanded
    })));
  };

  const handleEditFase = (e: any, fase: any) => {
    e.stopPropagation();
    setSelectedFase(fase);
    setFormData({
      nombreRonda: fase.nombre,
      fecha: '',
    });
    setShowEditModal(true);
  };

  const handleCreateMatch = () => {
    setFormData({
      nombreRonda: '',
      fecha: '',
    });
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    // Aquí iría la lógica para crear el partido usando el endpoint
    // POST /admin/phases/{id_fase}/matches
    console.log('Crear partido:', formData);
    setShowCreateModal(false);
  };

  const handleModify = async () => {
    // Aquí iría la lógica para modificar la fase
    // PUT /admin/phases/{id_fase}
    console.log('Modificar fase:', formData);
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Rojo */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>⚽</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{torneo.nombre}</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.categoryText}>{selectedCategory?.nombre}</Text>
              <Text style={styles.dropdownIcon}> ▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['Grupos', 'Fixture', 'Local'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab);
                if (tab === 'Grupos') {
                  navigation.navigate('ManageGroups', { torneo, pais, categoria: selectedCategory });
                }
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {fases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay fases creadas</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para crear una nueva fase</Text>
          </View>
        ) : (
          fases.map((fase) => (
            <View key={fase.id_fase} style={styles.roundContainer}>
              <TouchableOpacity
                style={styles.roundHeader}
                onPress={() => handleToggleFase(fase.id_fase)}
                activeOpacity={0.7}
              >
                <Text style={styles.roundTitle}>{fase.nombre}</Text>
                <View style={styles.roundActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => handleEditFase(e, fase)}
                  >
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.expandButton}>
                    <Text style={styles.expandIcon}>
                      {fase.expanded ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {fase.expanded && (
                <View style={styles.roundContent}>
                  <Text style={styles.emptyContentText}>
                    No hay partidos programados en esta fase
                  </Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botones Flotantes */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity style={styles.floatingButton}>
          <Text style={styles.floatingButtonText}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleCreateMatch}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Selección de Categoría */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.id_categoria}
                style={[
                  styles.categoryOption,
                  selectedCategory?.id_categoria === cat.id_categoria && styles.categoryOptionSelected
                ]}
                onPress={() => handleCategorySelect(cat)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  selectedCategory?.id_categoria === cat.id_categoria && styles.categoryOptionTextSelected
                ]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Crear Partido */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.matchModalContent}>
            <View style={styles.matchModalHeader}>
              <Text style={styles.matchModalTitle}>Crear Partido</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre Ronda</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seleccionar ronda"
                  value={formData.nombreRonda}
                  onChangeText={(text) => setFormData({ ...formData, nombreRonda: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Fecha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  value={formData.fecha}
                  onChangeText={(text) => setFormData({ ...formData, fecha: text })}
                />
              </View>

              <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
                <Text style={styles.createButtonText}>Crear</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Editar Fase */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.matchModalContent}>
            <View style={styles.matchModalHeader}>
              <Text style={styles.matchModalTitle}>Modificar Fase</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre Fase</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de la fase"
                  value={formData.nombreRonda}
                  onChangeText={(text) => setFormData({ ...formData, nombreRonda: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Fecha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  value={formData.fecha}
                  onChangeText={(text) => setFormData({ ...formData, fecha: text })}
                />
              </View>

              <TouchableOpacity style={styles.modifyButton} onPress={handleModify}>
                <Text style={styles.createButtonText}>Modificar</Text>
              </TouchableOpacity>
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
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#C41E3A',
    paddingBottom: 0,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 28,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  roundContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  roundActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  editIcon: {
    fontSize: 16,
  },
  expandButton: {
    padding: 8,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666666',
  },
  roundContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  emptyContentText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 12,
  },
  floatingButtonText: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  categoryOptionSelected: {
    backgroundColor: '#C41E3A',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  matchModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
    position: 'absolute',
    bottom: 0,
  },
  matchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  matchModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#C41E3A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  modifyButton: {
    backgroundColor: '#C41E3A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageFixtureScreen;