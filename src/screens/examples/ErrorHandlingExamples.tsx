/**
 * EJEMPLO DE USO DEL SISTEMA DE MANEJO DE ERRORES
 * 
 * Este archivo muestra cómo aplicar el sistema de manejo de errores
 * en una pantalla típica con carga de datos, formularios, etc.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Button, ErrorBoundary } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import { safeAsync, getUserFriendlyMessage, retry } from '../../utils/errorHandling';
import { mockEquipos, mockJugadores, mockPartidos } from '../../data/mockData';

/**
 * EJEMPLO 1: Carga de datos con manejo de errores
 */
export const ExampleLoadDataScreen = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { showError, showSuccess, showWarning } = useToast();

  // Cargar datos con manejo de errores automático
  const loadTeams = useCallback(async () => {
    setLoading(true);

    // Opción 1: Con safeAsync (recomendado)
    const result = await safeAsync(
      async () => {
        // Simular carga de datos
        return mockEquipos;
      },
      'loadTeams', // Contexto para logging
      {
        severity: 'high', // Severidad del error
        fallbackValue: [], // Valor por defecto si falla
        onError: (error) => {
          // Mostrar mensaje amigable al usuario
          showError(getUserFriendlyMessage(error), 'Error al cargar equipos');
        },
      }
    );

    setTeams(result || []);
    setLoading(false);

    if (result && result.length > 0) {
      showSuccess(`${result.length} equipos cargados`);
    }
  }, [showError, showSuccess]);

  // Recargar con pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  }, [loadTeams]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" />}
      
      <FlatList
        data={teams}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.nombre}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id_equipo.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

/**
 * EJEMPLO 2: Formulario con validación y manejo de errores
 */
export const ExampleFormScreen = ({ navigation }: { navigation: any }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, showWarning } = useToast();

  const handleSubmit = async () => {
    // Validaciones con feedback visual
    if (!nombre.trim()) {
      showWarning('Por favor ingresa un nombre', 'Campo requerido');
      return;
    }

    if (!email.trim()) {
      showWarning('Por favor ingresa un email', 'Campo requerido');
      return;
    }

    if (!email.includes('@')) {
      showError('El email no es válido', 'Validación fallida');
      return;
    }

    setLoading(true);

    // Guardar con manejo de errores
    const success = await safeAsync(
      async () => {
        // Simular guardado
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      },
      'submitForm',
      {
        severity: 'high',
        fallbackValue: false,
        onError: (error) => {
          showError(getUserFriendlyMessage(error), 'Error al guardar');
        },
      }
    );

    setLoading(false);

    if (success) {
      showSuccess('Formulario enviado exitosamente');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre"
        style={styles.input}
      />
      
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
      />
      
      <Button
        title={loading ? 'Guardando...' : 'Guardar'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
};

/**
 * EJEMPLO 3: Operación con reintentos automáticos
 */
export const ExampleRetryScreen = () => {
  const [status, setStatus] = useState('Idle');
  const { showError, showSuccess, showInfo } = useToast();

  const fetchDataWithRetry = async () => {
    setStatus('Cargando...');

    try {
      const data = await retry(
        async () => {
          // Operación que puede fallar temporalmente
          const response = await fetch('https://api.example.com/data');
          if (!response.ok) throw new Error('Failed to fetch');
          return response.json();
        },
        {
          maxAttempts: 3, // Intentar hasta 3 veces
          delay: 1000, // 1 segundo entre intentos
          onRetry: (attempt, error) => {
            showInfo(
              `Reintentando... (${attempt}/3)`,
              'Conexión inestable'
            );
          },
        }
      );

      setStatus('Completado');
      showSuccess('Datos cargados correctamente');
      return data;
    } catch (error) {
      setStatus('Error');
      showError(getUserFriendlyMessage(error as Error));
    }
  };

  return (
    <View style={styles.container}>
      <Text>Estado: {status}</Text>
      <Button title="Cargar con reintentos" onPress={fetchDataWithRetry} />
    </View>
  );
};

/**
 * EJEMPLO 4: Try-Catch manual con Toast
 */
export const ExampleManualErrorHandling = () => {
  const { showError, showSuccess } = useToast();

  const handleRiskyOperation = async () => {
    try {
      // Simular operación
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Operación completada');
    } catch (error) {
      // Mostrar error amigable
      showError(
        getUserFriendlyMessage(error as Error),
        'Error en la operación'
      );
      
      // Opcional: loggear para debugging
      console.error('Error details:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Ejecutar operación" onPress={handleRiskyOperation} />
    </View>
  );
};

/**
 * EJEMPLO 5: Proteger una sección con ErrorBoundary
 */
const ComplexComponentThatMightCrash = () => {
  return (
    <View>
      <Text>Componente complejo que podría fallar</Text>
    </View>
  );
};

export const ExampleWithErrorBoundary = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Pantalla</Text>
      
      {/* Esta sección está protegida */}
      <ErrorBoundary
        fallback={
          <View style={styles.errorContainer}>
            <Text>No se pudieron cargar los datos</Text>
            <Button title="Reintentar" onPress={() => console.log('Reintentar')} />
          </View>
        }
      >
        <ComplexComponentThatMightCrash />
      </ErrorBoundary>
      
      {/* El resto de la pantalla seguirá funcionando */}
      <Text>Footer siempre visible</Text>
    </View>
  );
};

/**
 * EJEMPLO 6: Cargar múltiples recursos con manejo de errores
 */
export const ExampleMultipleLoads = () => {
  const [data, setData] = useState<{ teams: any[]; players: any[]; matches: any[] }>({ teams: [], players: [], matches: [] });
  const { showError } = useToast();

  const loadAllData = async () => {
    // Cargar todos en paralelo con manejo de errores individual
    const [teams, players, matches] = await Promise.all([
      safeAsync(
        () => Promise.resolve(mockEquipos),
        'loadTeams',
        { fallbackValue: [], onError: (e) => showError('Error al cargar equipos') }
      ),
      safeAsync(
        () => Promise.resolve(mockJugadores),
        'loadPlayers',
        { fallbackValue: [], onError: (e) => showError('Error al cargar jugadores') }
      ),
      safeAsync(
        () => Promise.resolve(mockPartidos),
        'loadMatches',
        { fallbackValue: [], onError: (e) => showError('Error al cargar partidos') }
      ),
    ]);

    setData({ teams: teams || [], players: players || [], matches: matches || [] });
  };

  return (
    <View style={styles.container}>
      <Button title="Cargar todo" onPress={loadAllData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    margin: 16,
  },
});

// 📝 RESUMEN DE PATRONES:
//
// 1. ✅ Usar safeAsync() para operaciones async
// 2. ✅ Usar safeTry() para operaciones síncronas
// 3. ✅ Usar retry() para operaciones con fallos temporales
// 4. ✅ Usar getUserFriendlyMessage() para errores legibles
// 5. ✅ Usar useToast() para feedback visual
// 6. ✅ Usar ErrorBoundary para proteger secciones críticas
// 7. ✅ Siempre proporcionar fallbackValue para evitar crashes
// 8. ✅ Loggear errores con errorHandler.logError() cuando sea necesario
