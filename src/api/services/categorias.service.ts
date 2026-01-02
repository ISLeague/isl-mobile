import { apiClient } from '../client/axiosClient';
import { CreateCategoriaRequest, UpdateCategoriaRequest } from '../types/categorias.types';

export const categoriasService = {
  list: async () => {
    const response = await apiClient.get('/categorias', { params: { action: 'list' } });
    return response.data;
  },

  get: async (id_categoria: number) => {
    const response = await apiClient.get('/categorias', { params: { id: id_categoria, action: 'get' } });
    return response.data;
  },

  /**
   * Obtener categorías por edición
   */
  getByEdition: async (id_edicion: number) => {
    // This is often handled by edicion-categorias-list, but we keep the action here for compatibility
    const response = await apiClient.get('/categorias', {
      params: { id_edicion, action: 'list' },
    });
    return response.data;
  },

  create: async (data: CreateCategoriaRequest) => {
    const response = await apiClient.post('/categorias', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  update: async (data: UpdateCategoriaRequest) => {
    const { id_categoria, ...updateData } = data;
    const response = await apiClient.patch('/categorias', updateData, {
      params: { action: 'update', id: id_categoria }
    });
    return response.data;
  },

  delete: async (id_categoria: number) => {
    const response = await apiClient.delete('/categorias', { params: { id: id_categoria, action: 'delete' } });
    return response.data;
  },
};
