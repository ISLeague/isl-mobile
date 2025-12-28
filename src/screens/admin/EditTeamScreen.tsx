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
import { Equipo } from '../../api/types';

interface EditTeamScreenProps {
  navigation: any;
  route: any;
}

export const EditTeamScreen: React.FC<EditTeamScreenProps> = ({ navigation, route }) => {
  const { equipo } = route.params as { equipo: Equipo };
  
  const [nombre, setNombre] = useState(equipo.nombre);
  const [logo, setLogo] = useState(equipo.logo || '');
  const [jugadores, setJugadores] = useState<any[]>([]);

  const handleUpdate = () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del equipo es requerido');
      return;
    }

    const equipoData = {
      ...equipo,
      nombre: nombre.trim(),
      logo: logo.trim() || undefined,
    };

    console.log('Actualizar equipo:', equipoData);
    
    // TODO: Llamar a la API para actualizar el equipo
    // await api.teams.updateTeam(equipo.id_equipo, equipoData);
    
    Alert.alert('Éxito', `Equipo "${nombre}" actualizado exitosamente`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar el equipo "${equipo.nombre}"? Esta acción no se puede deshacer y eliminará todos los datos asociados (jugadores, estadísticas, etc.)`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            console.log('Eliminar equipo:', equipo.id_equipo);
            // TODO: Llamar a la API para eliminar el equipo
            // await api.teams.deleteTeam(equipo.id_equipo);
            Alert.alert('Éxito', 'Equipo eliminado exitosamente', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
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
          <Text style={styles.title}>Editar Equipo</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre del Equipo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Equipo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: FC Barcelona Lima"
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Logo del Equipo con Image Picker */}
          <ImagePickerInput
            label="Logo del Equipo"
            value={logo}
            onChangeImage={setLogo}
            onChangeUrl={setLogo}
            placeholder="https://ejemplo.com/logo.png"
            helpText="Puedes seleccionar una imagen de tu dispositivo o ingresar una URL"
          />

          {/* Gestión de Jugadores */}
          <View style={styles.playersSection}>
            <Text style={styles.label}>Plantilla de Jugadores</Text>
            <Text style={styles.helpText}>
              Agrega jugadores individualmente o importa desde un archivo CSV
            </Text>
            <ImagePickerInput
              label=""
              value=""
              onChangeImage={() => {}}
              onChangeUrl={() => {}}
              allowPlayerManagement={true}
              onJugadoresChanged={setJugadores}
              initialJugadores={jugadores}
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Puedes actualizar el nombre, el logo y la plantilla del equipo. Los cambios se reflejarán
              en toda la aplicación.
            </Text>
          </View>

          {/* Botón Eliminar */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Zona de Peligro</Text>
            <Text style={styles.dangerText}>
              Eliminar este equipo removerá todos los jugadores, estadísticas y datos asociados.
              Esta acción no se puede deshacer.
            </Text>
            <Button
              title="Eliminar Equipo"
              onPress={handleDelete}
              variant="outline"
              style={styles.deleteButton}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón Guardar */}
      <View style={styles.footer}>
        <Button
          title="Guardar Cambios"
          onPress={handleUpdate}
          style={styles.saveButton}
        />
      </View>
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
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  form: {
    padding: 20,
  },
  logoPreviewContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundGray,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  playersSection: {
    marginTop: 24,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    lineHeight: 18,
  },
  dangerZone: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.success,
  },
});
