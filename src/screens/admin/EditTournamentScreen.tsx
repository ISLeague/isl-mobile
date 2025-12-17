import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';
import { Torneo, Pais } from '../../api/types';
import { UsuarioListItem } from '../../api/types/usuarios.types';
import { useAuth } from '../../contexts/AuthContext';

export const EditTournamentScreen = ({ navigation, route }: any) => {
  const { torneo, pais } = route.params;
  const { isSuperAdmin, usuario } = useAuth();

  // Check if user can edit this tournament and manage admins
  const canEditTournament =
    isSuperAdmin ||
    (usuario?.id_torneos && usuario.id_torneos.includes(torneo.id_torneo));

  useEffect(() => {
    if (!canEditTournament) {
      Alert.alert(
        'Acceso Denegado',
        'No tienes permisos para editar este torneo',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [canEditTournament]);

  // Tournament form state
  const [nombre, setNombre] = useState(torneo.nombre);
  const [temporada, setTemporada] = useState(torneo.temporada);
  const [activo, setActivo] = useState(torneo.activo);
  const [isSaving, setIsSaving] = useState(false);

  // Admins state
  const [assignedAdmins, setAssignedAdmins] = useState<UsuarioListItem[]>([]);
  const [allAdmins, setAllAdmins] = useState<UsuarioListItem[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Modals state
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

  // Create admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminNombre, setNewAdminNombre] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true);

      // Load assigned admins for this tournament - handle errors gracefully
      try {
        const assignedResponse = await api.torneos.getAdmins(torneo.id_torneo);
        setAssignedAdmins(assignedResponse.data || []);
      } catch (error: any) {
        // If 404, it means no admins assigned yet, which is fine
        if (error?.response?.status === 404) {
          setAssignedAdmins([]);
        } else {
          console.error('Error loading assigned admins:', error);
          setAssignedAdmins([]);
        }
      }

      // Load all admins - handle errors gracefully
      try {
        const allAdminsResponse = await api.usuarios.listAdmins();
        setAllAdmins(allAdminsResponse.data || []);
      } catch (error: any) {
        // If 404, it means no admins exist yet, which is fine
        if (error?.response?.status === 404) {
          setAllAdmins([]);
        } else {
          console.error('Error loading all admins:', error);
          setAllAdmins([]);
        }
      }
    } catch (error) {
      console.error('Error in loadAdmins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleSaveTournament = async () => {
    if (!nombre.trim() || !temporada.trim()) {
      Alert.alert('Error', 'El nombre y la temporada son obligatorios');
      return;
    }

    try {
      setIsSaving(true);
      await api.torneos.update({
        id_torneo: torneo.id_torneo,
        nombre: nombre.trim(),
        temporada: temporada.trim(),
        activo,
      });

      Alert.alert('Éxito', 'Torneo actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating tournament:', error);
      Alert.alert('Error', 'No se pudo actualizar el torneo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignAdmin = async (admin: UsuarioListItem) => {
    try {
      await api.usuarios.asignarAdminTorneo({
        id_usuario: admin.id_usuario,
        id_torneos: [torneo.id_torneo],
      });

      Alert.alert('Éxito', 'Administrador asignado correctamente');
      setShowAssignAdminModal(false);
      loadAdmins();
    } catch (error) {
      console.error('Error assigning admin:', error);
      Alert.alert('Error', 'No se pudo asignar el administrador');
    }
  };

  const handleRemoveAdmin = (admin: UsuarioListItem) => {
    Alert.alert(
      'Confirmar',
      `¿Deseas quitar a ${admin.nombre_completo} de este torneo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.usuarios.removerAdminTorneo(admin.id_usuario, torneo.id_torneo);
              Alert.alert('Éxito', 'Administrador removido correctamente');
              loadAdmins();
            } catch (error) {
              console.error('Error removing admin:', error);
              Alert.alert('Error', 'No se pudo quitar el administrador');
            }
          },
        },
      ]
    );
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminPassword.trim() || !newAdminNombre.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      setIsCreatingAdmin(true);
      await api.usuarios.create({
        email: newAdminEmail.trim(),
        password: newAdminPassword,
        nombre_completo: newAdminNombre.trim(),
        rol: 'admin',
        id_pais: pais.id_pais,
        id_torneos: [torneo.id_torneo],
      });

      Alert.alert('Éxito', 'Administrador creado y asignado correctamente');
      setShowCreateAdminModal(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminNombre('');
      loadAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      Alert.alert('Error', 'No se pudo crear el administrador');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Filter out already assigned admins from the assign modal
  const availableAdmins = allAdmins.filter(
    admin => !assignedAdmins.some(assigned => assigned.id_usuario === admin.id_usuario)
  );

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
          <Text style={styles.title}>Editar Torneo</Text>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveTournament}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tournament Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN DEL TORNEO</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre del torneo"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Temporada</Text>
            <TextInput
              style={styles.input}
              value={temporada}
              onChangeText={setTemporada}
              placeholder="2024"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Estado</Text>
              <TouchableOpacity
                style={[styles.switch, activo && styles.switchActive]}
                onPress={() => setActivo(!activo)}
                activeOpacity={0.7}
              >
                <View style={[styles.switchThumb, activo && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.switchLabel}>
              {activo ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        {/* Admins Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADMINISTRADORES</Text>

          {loadingAdmins ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              {assignedAdmins.length === 0 ? (
                <View style={styles.emptyAdmins}>
                  <MaterialCommunityIcons
                    name="account-off"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    No hay administradores asignados
                  </Text>
                </View>
              ) : (
                <View style={styles.adminsList}>
                  {assignedAdmins.map((admin) => (
                    <View key={admin.id_usuario} style={styles.adminCard}>
                      <View style={styles.adminInfo}>
                        <MaterialCommunityIcons
                          name="account-circle"
                          size={40}
                          color={colors.primary}
                        />
                        <View style={styles.adminText}>
                          <Text style={styles.adminName}>{admin.nombre_completo}</Text>
                          <Text style={styles.adminEmail}>{admin.email}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveAdmin(admin)}
                      >
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={24}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.adminActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowAssignAdminModal(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="account-plus"
                    size={20}
                    color={colors.white}
                  />
                  <Text style={styles.actionButtonText}>Asignar Existente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => setShowCreateAdminModal(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.actionButtonTextSecondary}>Crear Nuevo</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Assign Admin Modal */}
      <Modal
        visible={showAssignAdminModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asignar Administrador</Text>
              <TouchableOpacity onPress={() => setShowAssignAdminModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {availableAdmins.length === 0 ? (
                <View style={styles.emptyModal}>
                  <Text style={styles.emptyModalText}>
                    No hay administradores disponibles para asignar
                  </Text>
                </View>
              ) : (
                availableAdmins.map((admin) => (
                  <TouchableOpacity
                    key={admin.id_usuario}
                    style={styles.modalAdminCard}
                    onPress={() => handleAssignAdmin(admin)}
                  >
                    <View style={styles.adminInfo}>
                      <MaterialCommunityIcons
                        name="account-circle"
                        size={40}
                        color={colors.primary}
                      />
                      <View style={styles.adminText}>
                        <Text style={styles.adminName}>{admin.nombre_completo}</Text>
                        <Text style={styles.adminEmail}>{admin.email}</Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Admin Modal */}
      <Modal
        visible={showCreateAdminModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Administrador</Text>
              <TouchableOpacity onPress={() => setShowCreateAdminModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre Completo</Text>
                <TextInput
                  style={styles.input}
                  value={newAdminNombre}
                  onChangeText={setNewAdminNombre}
                  placeholder="Ej: Juan Pérez"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={newAdminEmail}
                  onChangeText={setNewAdminEmail}
                  placeholder="admin@example.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={newAdminPassword}
                  onChangeText={setNewAdminPassword}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateAdmin}
                disabled={isCreatingAdmin}
              >
                {isCreatingAdmin ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.createButtonText}>Crear y Asignar</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.savingText}>Guardando...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 16,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyAdmins: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  adminsList: {
    gap: 12,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adminText: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 4,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyModal: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalAdminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  savingText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
});

export default EditTournamentScreen;
