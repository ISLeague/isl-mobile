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
import { Button, ImagePickerInput } from '../../components/common';

interface CreateSponsorScreenProps {
  navigation: any;
  route: any;
}

export const CreateSponsorScreen: React.FC<CreateSponsorScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria } = route.params || {};
  
  const [nombre, setNombre] = useState('');
  const [logo, setLogo] = useState('');
  const [link, setLink] = useState('');

  const handleCreate = () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del sponsor es requerido');
      return;
    }

    if (!logo.trim()) {
      Alert.alert('Error', 'El logo del sponsor es requerido');
      return;
    }

    const sponsorData = {
      nombre,
      logo,
      link: link || undefined,
      id_edicion_categoria: idEdicionCategoria,
    };

    console.log('Crear sponsor:', sponsorData);
    
    // TODO: Llamar a la API para crear el sponsor
    // await api.sponsors.createSponsor(sponsorData);
    
    Alert.alert('Éxito', `Sponsor "${nombre}" creado exitosamente.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
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
          <Text style={styles.title}>Crear Sponsor</Text>
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

          {/* Link del Sponsor (Opcional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sitio Web (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://ejemplo.com"
              value={link}
              onChangeText={setLink}
              placeholderTextColor={colors.textLight}
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.helpText}>
              Sitio web o landing page del sponsor
            </Text>
          </View>

          {/* Vista previa del logo */}
          {logo.trim() && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Vista Previa:</Text>
              <View style={styles.logoPreview}>
                <MaterialCommunityIcons name="image" size={48} color={colors.textLight} />
                <Text style={styles.previewUrl} numberOfLines={2}>{logo}</Text>
              </View>
            </View>
          )}

          {/* Botón de crear */}
          <View style={styles.buttonContainer}>
            <Button
              title="Crear Sponsor"
              onPress={handleCreate}
            />
          </View>
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
  previewContainer: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  logoPreview: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewUrl: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 16,
  },
});
