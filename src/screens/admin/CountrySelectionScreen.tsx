import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import api from '../../api';
import { Pais } from '../../api/types';
import { useAuth } from '../../contexts/AuthContext';

export const CountrySelectionScreen = ({ navigation }: any) => {
  const { isAdmin, isFan } = useAuth();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryEmoji, setNewCountryEmoji] = useState('');

  useEffect(() => {
    loadPaises();
  }, []);

  const loadPaises = async () => {
    try {
      const data = await api.paises.list();
      setPaises(data);
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountry = (pais: Pais) => {
    Alert.alert(
      'Confirmar Selección',
      `¿Deseas administrar los torneos de ${pais.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            // Aquí guardarías el país del admin
            // Por ahora simulamos y navegamos
            navigation.replace('AdminTournaments', { pais });
          },
        },
      ]
    );
  };

  const handleCreateCountry = () => {
    if (!newCountryName.trim()) {
      Alert.alert('Error', 'El nombre del país es requerido');
      return;
    }

    // Simulación de creación
    const newCountry: Pais = {
      id_pais: paises.length + 1,
      nombre: newCountryName,
      codigo_iso: '',
      emoji: newCountryEmoji || '🌎',
    };

    setPaises([...paises, newCountry]);
    setShowCreateModal(false);
    setNewCountryName('');
    setNewCountryEmoji('');
    
    Alert.alert('¡Éxito!', `País ${newCountryName} creado correctamente`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando países...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>👨‍💼 ADMIN</Text>
          </View>
          <Text style={styles.title}>Selecciona tu País</Text>
          <Text style={styles.subtitle}>
            Elige el país que administrarás o crea uno nuevo
          </Text>
        </View>

        {/* Existing Countries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Países Disponibles</Text>
          
          {paises.map((pais) => (
            <TouchableOpacity
              key={pais.id_pais}
              style={styles.countryCard}
              onPress={() => handleSelectCountry(pais)}
              activeOpacity={0.7}
            >
              <View style={styles.countryIcon}>
                <Text style={styles.countryEmoji}>{pais.emoji || '🌎'}</Text>
              </View>
              <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{pais.nombre}</Text>
                <Text style={styles.countrySubtitle}>
                  Toca para administrar
                </Text>
              </View>
              <View style={styles.selectIcon}>
                <Text style={styles.selectIconText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create New Country Button - Solo para admins */}
        {isAdmin && (
          <View style={styles.createSection}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <View style={styles.createIconContainer}>
                <Text style={styles.createIcon}>➕</Text>
              </View>
              <Text style={styles.createButtonText}>Crear Nuevo País</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Country Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Nuevo País</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del País *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Argentina"
                value={newCountryName}
                onChangeText={setNewCountryName}
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emoji (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 🇦🇷"
                value={newCountryEmoji}
                onChangeText={setNewCountryEmoji}
                placeholderTextColor={colors.textLight}
                maxLength={2}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewCountryName('');
                  setNewCountryEmoji('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateCountry}
              >
                <Text style={styles.confirmButtonText}>Crear</Text>
              </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  adminBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  countryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  countryEmoji: {
    fontSize: 32,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  countrySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectIconText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  createSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  createIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  createIcon: {
    fontSize: 24,
    color: colors.white,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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
    borderWidth: 2,
    borderColor: 'transparent',
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
});

export default CountrySelectionScreen;