import { apiClient } from '../client/axiosClient';
import { CreateFaseRequest } from '../types/fases.types';

export const fasesService = {
  list: async () => {
    const response = await apiClient.get('/fases-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/fases-get', { params: { id } });
    return response.data;
  },

  create: async (data: CreateFaseRequest) => {
    const response = await apiClient.post('/fases-create', data);
    return response.data;
  },
};
