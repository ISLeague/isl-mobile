import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';

export const SendNotificationsScreen = ({ navigation, route }: any) => {
  const { torneo } = route.params;
  const { showSuccess, showError, showWarning } = useToast();
  
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState<'info' | 'importante' | 'urgente'>('info');

  const tiposNotificacion = [
    { id: 'info', label: 'Información', color: colors.info, icon: 'information-circle' },
    { id: 'importante', label: 'Importante', color: colors.warning, icon: 'alert-circle' },
    { id: 'urgente', label: 'Urgente', color: colors.error, icon: 'alert' },
  ];

  const handleSendNotification = () => {
    if (!titulo.trim() || !mensaje.trim()) {
      showWarning('Por favor completa todos los campos');
      return;
    }

    Alert.alert(
      'Confirmar Envío',
      `¿Enviar notificación "${titulo}" a todos los usuarios del torneo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              // TODO: Llamar API para enviar notificación
              // await mockApi.notifications.send({
              //   id_torneo: torneo.id_torneo,
              //   titulo,
              //   mensaje,
              //   tipo,
              // });
              
              console.log('Notificación enviada:', { titulo, mensaje, tipo });
              showSuccess('Notificación enviada correctamente');
              
              // Limpiar formulario
              setTitulo('');
              setMensaje('');
              setTipo('info');
              
              // Volver atrás
              navigation.goBack();
            } catch (error) {
              console.error('Error al enviar notificación:', error);
              showError('Error al enviar la notificación');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <LinearGradient
        colors={['#BE0127', '#681E14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Enviar Notificación</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info del torneo */}
        <View style={styles.torneoCard}>
          <MaterialCommunityIcons name="trophy" size={24} color={colors.primary} />
          <View style={styles.torneoInfo}>
            <Text style={styles.torneoNombre}>{torneo.nombre}</Text>
            <Text style={styles.torneoSubtitle}>Notificación para todos los usuarios</Text>
          </View>
        </View>

        {/* Tipo de notificación */}
        <Text style={styles.sectionLabel}>Tipo de Notificación</Text>
        <View style={styles.tiposContainer}>
          {tiposNotificacion.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tipoButton,
                tipo === t.id && { backgroundColor: t.color, borderColor: t.color },
              ]}
              onPress={() => setTipo(t.id as any)}
            >
              <Ionicons 
                name={t.icon as any} 
                size={20} 
                color={tipo === t.id ? colors.white : t.color} 
              />
              <Text style={[
                styles.tipoLabel,
                tipo === t.id && styles.tipoLabelActive,
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Título */}
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Nueva fecha confirmada"
          value={titulo}
          onChangeText={setTitulo}
          placeholderTextColor={colors.textLight}
          maxLength={50}
        />
        <Text style={styles.charCount}>{titulo.length}/50</Text>

        {/* Mensaje */}
        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escribe el mensaje de la notificación..."
          value={mensaje}
          onChangeText={setMensaje}
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={200}
        />
        <Text style={styles.charCount}>{mensaje.length}/200</Text>

        {/* Vista previa */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Vista Previa</Text>
          <View style={[
            styles.previewCard,
            { borderLeftColor: tiposNotificacion.find(t => t.id === tipo)?.color }
          ]}>
            <View style={styles.previewHeader}>
              <Ionicons 
                name={tiposNotificacion.find(t => t.id === tipo)?.icon as any} 
                size={20} 
                color={tiposNotificacion.find(t => t.id === tipo)?.color} 
              />
              <Text style={styles.previewTitulo}>{titulo || 'Título de la notificación'}</Text>
            </View>
            <Text style={styles.previewMensaje}>
              {mensaje || 'El mensaje de la notificación aparecerá aquí...'}
            </Text>
            <Text style={styles.previewFecha}>Hace unos momentos • {torneo.nombre}</Text>
          </View>
        </View>

        {/* Botón enviar */}
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!titulo.trim() || !mensaje.trim()) && styles.sendButtonDisabled
          ]}
          onPress={handleSendNotification}
          disabled={!titulo.trim() || !mensaje.trim()}
        >
          <MaterialCommunityIcons name="send" size={20} color={colors.white} />
          <Text style={styles.sendButtonText}>Enviar Notificación</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  torneoCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  torneoInfo: {
    flex: 1,
  },
  torneoNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  torneoSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tiposContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tipoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tipoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tipoLabelActive: {
    color: colors.white,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  previewSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  previewMensaje: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  previewFecha: {
    fontSize: 12,
    color: colors.textLight,
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
