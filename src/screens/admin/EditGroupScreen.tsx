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
import { Button } from '../../components/common';
import { Grupo } from '../../types';

interface EditGroupScreenProps {
  navigation: any;
  route: any;
}

export const EditGroupScreen: React.FC<EditGroupScreenProps> = ({ navigation, route }) => {
  const { grupo } = route.params as { grupo: Grupo };
  
  const [nombre, setNombre] = useState(grupo.nombre);
  const [equiposPasanOro, setEquiposPasanOro] = useState(grupo.equipos_pasan_oro?.toString() || '2');
  const [equiposPasanPlata, setEquiposPasanPlata] = useState(grupo.equipos_pasan_plata?.toString() || '0');
  const [tipoClasificacion, setTipoClasificacion] = useState<string>(grupo.tipo_clasificacion || 'pasa_copa_general');

  const tiposClasificacion = [
    { value: 'pasa_copa_general', label: 'Copa General', icon: '🏆' },
    { value: 'pasa_copa_oro', label: 'Copa de Oro', icon: '🥇' },
    { value: 'pasa_copa_plata', label: 'Copa de Plata', icon: '🥈' },
    { value: 'pasa_copa_bronce', label: 'Copa de Bronce', icon: '🥉' },
  ];

  const handleUpdate = () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del grupo es requerido');
      return;
    }

    const oro = parseInt(equiposPasanOro) || 0;
    const plata = parseInt(equiposPasanPlata) || 0;

    if (oro < 0 || plata < 0) {
      Alert.alert('Error', 'Los valores deben ser mayores o iguales a 0');
      return;
    }

    const grupoData = {
      ...grupo,
      nombre,
      tipo_clasificacion: tipoClasificacion,
      equipos_pasan_oro: oro,
      equipos_pasan_plata: plata,
    };

    console.log('Actualizar grupo:', grupoData);
    
    // TODO: Llamar a la API para actualizar el grupo
    // await api.groups.updateGroup(grupo.id_grupo, grupoData);
    
    Alert.alert('Éxito', `Grupo "${nombre}" actualizado exitosamente`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar el grupo "${grupo.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            console.log('Eliminar grupo:', grupo.id_grupo);
            // TODO: Llamar a la API para eliminar el grupo
            // await api.groups.deleteGroup(grupo.id_grupo);
            Alert.alert('Éxito', 'Grupo eliminado exitosamente', [
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
          <Text style={styles.title}>Editar Grupo</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre del Grupo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Grupo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Grupo A"
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={colors.textLight}
            />
          </View>


          {/* Equipos que pasan a Oro */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Equipos que clasifican a Copa de Oro</Text>
            <View style={styles.numberInput}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const num = parseInt(equiposPasanOro) || 0;
                  if (num > 0) setEquiposPasanOro((num - 1).toString());
                }}
              >
                <MaterialCommunityIcons name="minus" size={20} color={colors.white} />
              </TouchableOpacity>
              <TextInput
                style={styles.numberInputText}
                value={equiposPasanOro}
                onChangeText={setEquiposPasanOro}
                keyboardType="number-pad"
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const num = parseInt(equiposPasanOro) || 0;
                  setEquiposPasanOro((num + 1).toString());
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Los primeros {equiposPasanOro} equipos clasificarán a Copa de Oro
            </Text>
          </View>

          {/* Equipos que pasan a Plata */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Equipos que clasifican a Copa de Plata</Text>
            <View style={styles.numberInput}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const num = parseInt(equiposPasanPlata) || 0;
                  if (num > 0) setEquiposPasanPlata((num - 1).toString());
                }}
              >
                <MaterialCommunityIcons name="minus" size={20} color={colors.white} />
              </TouchableOpacity>
              <TextInput
                style={styles.numberInputText}
                value={equiposPasanPlata}
                onChangeText={setEquiposPasanPlata}
                keyboardType="number-pad"
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const num = parseInt(equiposPasanPlata) || 0;
                  setEquiposPasanPlata((num + 1).toString());
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Los siguientes {equiposPasanPlata} equipos clasificarán a Copa de Plata
            </Text>
          </View>

          {/* Botón Eliminar */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Zona de Peligro</Text>
            <Text style={styles.dangerText}>
              Eliminar este grupo removerá todos los equipos asociados y sus estadísticas.
            </Text>
            <Button
              title="Eliminar Grupo"
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
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
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioOptionSelected: {
    borderColor: colors.success,
    backgroundColor: '#F0F9F0',
  },
  radioEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  radioLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  radioLabelSelected: {
    fontWeight: '700',
    color: colors.success,
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberInputText: {
    width: 80,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  dangerZone: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
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
    backgroundColor: colors.primary,
  },
});
