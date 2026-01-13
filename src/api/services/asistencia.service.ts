import { apiClient } from '../client/axiosClient';
import {
  AsistenciaListResponse,
  RegistrarAsistenciaRequest,
  RegistrarAsistenciaResponse,
  PresentesResponse,
} from '../types/asistencia.types';

export const asistenciaService = {
  /**
   * Obtener lista de jugadores con estado de asistencia para un partido
   */
  list: async (id_partido: number): Promise<{ success: boolean; data?: AsistenciaListResponse; error?: string }> => {
    try {
      const response = await apiClient.get('/asistencia-partido', {
        params: { id_partido, action: 'list' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching asistencia:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Obtener solo los jugadores presentes y válidos para jugar
   */
  getPresentes: async (id_partido: number): Promise<{ success: boolean; data?: PresentesResponse; error?: string }> => {
    try {
      const response = await apiClient.get('/asistencia-partido', {
        params: { id_partido, action: 'presentes' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching presentes:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Registrar asistencia de múltiples jugadores
   */
  registrar: async (data: RegistrarAsistenciaRequest): Promise<{ success: boolean; data?: RegistrarAsistenciaResponse; error?: string }> => {
    try {
      const response = await apiClient.post('/asistencia-partido', data, {
        params: { action: 'registrar' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error registering asistencia:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Actualizar asistencia de un jugador individual
   */
  update: async (id_partido: number, id_plantilla: number, presente: boolean, valido_para_jugar?: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.patch('/asistencia-partido', {
        id_partido,
        id_plantilla,
        presente,
        valido_para_jugar,
      }, {
        params: { action: 'update' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating asistencia:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  /**
   * Eliminar toda la asistencia de un partido
   */
  delete: async (id_partido: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.delete('/asistencia-partido', {
        params: { id_partido },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting asistencia:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },
};
