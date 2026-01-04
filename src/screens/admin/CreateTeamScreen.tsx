import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';
import { ImagePickerInput } from '../../components/common';

interface CreateTeamScreenProps {
  navigation: any;
  route: any;
}

export const CreateTeamScreen: React.FC<CreateTeamScreenProps> = ({
  navigation,
  route,
}) => {
  const { idEdicionCategoria, onTeamCreated } = route.params;

  const [nombre, setNombre] = useState('');
  const [nombreCorto, setNombreCorto] = useState('');
  const [logo, setLogo] = useState('');

  const [nombreDelegado, setNombreDelegado] = useState('');
  const [telefonoDelegado, setTelefonoDelegado] = useState('');
  const [emailDelegado, setEmailDelegado] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del equipo es obligatorio');
      return;
    }

    try {
      setIsSaving(true);

      const teamData = {
        nombre: nombre.trim(),
        nombre_corto: nombreCorto.trim() || undefined,
        logo: logo.trim() || undefined,

        nombre_delegado: nombreDelegado.trim() || undefined,
        telefono_delegado: telefonoDelegado.trim() || undefined,
        email_delegado: emailDelegado.trim() || undefined,
        id_edicion_categoria: idEdicionCategoria,
      };

      const response = await api.equipos.create(teamData);
      const newTeamId = response.data.id_equipo;

      // Si hay un logo local (URI de dispositivo), subirlo
      if (logo && (logo.startsWith('file://') || logo.startsWith('content://'))) {
        try {
          // Necesitamos convertir la URI a un objeto que apiClient/axios pueda manejar como multipart
          const logoFile = {
            uri: logo,
            type: 'image/jpeg', // Opcional, el backend lo valida
            name: `logo_${newTeamId}.jpg`,
          };
          await api.equipos.uploadLogo(newTeamId, logoFile);
        } catch (uploadError) {
          // console.error('Error uploading team logo:', uploadError);
          // No bloqueamos el éxito de la creación si falla el logo
          Alert.alert('Aviso', 'El equipo se creó pero no se pudo subir el logo.');
        }
      }

      Alert.alert('Éxito', 'Equipo creado correctamente', [
        {
          text: 'OK',
          onPress: () => {
            onTeamCreated?.();
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      // console.error('Error creating team:', error);
      const errorMessage =
        error?.response?.data?.message || 'No se pudo crear el equipo';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Equipo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoBannerText}>
            Los campos marcados con * son obligatorios
          </Text>
        </View>

        {/* Información Básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Nombre del Equipo <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Athletic Club"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre Corto</Text>
            <TextInput
              style={styles.input}
              value={nombreCorto}
              onChangeText={setNombreCorto}
              placeholder="Ej: Athletic"
              placeholderTextColor={colors.textSecondary}
              maxLength={20}
            />
            <Text style={styles.hint}>
              Usado para mostrar en tablas y resultados
            </Text>
          </View>

          <ImagePickerInput
            label="Logo del Equipo"
            value={logo}
            onChangeImage={setLogo}
            onChangeUrl={setLogo}
            helpText="Selecciona un escudo para el equipo"
          />
        </View>

        {/* Información del Delegado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Delegado</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del Delegado</Text>
            <TextInput
              style={styles.input}
              value={nombreDelegado}
              onChangeText={setNombreDelegado}
              placeholder="Ej: Pedro Sánchez"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={telefonoDelegado}
              onChangeText={setTelefonoDelegado}
              placeholder="+34 944 556 677"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={emailDelegado}
              onChangeText={setEmailDelegado}
              placeholder="delegado@equipo.com"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Crear Equipo</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default CreateTeamScreen;
