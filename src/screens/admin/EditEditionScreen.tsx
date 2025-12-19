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
import { Edicion, EstadoEdicion } from '../../api/types/ediciones.types';
import {
  AdminEdicionAsignacion,
  AdminEdicionDisponible,
} from '../../api/types/admin-edicion';
import { useAuth } from '../../contexts/AuthContext';

const ESTADOS: { value: EstadoEdicion; label: string; color: string }[] = [
  { value: 'abierto', label: 'Abierto', color: '#4caf50' },
  { value: 'en_curso', label: 'En Curso', color: '#2196f3' },
  { value: 'cerrado', label: 'Cerrado', color: '#9e9e9e' },
];

export const EditEditionScreen = ({ navigation, route }: any) => {
  const { edicion, torneo, pais } = route.params;
  const { isSuperAdmin, usuario } = useAuth();

  // Check if user can edit this edition
  const canEditEdition =
    isSuperAdmin ||
    (usuario?.id_torneos && usuario.id_torneos.includes(torneo.id_torneo));

  useEffect(() => {
    if (!canEditEdition) {
      Alert.alert(
        'Acceso Denegado',
        'No tienes permisos para editar esta edición',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [canEditEdition]);

  // Edition form state
  const [numero, setNumero] = useState(edicion.numero.toString());
  const [nombre, setNombre] = useState(edicion.nombre);
  const [estado, setEstado] = useState<EstadoEdicion>(edicion.estado);
  const [fechaInicio, setFechaInicio] = useState(edicion.fecha_inicio.split('T')[0]);
  const [fechaFin, setFechaFin] = useState(edicion.fecha_fin.split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  // Admins state
  const [assignedAdmins, setAssignedAdmins] = useState<AdminEdicionAsignacion[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<AdminEdicionDisponible[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingAvailableAdmins, setLoadingAvailableAdmins] = useState(false);

  // Modals state
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

  // Create admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminNombre, setNewAdminNombre] = useState('');
  const [newAdminApellido, setNewAdminApellido] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true);

      // Load assigned admins for this edition - handle errors gracefully
      try {
        const assignedResponse = await api.adminEdicion.list({
          id_edicion: edicion.id_edicion,
        });
        setAssignedAdmins(assignedResponse.data.data || []);
      } catch (error: any) {
        // Silently handle all errors - just show empty state
        // This is expected when no admins are assigned yet or endpoint doesn't exist
        setAssignedAdmins([]);
      }
    } catch (error) {
      // Silently handle outer errors
      setAssignedAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const loadAvailableAdmins = async () => {
    try {
      setLoadingAvailableAdmins(true);
      const response = await api.adminEdicion.disponibles(edicion.id_edicion);
      setAvailableAdmins(response.data.data || []);
    } catch (error: any) {
      // Silently handle all errors - just show empty state
      setAvailableAdmins([]);
    } finally {
      setLoadingAvailableAdmins(false);
    }
  };

  const handleSaveEdition = async () => {
    if (!numero.trim() || !nombre.trim() || !fechaInicio.trim() || !fechaFin.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const numeroValue = parseInt(numero.trim());
    if (isNaN(numeroValue) || numeroValue <= 0) {
      Alert.alert('Error', 'El número de edición debe ser un número válido');
      return;
    }

    try {
      setIsSaving(true);
      await api.ediciones.update(edicion.id_edicion, {
        numero: numeroValue,
        nombre: nombre.trim(),
        estado,
        fecha_inicio: fechaInicio.trim(),
        fecha_fin: fechaFin.trim(),
      });

      Alert.alert('Éxito', 'Edición actualizada correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating edition:', error);
      Alert.alert('Error', 'No se pudo actualizar la edición');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignAdmin = (admin: AdminEdicionDisponible) => {
    Alert.alert(
      'Confirmar Asignación',
      `¿Estás seguro que deseas asignar a ${admin.nombre_completo} como administrador de esta edición?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Asignar',
          onPress: async () => {
            try {
              setShowAssignAdminModal(false);

              Alert.alert('Asignando...', 'Por favor espera', [], { cancelable: false });

              await api.adminEdicion.asignar({
                id_usuario: admin.id_usuario,
                id_edicion: edicion.id_edicion,
              });

              Alert.alert('Éxito', 'Administrador asignado correctamente');
              loadAdmins();
            } catch (error) {
              console.error('Error assigning admin:', error);
              Alert.alert('Error', 'No se pudo asignar el administrador');
            }
          },
        },
      ]
    );
  };

  const handleOpenAssignModal = () => {
    setShowAssignAdminModal(true);
    loadAvailableAdmins();
  };

  const handleRemoveAdmin = (admin: AdminEdicionAsignacion) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro que deseas quitar a ${admin.usuario.nombre_completo} de esta edición?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('Removiendo...', 'Por favor espera', [], { cancelable: false });

              await api.adminEdicion.delete({ id_admin_edicion: admin.id });

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
    if (!newAdminEmail.trim() || !newAdminNombre.trim() || !newAdminApellido.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      setIsCreatingAdmin(true);

      // Register new admin with temporary credentials
      const registerResponse = await api.adminEdicion.register({
        nombre: newAdminNombre.trim(),
        apellido: newAdminApellido.trim(),
        email: newAdminEmail.trim(),
      });

      // Get the created user's ID from the response
      const usuarioId = registerResponse.data.usuario.id;

      // Now assign the newly created admin to this edition
      await api.adminEdicion.asignar({
        id_usuario: parseInt(usuarioId),
        id_edicion: edicion.id_edicion,
      });

      Alert.alert(
        'Éxito',
        `Administrador creado y asignado correctamente.\n\nSe han enviado las credenciales temporales a ${newAdminEmail}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateAdminModal(false);
              setNewAdminEmail('');
              setNewAdminNombre('');
              setNewAdminApellido('');
              loadAdmins();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating admin:', error);
      Alert.alert('Error', 'No se pudo crear el administrador');
      setIsCreatingAdmin(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>Editar Edición</Text>
          <Text style={styles.subtitle}>{torneo.nombre}</Text>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveEdition}
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
        {/* Edition Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN DE LA EDICIÓN</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Número de Edición</Text>
            <TextInput
              style={styles.input}
              value={numero}
              onChangeText={setNumero}
              placeholder="Ej: 2024, 2025"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre de la edición"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Estado</Text>
            <View style={styles.estadosContainer}>
              {ESTADOS.map((est) => (
                <TouchableOpacity
                  key={est.value}
                  style={[
                    styles.estadoChip,
                    estado === est.value && styles.estadoChipActive,
                    estado === est.value && { borderColor: est.color },
                  ]}
                  onPress={() => setEstado(est.value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.estadoDot,
                      { backgroundColor: estado === est.value ? est.color : colors.border },
                    ]}
                  />
                  <Text
                    style={[
                      styles.estadoText,
                      estado === est.value && styles.estadoTextActive,
                    ]}
                  >
                    {est.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha de Inicio</Text>
            <TextInput
              style={styles.input}
              value={fechaInicio}
              onChangeText={setFechaInicio}
              placeholder="2025-03-01"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>Formato: AAAA-MM-DD (ej: 2025-03-01)</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha de Fin</Text>
            <TextInput
              style={styles.input}
              value={fechaFin}
              onChangeText={setFechaFin}
              placeholder="2025-08-31"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>Formato: AAAA-MM-DD (ej: 2025-08-31)</Text>
          </View>
        </View>

        {/* Admins Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADMINISTRADORES</Text>

          {loadingAdmins ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando administradores...</Text>
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
                    <View key={admin.id} style={styles.adminCard}>
                      <View style={styles.adminInfo}>
                        <MaterialCommunityIcons
                          name="account-circle"
                          size={40}
                          color={colors.primary}
                        />
                        <View style={styles.adminText}>
                          <Text style={styles.adminName}>{admin.usuario.nombre_completo}</Text>
                          <Text style={styles.adminEmail}>
                            Asignado el {new Date(admin.asignado_el).toLocaleDateString('es-ES')}
                          </Text>
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
                  onPress={handleOpenAssignModal}
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
              {loadingAvailableAdmins ? (
                <View style={styles.loadingModal}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingModalText}>
                    Cargando administradores disponibles...
                  </Text>
                </View>
              ) : availableAdmins.length === 0 ? (
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
                        <Text style={styles.adminEmail}>
                          {admin.estadisticas.total_ediciones} ediciones asignadas
                        </Text>
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
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Se generarán credenciales temporales y se enviarán al email del administrador
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={newAdminNombre}
                  onChangeText={setNewAdminNombre}
                  placeholder="Ej: Juan"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  value={newAdminApellido}
                  onChangeText={setNewAdminApellido}
                  placeholder="Ej: Pérez"
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
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
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
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  estadosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  estadoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundGray,
  },
  estadoChipActive: {
    backgroundColor: colors.white,
  },
  estadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  estadoTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  loadingModal: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingModalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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

export default EditEditionScreen;
