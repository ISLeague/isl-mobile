import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Modal, SearchBar, Button, Input } from '../../../components/common';
import { Equipo } from '../../../api/types';
import { useToast } from '../../../contexts/ToastContext';
import { safeAsync } from '../../../utils/errorHandling';
import { api } from '../../../api';

interface AddTeamToGroupModalProps {
  visible: boolean;
  onClose: () => void;
  grupoId: number;
  grupoNombre: string;
  equiposEnGrupo: number[]; // IDs de equipos ya en el grupo
  onAddTeam: (equipoId: number) => void;
  idEdicionCategoria: number;
}

type TabType = 'existing' | 'create';

export const AddTeamToGroupModal: React.FC<AddTeamToGroupModalProps> = ({
  visible,
  onClose,
  grupoId,
  grupoNombre,
  equiposEnGrupo,
  onAddTeam,
  idEdicionCategoria,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('existing');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { showSuccess, showWarning, showError } = useToast();

  // Load equipos from API when modal is visible
  useEffect(() => {
    const loadEquipos = async () => {
      if (!visible) return;

      const result = await safeAsync(
        async () => {
          const response = await api.equipos.list(idEdicionCategoria);
          return response.success && response.data ? response.data : [];
        },
        'AddTeamToGroupModal - loadEquipos',
        {
          fallbackValue: [],
          onError: (error) => {
            showError(error.message, 'Error al Cargar Equipos');
          },
        }
      );

      if (result) {
        setEquipos(result);
      }
    };

    loadEquipos();
  }, [visible, idEdicionCategoria, showError]);

  // Filtrar equipos que NO están en el grupo
  const equiposDisponibles = equipos.filter(
    equipo => !equiposEnGrupo.includes(equipo.id_equipo)
  );

  // Manual search filtering
  const filteredData = equiposDisponibles.filter(equipo => {
    if (!searchQuery) return true;
    const equipoNombre = equipo.nombre?.toLowerCase() || '';
    return equipoNombre.includes(searchQuery.toLowerCase());
  });

  const handleAddTeam = async () => {
    if (!selectedTeamId) {
      showWarning('Por favor selecciona un equipo', 'Equipo Requerido');
      return;
    }

    await safeAsync(
      async () => {
        // TODO: API call
        onAddTeam(selectedTeamId);
        showSuccess(`Equipo agregado a ${grupoNombre}`, 'Equipo Agregado');
        resetAndClose();
      },
      'AddTeamToGroupModal - handleAddTeam',
      {
        onError: (error) => {
          showError(error.message, 'Error al Agregar');
        },
      }
    );
  };

  const handleCreateAndAddTeam = async () => {
    if (!newTeamName.trim()) {
      showWarning('Ingresa el nombre del equipo', 'Nombre Requerido');
      return;
    }

    await safeAsync(
      async () => {
        // TODO: Llamar a la API para crear el equipo
        // const response = await api.equipos.create({
        //   nombre: newTeamName.trim(),
        //   logo_url: newTeamLogo.trim() || 'https://via.placeholder.com/100',
        //   id_edicion_categoria: idEdicionCategoria,
        // });
        // const nuevoEquipoId = response.data.id_equipo;

        // Simular creación con un ID temporal
        const nuevoEquipoId = equipos.length + 1;

        // TODO: Agregar el nuevo equipo al grupo via API
        onAddTeam(nuevoEquipoId);

        showSuccess(`Equipo "${newTeamName}" creado y agregado al grupo`, 'Equipo Creado');
        resetAndClose();
      },
      'AddTeamToGroupModal - handleCreateAndAddTeam',
      {
        onError: (error) => {
          showError(error.message, 'Error al Crear Equipo');
        },
      }
    );
  };

  const resetAndClose = () => {
    setSelectedTeamId(null);
    setNewTeamName('');
    setNewTeamLogo('');
    setActiveTab('existing');
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    resetAndClose();
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'existing' && styles.tabActive]}
        onPress={() => setActiveTab('existing')}
      >
        <MaterialCommunityIcons
          name="account-group"
          size={20}
          color={activeTab === 'existing' ? colors.primary : colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'existing' && styles.tabTextActive]}>
          Existentes
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'create' && styles.tabActive]}
        onPress={() => setActiveTab('create')}
      >
        <MaterialCommunityIcons
          name="plus-circle"
          size={20}
          color={activeTab === 'create' ? colors.primary : colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
          Crear Nuevo
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateTab = () => (
    <View style={styles.createTab}>
      <Text style={styles.createTitle}>Crear Nuevo Equipo</Text>
      <Text style={styles.createSubtitle}>
        El equipo se creará y agregará automáticamente al grupo
      </Text>

      <Input
        label="Nombre del Equipo *"
        value={newTeamName}
        onChangeText={setNewTeamName}
        placeholder="Ej: Leones FC"
        autoCapitalize="words"
      />

      <Input
        label="Logo URL (opcional)"
        value={newTeamLogo}
        onChangeText={setNewTeamLogo}
        placeholder="https://..."
        autoCapitalize="none"
        keyboardType="url"
      />

      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Vista Previa:</Text>
        <View style={styles.previewCard}>
          {newTeamLogo ? (
            <Image
              source={{ uri: newTeamLogo }}
              style={styles.previewLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.previewLogo, styles.previewLogoPlaceholder]}>
              <MaterialCommunityIcons name="shield" size={24} color={colors.textLight} />
            </View>
          )}
          <Text style={styles.previewName}>
            {newTeamName || 'Nombre del equipo'}
          </Text>
        </View>
      </View>

      <Button
        title="Crear y Agregar al Grupo"
        onPress={handleCreateAndAddTeam}
        disabled={!newTeamName.trim()}
        style={styles.createButton}
      />
    </View>
  );

  const renderTeamItem = ({ item }: { item: Equipo }) => {
    const isSelected = item.id_equipo === selectedTeamId;

    return (
      <TouchableOpacity
        style={[styles.teamItem, isSelected && styles.teamItemSelected]}
        onPress={() => setSelectedTeamId(item.id_equipo)}
        activeOpacity={0.7}
      >
        <Image
          source={require('../../../assets/InterLOGO.png')}
          style={styles.teamLogo}
          resizeMode="contain"
        />
        <View style={styles.teamInfo}>
          <Text style={[styles.teamName, isSelected && styles.teamNameSelected]}>
            {item.nombre}
          </Text>
          <Text style={styles.teamSubtitle}>
            Disponible para agregar
          </Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={`Agregar Equipo a ${grupoNombre}`}
      fullHeight
    >
      <View style={styles.container}>
        {renderTabBar()}

        {activeTab === 'existing' ? (
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar equipo..."
              onClear={() => setSearchQuery('')}
            />

            {equiposDisponibles.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={64}
                  color={colors.textLight}
                />
                <Text style={styles.emptyText}>
                  Todos los equipos ya están en grupos
                </Text>
              </View>
            ) : filteredData.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={64}
                  color={colors.textLight}
                />
                <Text style={styles.emptyText}>
                  No se encontraron equipos
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredData}
                renderItem={renderTeamItem}
                keyExtractor={(item) => item.id_equipo.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
              />
            )}

            <View style={styles.footer}>
              <Button
                title={`Agregar ${selectedTeamId ? '(1 seleccionado)' : ''}`}
                onPress={handleAddTeam}
                disabled={!selectedTeamId}
                style={styles.addButton}
              />
            </View>
          </>
        ) : (
          renderCreateTab()
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 4,
    margin: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  createTab: {
    flex: 1,
    padding: 16,
  },
  createTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  createSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  previewContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  previewLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  previewLogoPlaceholder: {
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  createButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  teamItemSelected: {
    borderColor: colors.success,
    backgroundColor: '#F0F9F0',
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  teamNameSelected: {
    color: colors.success,
  },
  teamSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.success,
  },
});

