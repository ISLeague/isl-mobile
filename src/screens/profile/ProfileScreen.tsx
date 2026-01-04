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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Equipo } from '../../api/types/equipos.types';
import { Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../api';


export const ProfileScreen = ({ navigation: navProp }: any) => {
  const navigation = useNavigation<any>();
  const { usuario, isAdmin, isGuest, isTournamentAdmin, logout } = useAuth();
  const { colors, mode, toggle: toggleTheme } = useTheme();
  const [myTeam, setMyTeam] = useState<Equipo | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editTab, setEditTab] = useState<'profile' | 'password'>('profile');

  // Estados para editar perfil
  const [editName, setEditName] = useState(usuario?.email || '');
  const [editEmail, setEditEmail] = useState(usuario?.email || '');

  // Estados para cambiar contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para configuración
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [languageSelected, setLanguageSelected] = useState('es');

  useEffect(() => {
    // Aquí cargarías el equipo favorito del usuario
    // const team = await api.profile.getMyTeam(usuario.id_usuario);
    // setMyTeam(team);

    // TODO: Cargar usuarios desde la API para suplantación (solo admins)
    // if (isAdmin) {
    //   const loadUsuarios = async () => {
    //     const users = await api.usuarios.list();
    //     setUsuarios(users.filter(u => u.id_usuario !== usuario?.id_usuario));
    //   };
    //   loadUsuarios();
    // }

    // Inicializar datos de edición
    if (usuario) {
      setEditName(usuario.email.split('@')[0]);
      setEditEmail(usuario.email);
    }
  }, [usuario]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Por favor completa el nombre');
      return;
    }

    try {
      await api.usuarios.updateProfile({ nombre: editName });

      // Actualizar contexto local
      if (usuario) {
        // Asumiendo que updateUsuario fusiona o reemplaza
        // Como Usuario interface puede variar, intentamos actualizar lo que podemos
        // updateUsuario({ ...usuario, nombre: editName } as any);
      }

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setShowEditProfileModal(false);
    } catch (error) {
      // console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      await api.usuarios.changePassword(newPassword);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setShowEditProfileModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la contraseña. Verifica tu contraseña actual.');
    }
  };

  // Ver Mis Torneos (para admin de torneo)
  const handleMisTorneos = () => {
    navigation.navigate('TournamentAdminDashboard');
  };

  if (!usuario) {
    return null;
  }

  // Estilos dinámicos que usan el tema actual
  const styles = createStyles(colors);

  // Lista de opciones del perfil
  const menuItems = [
    ...(isTournamentAdmin ? [
      {
        id: 0,
        icon: 'trophy',
        title: 'Mis Torneos',
        subtitle: 'Gestionar mis torneos asignados',
        onPress: handleMisTorneos,
        highlight: true,
      }
    ] : []),
    {
      id: 4,
      icon: 'web',
      title: 'Redes Sociales',
      subtitle: 'Síguenos en redes',
      onPress: () =>
        Linking.openURL(
          'https://linktr.ee/idp.pe?utm_source=linktree_profile_share&ltsid=2c882a4e-5a1a-4265-a750-7f5fd3f34aaf'
        ),
    },
    {
      id: 5,
      icon: 'cog-outline',
      title: 'Configuración',
      subtitle: 'Ajustes de la cuenta',
      onPress: () => setShowConfigModal(true),
    },
    {
      id: 6,
      icon: 'help-circle-outline',
      title: 'Ayuda y Soporte',
      subtitle: '¿Necesitas ayuda?',
      onPress: () => Linking.openURL('mailto:bdiaz@intercollegecorp.com'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {!isTournamentAdmin && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        {/* Vista especial para INVITADOS */}
        {isGuest ? (
          <View style={styles.guestContainer}>
            <View style={styles.guestCard}>
              <View style={styles.guestIconContainer}>
                <MaterialCommunityIcons name="account-alert-outline" size={80} color={colors.primary} />
              </View>

              <Text style={styles.guestTitle}>Estás navegando como invitado</Text>
              <Text style={styles.guestSubtitle}>
                Para disfrutar de todas las funcionalidades de ISL, crea una cuenta o inicia sesión
              </Text>

              <View style={styles.guestBenefits}>
                <Text style={styles.benefitsTitle}>Con una cuenta podrás:</Text>

                <View style={styles.benefitItem}>
                  <MaterialCommunityIcons name="heart" size={20} color={colors.primary} />
                  <Text style={styles.benefitText}>Seguir a tu equipo favorito</Text>
                </View>

                <View style={styles.benefitItem}>
                  <MaterialCommunityIcons name="image-multiple" size={20} color={colors.primary} />
                  <Text style={styles.benefitText}>Ver y comprar fotos de los partidos</Text>
                </View>

                <View style={styles.benefitItem}>
                  <MaterialCommunityIcons name="bell" size={20} color={colors.primary} />
                  <Text style={styles.benefitText}>Recibir notificaciones de tus equipos</Text>
                </View>

                <View style={styles.benefitItem}>
                  <MaterialCommunityIcons name="account-multiple" size={20} color={colors.primary} />
                  <Text style={styles.benefitText}>Conectar con otros fanáticos</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.guestLoginButton}
                onPress={() => {
                  logout();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }}
              >
                <Text style={styles.guestLoginButtonText}>Iniciar Sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guestRegisterButton}
                onPress={() => {
                  logout();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Register' }],
                  });
                }}
              >
                <Text style={styles.guestRegisterButtonText}>Crear Cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* User Info Card */}
            <View style={styles.userCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {usuario.email.charAt(0).toUpperCase()}
                  </Text>
                </View>
                {usuario.pais && (
                  <View style={styles.countryBadge}>
                    <Text style={styles.countryEmoji}>{usuario.pais.emoji}</Text>
                  </View>
                )}
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{usuario.email.split('@')[0]}</Text>
                <Text style={styles.userEmail}>{usuario.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {usuario.rol.toUpperCase()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setEditTab('profile');
                  setShowEditProfileModal(true);
                }}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            </View>



            {/* Menu Items */}
            <View style={styles.menuSection}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    (item as any).highlight && styles.menuItemHighlight
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.menuIconContainer,
                    (item as any).highlight && styles.menuIconContainerHighlight
                  ]}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={24}
                      color={(item as any).highlight ? colors.white : colors.primary}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[
                      styles.menuTitle,
                      (item as any).highlight && styles.menuTitleHighlight
                    ]}>{item.title}</Text>
                    <Text style={[
                      styles.menuSubtitle,
                      (item as any).highlight && styles.menuSubtitleHighlight
                    ]}>{item.subtitle}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={(item as any).highlight ? colors.white : colors.textLight}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            {/* App Version */}
            <Text style={styles.versionText}>InterLeague v1.0.0</Text>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* Modal de Editar Perfil (con tabs para perfil y contraseña) */}
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tabs para cambiar entre Perfil y Contraseña */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, editTab === 'profile' && styles.tabActive]}
                onPress={() => setEditTab('profile')}
              >
                <MaterialCommunityIcons
                  name="account-edit"
                  size={20}
                  color={editTab === 'profile' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.tabText, editTab === 'profile' && styles.tabTextActive]}>
                  Perfil
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, editTab === 'password' && styles.tabActive]}
                onPress={() => setEditTab('password')}
              >
                <MaterialCommunityIcons
                  name="lock-reset"
                  size={20}
                  color={editTab === 'password' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.tabText, editTab === 'password' && styles.tabTextActive]}>
                  Contraseña
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contenido según el tab seleccionado */}
            <View style={styles.formContainer}>
              {editTab === 'profile' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nombre</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Tu nombre"
                      value={editName}
                      onChangeText={setEditName}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="tu@email.com"
                      value={editEmail}
                      onChangeText={setEditEmail}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Contraseña Actual</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Tu contraseña actual"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nueva Contraseña</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Repite tu nueva contraseña"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
                    <Text style={styles.saveButtonText}>Cambiar Contraseña</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Configuración */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configuración</Text>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.configContainer}>
              <View style={styles.configItem}>
                <View style={styles.configItemLeft}>
                  <MaterialCommunityIcons name="bell-outline" size={24} color={colors.textPrimary} />
                  <View style={styles.configItemText}>
                    <Text style={styles.configItemTitle}>Notificaciones</Text>
                    <Text style={styles.configItemSubtitle}>Recibir alertas</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.switch, notificationsEnabled && styles.switchActive]}
                  onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  <View style={[styles.switchThumb, notificationsEnabled && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>

              <View style={styles.configItem}>
                <View style={styles.configItemLeft}>
                  <MaterialCommunityIcons name="theme-light-dark" size={24} color={colors.textPrimary} />
                  <View style={styles.configItemText}>
                    <Text style={styles.configItemTitle}>Modo Oscuro</Text>
                    <Text style={styles.configItemSubtitle}>
                      {mode === 'dark' ? 'Activado' : 'Desactivado'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.switch, mode === 'dark' && styles.switchActive]}
                  onPress={toggleTheme}
                >
                  <View style={[styles.switchThumb, mode === 'dark' && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>

              {/* Idioma → aquí el está el cambio */}
              <TouchableOpacity
                style={styles.configItem}
                onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
              >
                <View style={styles.configItemLeft}>
                  <MaterialCommunityIcons name="translate" size={24} color={colors.textPrimary} />
                  <View style={styles.configItemText}>
                    <Text style={styles.configItemTitle}>Idioma</Text>
                    <Text style={styles.configItemSubtitle}>Español</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Privacidad y Datos (Derechos ARCO) */}
              <TouchableOpacity
                style={styles.configItem}
                onPress={() => {
                  setShowConfigModal(false);
                  navigation.navigate('PrivacySettings');
                }}
              >
                <View style={styles.configItemLeft}>
                  <MaterialCommunityIcons name="shield-account" size={24} color={colors.primary} />
                  <View style={styles.configItemText}>
                    <Text style={styles.configItemTitle}>Privacidad y Datos</Text>
                    <Text style={styles.configItemSubtitle}>Gestiona tus datos personales</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.configItem}
                onPress={() => Linking.openURL('https://www.interleagueonline.com/politica-de-privacidad-isl/')}
              >
                <View style={styles.configItemLeft}>
                  <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.textPrimary} />
                  <View style={styles.configItemText}>
                    <Text style={styles.configItemTitle}>Política de Privacidad</Text>
                    <Text style={styles.configItemSubtitle}>Ver términos y condiciones</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
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
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
  },
  countryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  countryEmoji: {
    fontSize: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  menuSection: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.textLight,
  },
  menuItemHighlight: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  menuIconContainerHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuTitleHighlight: {
    color: colors.white,
  },
  menuSubtitleHighlight: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textLight,
    marginTop: 24,
  },
  // Estilos del modal de suplantación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  usuariosList: {
    maxHeight: 400,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 20,
  },
  usuarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  usuarioAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  usuarioAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  usuarioInfo: {
    flex: 1,
  },
  usuarioEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  usuarioRol: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Estilos para modales de edición
  formContainer: {
    padding: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  // Tabs para modal de edición
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  // Estilos para modal de configuración
  configContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  configItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  configItemText: {
    flex: 1,
  },
  configItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  configItemSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  // Estilos para vista de invitado
  guestContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  guestCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  guestIconContainer: {
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  guestSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  guestBenefits: {
    width: '100%',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  guestLoginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  guestLoginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  guestRegisterButton: {
    backgroundColor: colors.backgroundGray,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestRegisterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});