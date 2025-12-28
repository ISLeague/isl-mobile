import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Grupo } from '../../../api/types';
import { SearchBar } from '../../../components/common';
import { useSearch } from '../../../hooks';

interface MoveTeamToGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGroup: (grupoId: number) => void;
  grupos: Grupo[];
  currentGrupoId: number;
  equipoNombre: string;
}

export const MoveTeamToGroupModal: React.FC<MoveTeamToGroupModalProps> = ({
  visible,
  onClose,
  onSelectGroup,
  grupos,
  currentGrupoId,
  equipoNombre,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    filteredData: filteredGrupos,
    clearSearch,
  } = useSearch(grupos, 'nombre');

  // Filtrar el grupo actual
  const availableGrupos = filteredGrupos.filter(g => g.id_grupo !== currentGrupoId);

  const handleSelectGroup = (grupoId: number) => {
    onSelectGroup(grupoId);
    onClose();
  };

  const renderGrupo = ({ item: grupo }: { item: Grupo }) => (
    <TouchableOpacity
      style={styles.grupoItem}
      onPress={() => handleSelectGroup(grupo.id_grupo)}
      activeOpacity={0.7}
    >
      <View style={styles.grupoIcon}>
        <MaterialCommunityIcons name="group" size={24} color={colors.primary} />
      </View>
      <View style={styles.grupoInfo}>
        <Text style={styles.grupoNombre}>{grupo.nombre}</Text>
        <Text style={styles.grupoDetalle}>
          Grupo {grupo.nombre}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mover "{equipoNombre}"</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Selecciona el grupo destino:</Text>

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar grupo..."
            onClear={clearSearch}
          />

          {/* Lista de Grupos */}
          <FlatList
            data={availableGrupos}
            renderItem={renderGrupo}
            keyExtractor={(item) => item.id_grupo.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.textLight} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No se encontraron grupos' : 'No hay grupos disponibles'}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  grupoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  grupoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  grupoInfo: {
    flex: 1,
  },
  grupoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  grupoDetalle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
