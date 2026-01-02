import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://htjksrcbpozlgjqpqguw.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0amtzcmNicG96bGdqcXBxZ3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MDcwMTUsImV4cCI6MjA4MTA4MzAxNX0.vKrzsTSJW3l_Sm13nZ4rrNmbWyCiKpvR1fboEP4stHg';
const TOKEN_KEY = '@isl_access_token';

// Cliente Axios configurado
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
});

// Interceptor para agregar el token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export const TOKEN_STORAGE_KEY = TOKEN_KEY;
