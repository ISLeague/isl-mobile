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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button, ImagePickerInput, DatePickerInput } from '../../components/common';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import { TipoSponsor } from '../../api/types/sponsors.types';

export const EditSponsorScreen = ({ navigation, route }: any) => {
  const { sponsor } = route.params;
  const { showSuccess, showError } = useToast();

  const [nombre, setNombre] = useState(sponsor.nombre);
  const [logo, setLogo] = useState(sponsor.logo);
  const [link, setLink] = useState(sponsor.link || '');
  const [tipo, setTipo] = useState<TipoSponsor>(sponsor.tipo || 'oficial');
  const [descripcion, setDescripcion] = useState(sponsor.descripcion || '');
  const [orden, setOrden] = useState(String(sponsor.orden || '1'));
  const [loading, setLoading] = useState(false);

  const handleUpdate = () => {
    if (!nombre.trim()) {
      showError('El nombre del sponsor es obligatorio');
      return;
    }

    if (!logo.trim()) {
      showError('El logo del sponsor es obligatorio');
      return;
    }

    Alert.alert(
      'Confirmar Cambios',
      `¿Deseas actualizar el sponsor "${sponsor.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: async () => {
            setLoading(true);
            try {
              await api.sponsors.update(sponsor.id_sponsor, {
                id_sponsor: sponsor.id_sponsor,
                nombre,
                logo,
                link,
                tipo,
                descripcion,
                orden: parseInt(orden) || 1,
              });
              showSuccess('Sponsor actualizado exitosamente');
              navigation.goBack();
            } catch (error) {
              // console.error('Error updating sponsor:', error);
              showError('Error al actualizar el sponsor');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Sponsor',
      `¿Estás seguro de eliminar el sponsor "${sponsor.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.sponsors.delete(sponsor.id_sponsor);
              showSuccess('Sponsor eliminado exitosamente');
              navigation.goBack();
            } catch (error) {
              // console.error('Error deleting sponsor:', error);
              showError('Error al eliminar el sponsor');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar Sponsor</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre del Sponsor */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Sponsor *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Coca-Cola, Nike, etc."
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Logo del Sponsor con Image Picker */}
          <ImagePickerInput
            label="Logo del Sponsor"
            value={logo}
            onChangeImage={setLogo}
            onChangeUrl={setLogo}
            required
            helpText="Selecciona una imagen de tu dispositivo o ingresa una URL"
          />

          {/* Link del Sponsor */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sitio Web</Text>
            <TextInput
              style={styles.input}
              placeholder="https://ejemplo.com"
              value={link}
              onChangeText={setLink}
              placeholderTextColor={colors.textLight}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Tipo de Sponsor */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Sponsor *</Text>
            <View style={styles.tipoContainer}>
              {(['principal', 'oficial', 'colaborador'] as TipoSponsor[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tipoButton,
                    tipo === t && styles.tipoButtonSelected
                  ]}
                  onPress={() => setTipo(t)}
                >
                  <Text style={[
                    styles.tipoButtonText,
                    tipo === t && styles.tipoButtonTextSelected
                  ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Breve descripción del sponsor..."
              value={descripcion}
              onChangeText={setDescripcion}
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Orden */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Orden de Visualización</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={orden}
              onChangeText={setOrden}
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>
              Número para ordenar los sponsors (menor número aparece primero)
            </Text>
          </View>


          {/* Botones */}
          <View style={styles.buttonContainer}>
            <Button
              title="Actualizar Sponsor"
              onPress={handleUpdate}
              loading={loading}
            />
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
            <Text style={styles.deleteButtonText}>Eliminar Sponsor</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  tipoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tipoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  tipoButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tipoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tipoButtonTextSelected: {
    color: colors.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
