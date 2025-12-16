import { apiClient } from '../client/axiosClient';
import { CreateEquipoRequest } from '../types/equipos.types';

/**
 * Servicio de Equipos
 */
export const equiposService = {
  /**
   * Listar todos los equipos
   */
  list: async () => {
    const response = await apiClient.get('/equipos-list');
    return response.data;
  },

  /**
   * Obtener un equipo por ID
   */
  get: async (id: number) => {
    const response = await apiClient.get('/equipos-get', {
      params: { id },
    });
    return response.data;
  },

  /**
   * Crear un nuevo equipo
   */
  create: async (data: CreateEquipoRequest) => {
    const response = await apiClient.post('/equipos-create', data);
    return response.data;
  },
};
