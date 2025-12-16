import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_STORAGE_KEY } from './axiosClient';

/**
 * Guarda el token de autenticación en AsyncStorage
 */
export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Obtiene el token de autenticación desde AsyncStorage
 */
export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Elimina el token de autenticación
 */
export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
};
