import { apiClient } from '../client/axiosClient';

export const notificacionesService = {
  mis: async () => {
    const response = await apiClient.get('/notificaciones-mis');
    return response.data;
  },
};
