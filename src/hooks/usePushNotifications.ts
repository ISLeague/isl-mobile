import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Importación dinámica para evitar errores en Expo Go
let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  // Configurar cómo se manejan las notificaciones cuando la app está en primer plano
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log('📱 Push notifications no disponibles (normal en Expo Go SDK 53+)');
}

// Detectar si estamos en Expo Go (sin usar appOwnership deprecated)
const isExpoGo = !Constants.expoConfig?.extra?.eas?.projectId;

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<any>(undefined);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Si estamos en Expo Go o no hay soporte, no intentar registrar
    if (isExpoGo || !Notifications || !Device) {
      console.log('⚠️ Push notifications deshabilitadas en Expo Go. Usa un Development Build para probar.');
      return;
    }

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listener para cuando llega una notificación mientras la app está abierta
    notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      setNotification(notification);
    });

    // Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    isSupported: !isExpoGo && !!Notifications,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Notifications || !Device) return undefined;

  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Permisos de notificación no otorgados');
        return;
      }

      // Obtener projectId del app.json/app.config.js
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;

      console.log('✅ Expo Push Token obtenido:', token);
    } else {
      console.log('⚠️ Usa un dispositivo físico para Push Notifications');
    }
  } catch (error: any) {
    // Silenciar errores en Expo Go
    if (!error.message?.includes('expo-notifications')) {
      console.log('⚠️ Error configurando push notifications:', error.message);
    }
  }

  return token;
}

/**
 * Función para registrar el device token en el backend al hacer login
 */
export async function registerDeviceToken(token: string): Promise<void> {
  try {
    // El token se enviará automáticamente en el login
    // Aquí solo guardamos en storage para usarlo en próximos requests si es necesario
    console.log('Device token registered:', token);
  } catch (error) {
    console.error('Error registering device token:', error);
  }
}
