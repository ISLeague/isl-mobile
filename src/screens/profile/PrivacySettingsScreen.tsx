import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientHeader, Card } from '../../components/common';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface PrivacySettingsScreenProps {
  navigation: any;
}

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ navigation }) => {
  const { usuario, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const getUserData = () => {
    // Preparar datos del usuario sin información sensible (sin contraseña)
    if (!usuario) return null;

    return {
      datos_personales: {
        email: usuario.email,
        rol: usuario.rol,
        id_usuario: usuario.id_usuario,
      },
      datos_ubicacion: {
        pais: usuario.pais?.nombre || 'No especificado',
        emoji_pais: usuario.pais?.emoji || '',
      },
      informacion_sistema: {
        fecha_consulta: new Date().toLocaleDateString('es-ES'),
        hora_consulta: new Date().toLocaleTimeString('es-ES'),
      },
      nota_privacidad: 'Tus datos personales son tratados conforme a las leyes de protección de datos vigentes. No compartimos tu información con terceros sin tu consentimiento.',
    };
  };

  const handleViewMyData = () => {
    const userData = getUserData();
    if (!userData) return;

    Alert.alert(
      '📋 Mis Datos Personales',
      `Email: ${userData.datos_personales.email}\n\nRol: ${userData.datos_personales.rol}\n\nPaís: ${userData.datos_ubicacion.pais}\n\nID de Usuario: ${userData.datos_personales.id_usuario}\n\n${userData.nota_privacidad}`,
      [{ text: 'Cerrar', style: 'default' }]
    );
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const userData = getUserData();
      if (!userData) {
        showError('No se pudieron obtener tus datos', 'Error');
        return;
      }

      const jsonData = JSON.stringify(userData, null, 2);
      const fileName = `mis_datos_${usuario?.id_usuario}_${Date.now()}.json`;

      // En una app real, aquí se guardaría el archivo o se enviaría por email
      // Por ahora, mostramos opciones para compartir
      await Share.share({
        message: `Mis datos de Inter Soccer League:\n\n${jsonData}`,
        title: 'Exportar mis datos',
      });

      showSuccess('Datos preparados para exportar', 'Exportación');
    } catch (error) {
      console.error('Error al exportar datos:', error);
      showError('No se pudieron exportar los datos', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Eliminar Cuenta',
      'Esta acción es permanente y no se puede deshacer.\n\n¿Estás completamente seguro de que deseas eliminar tu cuenta?\n\nSe eliminarán:\n• Tu información personal\n• Tu historial\n• Todas tus preferencias',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Confirmación Final',
      `Por favor, confirma que deseas eliminar la cuenta: ${usuario?.email}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar mi cuenta',
          style: 'destructive',
          onPress: executeDeleteAccount,
        },
      ]
    );
  };

  const executeDeleteAccount = async () => {
    try {
      setLoading(true);
      
      // TODO: Llamar a la API para eliminar la cuenta
      // await mockAuthApi.deleteAccount(usuario.id_usuario);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Cuenta Eliminada',
        'Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir.',
        [
          {
            text: 'Entendido',
            onPress: () => {
              logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      showError('No se pudo eliminar la cuenta. Intenta más tarde.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDataPortability = () => {
    Alert.alert(
      'Portabilidad de Datos',
      'Puedes solicitar una copia de todos tus datos en formato estructurado (JSON o CSV).\n\nEsta función está disponible para exportar tus datos a otros servicios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Exportar Ahora', onPress: handleExportData },
      ]
    );
  };

  const handleDataCorrection = () => {
    Alert.alert(
      'Rectificación de Datos',
      'Si encuentras datos incorrectos en tu perfil, puedes actualizarlos desde la sección "Editar Perfil".\n\n¿Deseas ir ahora?',
      [
        { text: 'Más Tarde', style: 'cancel' },
        { text: 'Ir a Editar Perfil', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Privacidad y Datos"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sección: Acceso a Datos */}
        <View style={[styles.section, styles.firstSection]}>
          <Text style={styles.sectionTitle}>Acceso a tus Datos</Text>
          
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleViewMyData}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons name="eye" size={24} color={colors.info} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Ver mis datos</Text>
              <Text style={styles.optionDescription}>
                Consulta qué información personal guardamos sobre ti
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleDataPortability}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons name="download" size={24} color={colors.success} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Exportar mis datos</Text>
              <Text style={styles.optionDescription}>
                Descarga una copia de tu información en formato JSON
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sección: Rectificación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rectificación de Datos</Text>
          
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleDataCorrection}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons name="pencil" size={24} color={colors.warning} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Corregir mis datos</Text>
              <Text style={styles.optionDescription}>
                Actualiza información incorrecta o desactualizada
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sección: Cancelación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancelación de Cuenta</Text>
          
          <TouchableOpacity
            style={[styles.optionCard, styles.dangerCard]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View style={[styles.optionIcon, styles.dangerIcon]}>
              <MaterialCommunityIcons name="delete-forever" size={24} color={colors.error} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, styles.dangerText]}>Eliminar mi cuenta</Text>
              <Text style={styles.optionDescription}>
                Elimina permanentemente tu cuenta y todos tus datos
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Información Legal */}
        <Card style={styles.legalCard}>
          <Text style={styles.legalTitle}>Protección de Datos</Text>
          <Text style={styles.legalText}>
            • Tus datos son tratados conforme a las leyes de protección de datos vigentes{'\n'}
            • No compartimos tu información con terceros sin tu consentimiento{'\n'}
            • Puedes ejercer tus derechos en cualquier momento{'\n'}
            • Para consultas sobre privacidad, contáctanos a: bdiaz@intercollegecorp.com
          </Text>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Última actualización: 18 de noviembre de 2025
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  firstSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  dangerCard: {
    borderColor: `${colors.error}30`,
    backgroundColor: `${colors.error}05`,
  },
  dangerIcon: {
    backgroundColor: `${colors.error}15`,
  },
  dangerText: {
    color: colors.error,
  },
  legalCard: {
    margin: 16,
    padding: 16,
  },
  legalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  legalText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});
