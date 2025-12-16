import { apiClient } from '../client/axiosClient';
import { CreateCategoriaRequest, UpdateCategoriaRequest } from '../types/categorias.types';

export const categoriasService = {
  list: async () => {
    const response = await apiClient.get('/categorias-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/categorias-get', { params: { id } });
    return response.data;
  },

  /**
   * Obtener categorías por edición
   */
  getByEdition: async (id_edicion: number) => {
    const response = await apiClient.get('/categorias-por-edicion', {
      params: { id_edicion },
    });
    return response.data;
  },

  create: async (data: CreateCategoriaRequest) => {
    const response = await apiClient.post('/categorias-create', data);
    return response.data;
  },

  update: async (data: UpdateCategoriaRequest) => {
    const response = await apiClient.put('/categorias-update', data);
    return response.data;
  },
};
