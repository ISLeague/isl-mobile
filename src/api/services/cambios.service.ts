import { apiClient } from '../client/axiosClient';
import {
  CambiosListResponse,
  DisponiblesResponse,
  RegistrarCambioRequest,
  RegistrarCambioResponse,
  BulkCambiosRequest,
  BulkCambiosResponse,
} from '../types/cambios.types';

export const cambiosService = {
  /**
   * Obtener lista de cambios de un partido
   */
  list: async (id_partido: number): Promise<{ success: boolean; data?: CambiosListResponse; error?: string }> => {
    try {
      const response = await apiClient.get('/cambios-partido', {
        params: { id_partido, action: 'list' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cambios:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Obtener jugadores disponibles para cambios (en cancha y en banca)
   */
  getDisponibles: async (id_partido: number, id_equipo: number): Promise<{ success: boolean; data?: DisponiblesResponse; error?: string }> => {
    try {
      const response = await apiClient.get('/cambios-partido', {
        params: { id_partido, id_equipo, action: 'disponibles' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching disponibles:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Registrar un cambio individual
   */
  registrar: async (data: RegistrarCambioRequest): Promise<{ success: boolean; data?: RegistrarCambioResponse; error?: string }> => {
    try {
      const response = await apiClient.post('/cambios-partido', data, {
        params: { action: 'registrar' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error registering cambio:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Registrar múltiples cambios
   */
  registrarBulk: async (data: BulkCambiosRequest): Promise<{ success: boolean; data?: BulkCambiosResponse; error?: string }> => {
    try {
      const response = await apiClient.post('/cambios-partido', data, {
        params: { action: 'bulk' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error registering bulk cambios:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Eliminar un cambio específico
   */
  delete: async (id_cambio: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.delete('/cambios-partido', {
        params: { id_cambio },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting cambio:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Eliminar todos los cambios de un partido
   */
  deleteAll: async (id_partido: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.delete('/cambios-partido', {
        params: { id_partido },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting all cambios:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },
};
