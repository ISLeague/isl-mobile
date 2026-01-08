import { apiClient } from '../client/axiosClient';
import { setAuthToken, clearAuthToken } from '../client/authHelpers';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types';

/**
 * Servicio de Autenticación
 * Maneja login, registro y logout
 */
export const authService = {
  /**
   * Iniciar sesión
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth', data, { params: { action: 'login' } });
    // Transformar la respuesta del backend al formato esperado
    const backendData = response.data.data || response.data;
    const token = backendData.session?.access_token || backendData.token;
    const usuario = backendData.usuario || backendData.user;

    if (token) {
      await setAuthToken(token);
    }

    return {
      token,
      usuario,
    };
  },

  /**
   * Registrar nuevo usuario
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth', data, { params: { action: 'register' } });

    // La respuesta del registro tiene un formato específico: { success, data: { usuario, session, mensaje }, timestamp }
    const { data: backendData } = response.data;
    const token = backendData.session?.access_token || null;
    const usuario = backendData.usuario;
    const mensaje = backendData.mensaje;

    if (token) {
      await setAuthToken(token);
    }

    return {
      token,
      usuario,
      mensaje,
    };
  },

  /**
   * Cerrar sesión
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth', {}, { params: { action: 'logout' } });
    await clearAuthToken();
  },
};
