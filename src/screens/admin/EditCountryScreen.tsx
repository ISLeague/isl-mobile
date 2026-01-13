import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { GradientHeader, Input, Button } from '../../components/common';
import { colors } from '../../theme/colors';
import { Pais } from '../../api/types';
import api from '../../api';

interface EditCountryScreenProps {
  navigation: any;
  route: any;
}

export const EditCountryScreen: React.FC<EditCountryScreenProps> = ({ navigation, route }) => {
  const { pais, onUpdated } = route.params as { pais: Pais; onUpdated?: () => void };
  
  const [nombre, setNombre] = useState(pais.nombre);
  const [emoji, setEmoji] = useState(pais.emoji || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del país es obligatorio');
      return;
    }

    try {
      setLoading(true);
      await api.paises.update(pais.id_pais, {
        nombre: nombre.trim(),
        emoji: emoji.trim() || '🌍',
      });
      if (onUpdated) onUpdated();
      Alert.alert('Éxito', 'País actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el país');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar ${pais.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // TODO: Llamar a la API para eliminar el país
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Editar País"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Nombre del País</Text>
        <Input
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Argentina"
          style={styles.input}
        />

        <Text style={styles.label}>Emoji (Bandera)</Text>
        <Input
          value={emoji}
          onChangeText={setEmoji}
          placeholder="Ej: 🇦🇷"
          style={styles.input}
          maxLength={4}
        />

        <View style={styles.helpBox}>
          <Text style={styles.helpText}>
            💡 Puedes copiar el emoji de la bandera desde tu teclado o desde emojipedia.org
          </Text>
        </View>

        <Button
          title="Guardar Cambios"
          onPress={handleSave}
          variant="primary"
          style={styles.button}
          loading={loading}
        />

        <Button
          title="Eliminar País"
          onPress={handleDelete}
          variant="danger"
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    marginBottom: 12,
  },
  helpBox: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    marginBottom: 16,
  },
});
