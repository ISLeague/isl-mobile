import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../../theme/colors';
import { Pais } from '../../api/types';
import api from '../../api';

export const ManageCountriesScreen = ({ navigation }: any) => {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigoIso, setNuevoCodigoIso] = useState('');
  const [nuevoEmoji, setNuevoEmoji] = useState('');

  useEffect(() => {
    loadPaises();
  }, []);

  const loadPaises = async () => {
    try {
      setLoading(true);
      const paisesData = await api.paises.list();

      // Asegurarse de que paisesData es un array
      if (Array.isArray(paisesData)) {
        setPaises(paisesData);
      } else {
        // console.warn('La respuesta de países no es un array:', paisesData);
        setPaises([]);
      }
    } catch (error) {
      // console.error('Error cargando países:', error);
      setPaises([]);
      Alert.alert('Error', 'No se pudieron cargar los países. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePais = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Error', 'El nombre del país es requerido');
      return;
    }

    if (!nuevoCodigoIso.trim()) {
      Alert.alert('Error', 'El código ISO del país es requerido');
      return;
    }

    try {
      setLoading(true);

      // Crear país usando la API
      await api.paises.create({
        nombre: nuevoNombre.trim(),
        codigo_iso: nuevoCodigoIso.trim().toUpperCase(),
        emoji: nuevoEmoji.trim() || '🌍',
      });

      // Recargar la lista de países
      await loadPaises();

      setNuevoNombre('');
      setNuevoCodigoIso('');
      setNuevoEmoji('');
      setIsCreating(false);
      Alert.alert('¡Éxito!', `País "${nuevoNombre}" creado correctamente`);
    } catch (error) {
      // console.error('Error creando país:', error);
      Alert.alert('Error', 'No se pudo crear el país. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPais = (pais: Pais) => {
    navigation.navigate('EditCountry', { pais });
  };

  const handleDeletePais = (pais: Pais) => {
    Alert.alert(
      'Eliminar País',
      `¿Estás seguro de eliminar "${pais.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPaises(paises.filter(p => p.id_pais !== pais.id_pais));
          },
        },
      ]
    );
  };

  const handleSelectPais = (pais: Pais) => {
    // Navegar a los torneos del país
    navigation.navigate('AdminTournaments', { pais });
  };

  const renderRightActions = (pais: Pais) => (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -20, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });

    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteContainer,
          {
            opacity,
            transform: [{ translateX }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeDeleteButton}
          onPress={() => handleDeletePais(pais)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={24} color={colors.white} />
          <Text style={styles.swipeDeleteText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
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
          <View style={styles.profileButton} />
          <Text style={styles.title}>Gestionar Países</Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Main')}
          >
            <Ionicons name="person-circle" size={32} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Formulario de Creación en línea */}
        {isCreating && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Nuevo País</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre del país"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholderTextColor={colors.textLight}
            />

            <TextInput
              style={styles.input}
              placeholder="Código ISO (ej: PE, AR, BR)"
              value={nuevoCodigoIso}
              onChangeText={setNuevoCodigoIso}
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
              maxLength={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Emoji (ej: 🇵🇪)"
              value={nuevoEmoji}
              onChangeText={setNuevoEmoji}
              placeholderTextColor={colors.textLight}
              maxLength={2}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => {
                  setIsCreating(false);
                  setNuevoNombre('');
                  setNuevoCodigoIso('');
                  setNuevoEmoji('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={handleCreatePais}
              >
                <Text style={styles.saveButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando países...</Text>
          </View>
        )}

        {/* Lista de Países */}
        {!loading && (
          <GestureHandlerRootView>
            <View style={styles.paisesContainer}>
              {paises.length > 0 ? (
                paises.map((pais) => (
                  <Swipeable
                    key={pais.id_pais}
                    renderRightActions={renderRightActions(pais)}
                    rightThreshold={40}
                    friction={1.5}
                    overshootFriction={8}
                  >
                    <TouchableOpacity
                      style={styles.paisCard}
                      onPress={() => handleSelectPais(pais)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.paisInfo}>
                        <Text style={styles.paisEmoji}>{pais.emoji}</Text>
                        <Text style={styles.paisNombre}>{pais.nombre}</Text>
                      </View>

                      <View style={styles.paisActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEditPais(pais);
                          }}
                        >
                          <Ionicons name="pencil" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="earth-outline" size={64} color={colors.textSecondary} />
                  <Text style={styles.emptyStateTitle}>No hay países registrados</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Presiona el botón + para agregar tu primer país
                  </Text>
                </View>
              )}
            </View>
          </GestureHandlerRootView>
        )}
      </ScrollView>

      {/* FAB - Botón flotante para crear país */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreating(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
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
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  createForm: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundGray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  paisesContainer: {
    gap: 12,
  },
  paisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paisInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paisEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  paisNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  paisActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteContainer: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 65,
    marginVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  swipeDeleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 70,
    borderRadius: 10,
  },
  swipeDeleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ManageCountriesScreen;
