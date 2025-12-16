import { apiClient } from '../client/axiosClient';

export const estadisticasService = {
  goleadores: async () => {
    const response = await apiClient.get('/estadisticas-goleadores');
    return response.data;
  },

  goleadoresPorEdicion: async (edicion_id: number) => {
    const response = await apiClient.get('/estadisticas-goleadores-edicion', {
      params: { edicion_id },
    });
    return response.data;
  },

  asistencias: async () => {
    const response = await apiClient.get('/estadisticas-asistencias');
    return response.data;
  },
};
