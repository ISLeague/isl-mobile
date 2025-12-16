import { apiClient } from '../client/axiosClient';
import { CreateTorneoRequest } from '../types/torneos.types';

/**
 * Servicio de Torneos
 */
export const torneosService = {
  /**
   * Listar todos los torneos
   */
  list: async () => {
    const response = await apiClient.get('/torneos-list');
    return response.data;
  },

  /**
   * Obtener torneos por país
   */
  getByCountry: async (id_pais: number) => {
    const response = await apiClient.get('/torneos-por-pais', {
      params: { id_pais },
    });
    return response.data;
  },

  /**
   * Crear un nuevo torneo
   */
  create: async (data: CreateTorneoRequest) => {
    const response = await apiClient.post('/torneos-create', data);
    return response.data;
  },
};
