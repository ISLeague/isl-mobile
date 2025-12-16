import { apiClient } from '../client/axiosClient';
import { CreateUsuarioRequest, UpdateUsuarioRequest } from '../types/usuarios.types';

export const usuariosService = {
  list: async () => {
    const response = await apiClient.get('/usuarios-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/usuarios-get', { params: { id } });
    return response.data;
  },

  create: async (data: CreateUsuarioRequest) => {
    const response = await apiClient.post('/usuarios-create', data);
    return response.data;
  },

  update: async (data: UpdateUsuarioRequest) => {
    const response = await apiClient.put('/usuarios-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/usuarios-delete', { params: { id } });
    return response.data;
  },
};
