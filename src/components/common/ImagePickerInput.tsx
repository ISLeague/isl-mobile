import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';

interface Jugador {
  nombre: string;
  dni: string;
  numero: number;
  fecha_nacimiento?: string;
}

interface ImagePickerInputProps {
  label: string;
  value: string;
  onChangeImage: (uri: string) => void;
  onChangeUrl: (url: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  // Nuevas props para gestión de jugadores
  allowPlayerManagement?: boolean;
  onJugadoresChanged?: (jugadores: Jugador[]) => void;
  initialJugadores?: Jugador[];
}

export const ImagePickerInput: React.FC<ImagePickerInputProps> = ({
  label,
  value,
  onChangeImage,
  onChangeUrl,
  placeholder = 'https://ejemplo.com/imagen.png',
  required = false,
  helpText,
  allowPlayerManagement = false,
  onJugadoresChanged,
  initialJugadores = [],
}) => {
  const [inputType, setInputType] = React.useState<'device' | 'url'>('url');
  const [jugadores, setJugadores] = React.useState<Jugador[]>(initialJugadores);
  const [showAddPlayerModal, setShowAddPlayerModal] = React.useState(false);
  const [newPlayer, setNewPlayer] = React.useState<Jugador>({
    nombre: '',
    dni: '',
    numero: 0,
    fecha_nacimiento: '',
  });

  // Determinar si el valor actual es una URL o una URI local
  React.useEffect(() => {
    if (value) {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        setInputType('url');
      } else if (value.startsWith('file://') || value.startsWith('content://')) {
        setInputType('device');
      }
    }
  }, [value]);

  const pickImageFromGallery = async () => {
    try {
      // Solicitar permisos
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu galería para seleccionar una imagen.'
        );
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setInputType('device');
        onChangeImage(imageUri);
      }
    } catch (error) {
      // console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      // Solicitar permisos de cámara
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu cámara para tomar una foto.'
        );
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setInputType('device');
        onChangeImage(imageUri);
      }
    } catch (error) {
      // console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };


  const isValidUrl = (str: string) => {
    return str.startsWith('http://') || str.startsWith('https://');
  };

  const isLocalUri = (str: string) => {
    return str.startsWith('file://') || str.startsWith('content://');
  };

  const handleAddJugador = () => {
    if (!newPlayer.nombre.trim() || !newPlayer.dni.trim() || newPlayer.numero <= 0) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    const updatedJugadores = [...jugadores, newPlayer];
    setJugadores(updatedJugadores);
    if (onJugadoresChanged) {
      onJugadoresChanged(updatedJugadores);
    }
    setNewPlayer({ nombre: '', dni: '', numero: 0, fecha_nacimiento: '' });
    setShowAddPlayerModal(false);
  };

  const handleRemoveJugador = (index: number) => {
    Alert.alert(
      'Eliminar Jugador',
      `¿Estás seguro de eliminar a ${jugadores[index].nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedJugadores = jugadores.filter((_, i) => i !== index);
            setJugadores(updatedJugadores);
            if (onJugadoresChanged) {
              onJugadoresChanged(updatedJugadores);
            }
          },
        },
      ]
    );
  };

  const handleImportCSV = () => {
    // Mostrar instrucciones para importar CSV
    Alert.alert(
      'Importar desde CSV',
      'El archivo CSV debe tener el siguiente formato:\nNombre,DNI,Número,Fecha de Nacimiento\n\nEjemplo:\nJuan Pérez,12345678,10,1990-01-15\nMaría García,87654321,7,1992-05-20',
      [
        { text: 'Entendido', style: 'default' },
        {
          text: 'Importar Manualmente',
          onPress: () => {
            // Por ahora mostramos el modal para agregar manualmente
            // En el futuro se puede integrar expo-document-picker
            Alert.prompt(
              'Datos CSV',
              'Pega los datos del CSV (formato: Nombre,DNI,Número,Fecha)',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Importar',
                  onPress: (csvData?: string) => {
                    if (csvData) {
                      try {
                        const lines = csvData.split('\n');
                        const importedPlayers: Jugador[] = [];

                        lines.forEach(line => {
                          const [nombre, dni, numero, fecha] = line.split(',').map(s => s.trim());
                          if (nombre && dni && numero) {
                            importedPlayers.push({
                              nombre,
                              dni,
                              numero: parseInt(numero),
                              fecha_nacimiento: fecha || undefined,
                            });
                          }
                        });

                        const updatedJugadores = [...jugadores, ...importedPlayers];
                        setJugadores(updatedJugadores);
                        if (onJugadoresChanged) {
                          onJugadoresChanged(updatedJugadores);
                        }
                        Alert.alert('Éxito', `${importedPlayers.length} jugadores importados`);
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo procesar el CSV. Verifica el formato.');
                      }
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>

      {/* Vista previa de la imagen */}
      {value && (isValidUrl(value) || isLocalUri(value)) && (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: value }}
            style={styles.preview}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => {
              onChangeUrl('');
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Selector de tipo de entrada */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, inputType === 'device' && styles.activeTab]}
          onPress={() => setInputType('device')}
        >
          <MaterialCommunityIcons
            name="upload"
            size={20}
            color={inputType === 'device' ? colors.white : colors.primary}
          />
          <Text style={[styles.tabText, inputType === 'device' && styles.activeTabText]}>
            Subir Imagen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, inputType === 'url' && styles.activeTab]}
          onPress={() => setInputType('url')}
        >
          <MaterialCommunityIcons
            name="link-variant"
            size={20}
            color={inputType === 'url' ? colors.white : colors.primary}
          />
          <Text style={[styles.tabText, inputType === 'url' && styles.activeTabText]}>
            Ingresar URL
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inputs según el tipo seleccionado */}
      {inputType === 'device' ? (
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickImageFromGallery}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="image-multiple" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>Galería</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={takePhoto}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="camera" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>Cámara</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder={placeholder}
            value={isLocalUri(value) ? '' : value}
            onChangeText={onChangeUrl}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      )}

      {/* Texto de ayuda */}
      {helpText && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}

      {/* Gestión de jugadores */}
      {allowPlayerManagement && (
        <View style={styles.playersSection}>
          <View style={styles.playersSectionHeader}>
            <Text style={styles.playersSectionTitle}>
              Jugadores ({jugadores.length})
            </Text>
            <View style={styles.playerActions}>
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportCSV}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="file-upload" size={20} color={colors.info} />
                <Text style={styles.importButtonText}>Importar CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addPlayerButton}
                onPress={() => setShowAddPlayerModal(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
                <Text style={styles.addPlayerButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {jugadores.length > 0 ? (
            <ScrollView style={styles.playersList} nestedScrollEnabled>
              {jugadores.map((jugador, index) => (
                <View key={index} style={styles.playerItem}>
                  <View style={styles.playerNumber}>
                    <Text style={styles.playerNumberText}>{jugador.numero}</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{jugador.nombre}</Text>
                    <Text style={styles.playerDni}>DNI: {jugador.dni}</Text>
                    {jugador.fecha_nacimiento && (
                      <Text style={styles.playerDate}>
                        Nac: {jugador.fecha_nacimiento}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveJugador(index)}
                    style={styles.removePlayerButton}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPlayers}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyPlayersText}>
                No hay jugadores agregados
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modal para agregar jugador */}
      {showAddPlayerModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Jugador</Text>
              <TouchableOpacity onPress={() => setShowAddPlayerModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre completo *"
              value={newPlayer.nombre}
              onChangeText={(text) => setNewPlayer({ ...newPlayer, nombre: text })}
              placeholderTextColor={colors.textLight}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="DNI *"
              value={newPlayer.dni}
              onChangeText={(text) => setNewPlayer({ ...newPlayer, dni: text })}
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Número de camiseta *"
              value={newPlayer.numero > 0 ? newPlayer.numero.toString() : ''}
              onChangeText={(text) => setNewPlayer({ ...newPlayer, numero: parseInt(text) || 0 })}
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Fecha de nacimiento (YYYY-MM-DD)"
              value={newPlayer.fecha_nacimiento}
              onChangeText={(text) => setNewPlayer({ ...newPlayer, fecha_nacimiento: text })}
              placeholderTextColor={colors.textLight}
            />

            <TouchableOpacity style={styles.modalSaveButton} onPress={handleAddJugador}>
              <Text style={styles.modalSaveButtonText}>Agregar Jugador</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  previewContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
    backgroundColor: colors.backgroundGray,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.backgroundGray,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    gap: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  activeTabText: {
    color: colors.white,
  },
  uploadContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  urlInputContainer: {
    width: '100%',
  },
  urlInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  playersSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  playersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playersSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  playerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.info,
    backgroundColor: colors.white,
    gap: 4,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info,
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    gap: 4,
  },
  addPlayerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  playersList: {
    maxHeight: 300,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  playerDni: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  playerDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removePlayerButton: {
    padding: 4,
  },
  emptyPlayers: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPlayersText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: -100,
    left: -20,
    right: -20,
    bottom: -100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalInput: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
