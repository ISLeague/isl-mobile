import { apiClient } from '../client/axiosClient';
import { CreateRondaRequest, UpdateRondaRequest } from '../types/rondas.types';

export const rondasService = {
  list: async () => {
    const response = await apiClient.get('/rondas-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/rondas-get', { params: { id } });
    return response.data;
  },

  create: async (data: CreateRondaRequest) => {
    const response = await apiClient.post('/rondas-create', data);
    return response.data;
  },

  update: async (data: UpdateRondaRequest) => {
    const response = await apiClient.put('/rondas-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/rondas-delete', { params: { id } });
    return response.data;
  },
};
