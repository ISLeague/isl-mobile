import { apiClient } from '../client/axiosClient';
import { CreateEdicionRequest } from '../types/ediciones.types';

export const edicionesService = {
  list: async () => {
    const response = await apiClient.get('/ediciones-list');
    return response.data;
  },

  /**
   * Obtener ediciones por torneo
   */
  getByTournament: async (id_torneo: number) => {
    const response = await apiClient.get('/ediciones-por-torneo', {
      params: { id_torneo },
    });
    return response.data;
  },

  create: async (data: CreateEdicionRequest) => {
    const response = await apiClient.post('/ediciones-create', data);
    return response.data;
  },
};
