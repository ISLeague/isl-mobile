import { apiClient } from '../client/axiosClient';
import { CreateLocalRequest, UpdateLocalRequest, CreateCanchaRequest, UpdateCanchaRequest } from '../types/locales.types';

export const localesService = {
  list: async (idEdicionCategoria: number) => {
    const response = await apiClient.get('/locales-list', {
      params: { id_edicion_categoria: idEdicionCategoria }
    });
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/locales-get', { params: { id } });
    return response.data;
  },

  mapa: async () => {
    const response = await apiClient.get('/locales-mapa');
    return response.data;
  },

  cercanos: async (lat: number, lng: number, radio: number) => {
    const response = await apiClient.get('/locales-cercanos', {
      params: { lat, lng, radio },
    });
    return response.data;
  },

  create: async (data: CreateLocalRequest) => {
    const response = await apiClient.post('/locales-create', data);
    return response.data;
  },

  update: async (data: UpdateLocalRequest) => {
    const response = await apiClient.put('/locales-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/locales-delete', { params: { id } });
    return response.data;
  },

  uploadFoto: async (formData: FormData) => {
    const response = await apiClient.post('/locales-foto-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteFoto: async (local_id: number, foto_url: string) => {
    const response = await apiClient.delete('/locales-foto-delete', {
      params: { local_id, foto_url },
    });
    return response.data;
  },
};

export const canchasService = {
  list: async (idLocal: number) => {
    const response = await apiClient.get('/canchas-list', {
      params: { id_local: idLocal }
    });
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/canchas-get', { params: { id } });
    return response.data;
  },

  create: async (data: CreateCanchaRequest) => {
    const response = await apiClient.post('/canchas-create', data);
    return response.data;
  },

  update: async (data: UpdateCanchaRequest) => {
    const response = await apiClient.put('/canchas-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/canchas-delete', { params: { id } });
    return response.data;
  },
};
