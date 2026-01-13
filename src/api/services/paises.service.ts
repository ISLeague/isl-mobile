import { apiClient } from '../client/axiosClient';
import { CreatePaisRequest } from '../types/paises.types';

/**
 * Servicio de Países
 */
export const paisesService = {
  /**
    Listar todos los países
   */
  list: async () => {
    const response = await apiClient.get('/paises-list');
    return response.data.data;
  },

  /**
    Crear un nuevo país
   */
  create: async (data: CreatePaisRequest) => {
    const response = await apiClient.post('/paises-create', data);
    return response.data.data;
  },

  /**
   * Actualizar un país
   */
  update: async (id_pais: number, data: Partial<CreatePaisRequest>) => {
    const response = await apiClient.patch('/paises-create', data, {
      params: { id_pais },
    });
    return response.data.data;
  },
};
