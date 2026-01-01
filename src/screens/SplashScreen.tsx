import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import { colors } from '../theme/colors';

// Mapeo de assets para precargar (solo imágenes)
const CRITICAL_ASSETS = [
  require('../assets/InterLOGO.png'),
  require('../assets/InterLOGO2.png'),
  require('../assets/InterLOGO3.png'),
  require('../assets/waze.png'),
  require('../assets/google-maps.png'),
  require('../assets/vibenfly.jpeg'),
  require('../assets/watermark.png'),
];

export const SplashScreen = ({ navigation }: any) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepareAssets = async () => {
      try {
        // Cargar imágenes críticas en caché
        const cacheImages = CRITICAL_ASSETS.map(image => {
          return Asset.fromModule(image).downloadAsync();
        });

        // Esperar a que carguen las imágenes Y un tiempo mínimo de splash (1.5s)
        await Promise.all([
          ...cacheImages,
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);

      } catch (e) {
        console.warn('Error precargando assets:', e);
      } finally {
        setIsReady(true);
      }
    };

    prepareAssets();
  }, []);

  useEffect(() => {
    if (isReady) {
      navigation.replace('Login');
    }
  }, [isReady]);

  return (
    <LinearGradient
      colors={['#F13A21', '#BE0127']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/InterLOGO.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* Spinner discreto mientras carga si toma más de lo esperado */}
        {!isReady && (
          <ActivityIndicator
            size="small"
            color="rgba(255,255,255,0.5)"
            style={{ marginTop: 20 }}
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
});

export default SplashScreen;
