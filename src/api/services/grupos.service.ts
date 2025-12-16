import { apiClient } from '../client/axiosClient';

export const gruposService = {
  clasificacion: async (grupo_id: number) => {
    const response = await apiClient.get('/grupos-clasificacion', {
      params: { grupo_id },
    });
    return response.data;
  },
};
