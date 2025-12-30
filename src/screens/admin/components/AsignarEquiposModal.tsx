import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Modal, SearchBar, Button } from '../../../components/common';
import { Equipo } from '../../../api/types';
import { useToast } from '../../../contexts/ToastContext';
import { safeAsync } from '../../../utils/errorHandling';
import api from '../../../api';

interface AsignarEquiposModalProps {
  visible: boolean;
  onClose: () => void;
  grupoId: number;
  grupoNombre: string;
  idEdicionCategoria: number;
  onSuccess?: () => void;
}

export const AsignarEquiposModal: React.FC<AsignarEquiposModalProps> = ({
  visible,
  onClose,
  grupoId,
  grupoNombre,
  idEdicionCategoria,
  onSuccess,
}) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedEquipos, setSelectedEquipos] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const { showSuccess, showError } = useToast();

  // Load equipos from API when modal is visible
  useEffect(() => {
    if (visible) {
      loadEquipos();
    } else {
      // Reset cuando se cierra
      setSelectedEquipos([]);
      setSearchQuery('');
    }
  }, [visible, idEdicionCategoria]);

  const loadEquipos = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        const response = await api.equipos.list(idEdicionCategoria, true);
        return response;
      },
      'AsignarEquiposModal - loadEquipos',
      {
        fallbackValue: null,
        onError: () => showError('Error al cargar los equipos')
      }
    );

    if (result && result.success && result.data) {
      setEquipos(result.data);
    }
    setLoading(false);
  };

  // Manual search filtering
  const filteredEquipos = equipos.filter(equipo => {
    if (!searchQuery) return true;
    const equipoNombre = equipo.nombre?.toLowerCase() || '';
    return equipoNombre.includes(searchQuery.toLowerCase());
  });

  const toggleEquipo = (equipoId: number) => {
    setSelectedEquipos(prev => {
      if (prev.includes(equipoId)) {
        // Remover del array
        return prev.filter(id => id !== equipoId);
      } else {
        // Agregar al array
        return [...prev, equipoId];
      }
    });
  };

  const moveEquipoUp = (equipoId: number) => {
    const index = selectedEquipos.indexOf(equipoId);
    if (index > 0) {
      const newOrder = [...selectedEquipos];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setSelectedEquipos(newOrder);
    }
  };

  const moveEquipoDown = (equipoId: number) => {
    const index = selectedEquipos.indexOf(equipoId);
    if (index < selectedEquipos.length - 1) {
      const newOrder = [...selectedEquipos];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setSelectedEquipos(newOrder);
    }
  };

  const handleAsignarEquipos = async () => {
    if (selectedEquipos.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un equipo');
      return;
    }

    Alert.alert(
      'Confirmar Asignación',
      `¿Asignar ${selectedEquipos.length} equipo(s) a "${grupoNombre}"?\n\nEl orden seleccionado determinará la posición inicial en la tabla.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Asignar',
          onPress: async () => {
            setAssigning(true);
            const result = await safeAsync(
              async () => {
                const response = await api.grupos.asignarEquipos({
                  id_grupo: grupoId,
                  equipos: selectedEquipos,
                });
                return response;
              },
              'AsignarEquiposModal - asignarEquipos',
              {
                fallbackValue: null,
                onError: () => showError('Error al asignar equipos')
              }
            );

            if (result && result.success) {
              showSuccess(
                `${result.data.equipos_asignados} equipo(s) asignado(s) a "${grupoNombre}"`
              );
              onSuccess?.();
              onClose();
            }
            setAssigning(false);
          }
        }
      ]
    );
  };

  const renderEquipoItem = ({ item }: { item: Equipo }) => {
    const isSelected = selectedEquipos.includes(item.id_equipo);
    const selectionIndex = selectedEquipos.indexOf(item.id_equipo);
    const isFirst = selectionIndex === 0;
    const isLast = selectionIndex === selectedEquipos.length - 1;

    return (
      <TouchableOpacity
        style={[styles.equipoItem, isSelected && styles.equipoItemSelected]}
        onPress={() => toggleEquipo(item.id_equipo)}
        activeOpacity={0.7}
      >
        <Image
          source={item.logo ? { uri: item.logo } : require('../../../assets/InterLOGO.png')}
          style={styles.equipoLogo}
        />
        <View style={styles.equipoInfo}>
          <Text style={styles.equipoNombre}>{item.nombre}</Text>
          {isSelected && (
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>#{selectionIndex + 1}</Text>
            </View>
          )}
        </View>

        {isSelected && (
          <View style={styles.orderButtons}>
            <TouchableOpacity
              style={[styles.orderButton, isFirst && styles.orderButtonDisabled]}
              onPress={() => moveEquipoUp(item.id_equipo)}
              disabled={isFirst}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={20}
                color={isFirst ? colors.textLight : colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.orderButton, isLast && styles.orderButtonDisabled]}
              onPress={() => moveEquipoDown(item.id_equipo)}
              disabled={isLast}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={isLast ? colors.textLight : colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.checkbox}>
          {isSelected ? (
            <MaterialCommunityIcons name="checkbox-marked" size={24} color={colors.success} />
          ) : (
            <MaterialCommunityIcons name="checkbox-blank-outline" size={24} color={colors.textLight} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title={`Asignar Equipos a ${grupoNombre}`}>
      <View style={styles.container}>
        {/* Header Section - Fixed */}
        <View style={styles.headerSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar equipo..."
            onClear={() => setSearchQuery('')}
          />

          {selectedEquipos.length > 0 && (
            <View style={styles.selectedCountContainer}>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
              <Text style={styles.selectedCountText}>
                {selectedEquipos.length} equipo(s) seleccionado(s)
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedEquipos([])}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              Selecciona los equipos en el orden que deseas asignarlos
            </Text>
          </View>
        </View>

        {/* Body Section - Scrollable */}
        <View style={styles.bodySection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando equipos...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredEquipos}
              keyExtractor={(item) => item.id_equipo.toString()}
              renderItem={renderEquipoItem}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={64}
                    color={colors.textLight}
                  />
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? 'No se encontraron equipos' : 'No hay equipos para asignar'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? 'Intenta con otro término de búsqueda'
                      : 'Todos los equipos ya están asignados a grupos'
                    }
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* Footer Section - Fixed */}
        <View style={styles.footerSection}>
          <Button
            title="Cancelar"
            onPress={onClose}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title={`Asignar ${selectedEquipos.length > 0 ? `(${selectedEquipos.length})` : ''}`}
            onPress={handleAsignarEquipos}
            style={styles.button}
            disabled={selectedEquipos.length === 0 || assigning}
            loading={assigning}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 600,
  },
  headerSection: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  selectedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  selectedCountText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.error,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  bodySection: {
    flex: 1,
    minHeight: 300,
  },
  listContent: {
    paddingBottom: 16,
  },
  equipoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  equipoItemSelected: {
    borderColor: colors.success,
    backgroundColor: '#F0F9F0',
  },
  equipoLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  equipoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equipoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  orderBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  orderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  orderButtons: {
    flexDirection: 'column',
    gap: 4,
    marginRight: 8,
  },
  orderButton: {
    padding: 2,
  },
  orderButtonDisabled: {
    opacity: 0.3,
  },
  checkbox: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerSection: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
  },
  button: {
    flex: 1,
  },
});
