import { apiClient } from '../client/axiosClient';
import { CreateLocalRequest, UpdateLocalRequest, CreateCanchaRequest, UpdateCanchaRequest } from '../types/locales.types';

export const localesService = {
  list: async (idEdicionCategoria: number) => {
    console.log("comming local ", idEdicionCategoria)
    const response = await apiClient.get('/locales', {
      params: { id_edicion_categoria: idEdicionCategoria, action: 'list' }
    }); 
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/locales', { params: { id, action: 'get' } });
    return response.data;
  },

  mapa: async () => {
    const response = await apiClient.get('/locales', {
      params: { action: 'mapa' }
    });
    return response.data;
  },

  cercanos: async (lat: number, lng: number, radio: number) => {
    const response = await apiClient.get('/locales', {
      params: { lat, lng, radio, action: 'cercanos' },
    });
    return response.data;
  },

  create: async (data: CreateLocalRequest) => {
    const response = await apiClient.post('/locales', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  update: async (data: UpdateLocalRequest) => {
    const response = await apiClient.patch('/locales', data, {
      params: { action: 'update', id: data.id_local }
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/locales', { params: { id, action: 'delete' } });
    return response.data;
  },

  uploadFoto: async (formData: FormData) => {
    const response = await apiClient.post('/locales', formData, {
      params: { action: 'foto-upload' },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteFoto: async (local_id: number, foto_url: string) => {
    const response = await apiClient.delete('/locales', {
      params: { id_local: local_id, foto_url, action: 'foto-delete' },
    });
    return response.data;
  },
};

export const canchasService = {
  list: async (idLocal: number) => {
    const response = await apiClient.get('/canchas', {
      params: { id_local: idLocal, action: 'list' }
    });
    return response.data;
  },

  listByEdicionCategoria: async (idEdicionCategoria: number) => {
    const response = await apiClient.get('/canchas', {
      params: { id_edicion_categoria: idEdicionCategoria, action: 'list' }
    });
    return response.data;
  },

  get: async (id: number) => {
    console.log("canchasss ", id)
    const response = await apiClient.get('/canchas', { params: { id, action: 'get' } });
    console.log(response.data)
    return response.data;
  },

  create: async (data: CreateCanchaRequest) => {
    const response = await apiClient.post('/canchas', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  update: async (data: UpdateCanchaRequest) => {
    const response = await apiClient.patch('/canchas', data, {
      params: { action: 'update', id: data.id_cancha }
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/canchas', { params: { id, action: 'delete' } });
    return response.data;
  },
};
