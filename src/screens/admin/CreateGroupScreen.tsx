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

interface CreateGroupScreenProps {
  navigation: any;
  route: any;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ navigation, route }) => {
  const { idEdicionCategoria } = route.params || {};

  const [nombre, setNombre] = useState('');
  const [equiposPasanOro, setEquiposPasanOro] = useState('2');
  const [equiposPasanPlata, setEquiposPasanPlata] = useState('0');

  const handleCreate = () => {
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

    // Auto-generar reglas de clasificación basadas en los equipos que pasan
    let tipoClasificacion = 'pasa_copa_general';
    if (oro > 0 && plata === 0) {
      tipoClasificacion = 'pasa_copa_oro';
    } else if (oro === 0 && plata > 0) {
      tipoClasificacion = 'pasa_copa_plata';
    } else if (oro > 0 && plata > 0) {
      tipoClasificacion = 'pasa_copa_general';
    }

    const grupoData = {
      nombre,
      id_edicion_categoria: idEdicionCategoria,
      tipo_clasificacion: tipoClasificacion,
      equipos_pasan_oro: oro,
      equipos_pasan_plata: plata,
    };

    console.log('Crear grupo:', grupoData);
    console.log('Reglas de clasificación auto-generadas:', tipoClasificacion);

    // TODO: Llamar a la API para crear el grupo
    // await api.groups.createGroup(grupoData);

    // TODO: Auto-generar reglas de clasificación
    // const reglas = generarReglasClasificacion(oro, plata, tipoClasificacion);
    // await api.classification.createRules(reglas);

    Alert.alert('Éxito', `Grupo "${nombre}" creado exitosamente con reglas de clasificación auto-generadas`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const generarVistaReglasClasificacion = () => {
    const oro = parseInt(equiposPasanOro) || 0;
    const plata = parseInt(equiposPasanPlata) || 0;

    const reglas: Array<{ posiciones: string; destino: string; color: string; icon: string }> = [];

    if (oro > 0) {
      if (oro === 1) {
        reglas.push({
          posiciones: '1º',
          destino: 'Copa de Oro',
          color: '#FFD700',
          icon: '🥇',
        });
      } else {
        reglas.push({
          posiciones: `1º - ${oro}º`,
          destino: 'Copa de Oro',
          color: '#FFD700',
          icon: '🥇',
        });
      }
    }

    if (plata > 0) {
      const inicio = oro + 1;
      const fin = oro + plata;
      if (inicio === fin) {
        reglas.push({
          posiciones: `${inicio}º`,
          destino: 'Copa de Plata',
          color: '#C0C0C0',
          icon: '🥈',
        });
      } else {
        reglas.push({
          posiciones: `${inicio}º - ${fin}º`,
          destino: 'Copa de Plata',
          color: '#C0C0C0',
          icon: '🥈',
        });
      }
    }

    return reglas;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Grupo</Text>
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

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Una vez creado el grupo, podrás agregar equipos desde la vista de grupos.
              Asegúrate de que todos los grupos tengan la misma cantidad de equipos antes
              de generar el fixture.
            </Text>
          </View>

          {/* Preview de Reglas de Clasificación */}
          {generarVistaReglasClasificacion().length > 0 && (
            <View style={styles.previewSection}>
              <View style={styles.previewHeader}>
                <MaterialCommunityIcons name="eye" size={20} color={colors.primary} />
                <Text style={styles.previewTitle}>Vista Previa de Clasificación</Text>
              </View>
              <Text style={styles.previewSubtitle}>
                Reglas que se generarán automáticamente:
              </Text>
              {generarVistaReglasClasificacion().map((regla, index) => (
                <View key={index} style={styles.reglaPreviewCard}>
                  <View style={[styles.reglaColorDot, { backgroundColor: regla.color }]} />
                  <Text style={styles.reglaIcon}>{regla.icon}</Text>
                  <View style={styles.reglaInfo}>
                    <Text style={styles.reglaPosiciones}>{regla.posiciones} Posición</Text>
                    <Text style={styles.reglaDestino}>→ {regla.destino}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón Crear */}
      <View style={styles.footer}>
        <Button
          title="Crear Grupo"
          onPress={handleCreate}
          style={styles.createButton}
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    lineHeight: 18,
  },
  previewSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  previewSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  reglaPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  reglaColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  reglaIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reglaInfo: {
    flex: 1,
  },
  reglaPosiciones: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  reglaDestino: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.success,
  },
});
