import { apiClient } from '../client/axiosClient';
import {
  CreateTorneoRequest,
  UpdateTorneoRequest,
  TorneosListParams,
  TorneosListResponse
} from '../types/torneos.types';


export const torneosService = {
  list: async (params?: TorneosListParams): Promise<TorneosListResponse> => {
    const response = await apiClient.get<TorneosListResponse>('/torneos', {
      params: {
        ...params,
        action: 'list',
        activo: params?.activo !== undefined ? params.activo : true,
      }
    });
    return response.data;
  },

  getByCountry: async (
    id_pais: number,
    params?: Omit<TorneosListParams, 'id_pais'>
  ): Promise<TorneosListResponse> => {
      const { activo = 'todos' } = (params || {}) as TorneosListParams;
      // Usar action: 'por-pais' que es lo que espera el backend para filtrar por país
      const query = { action: 'por-pais', id_pais, activo } as any;
      console.log('🔗 [torneosService.getByCountry] query being sent to backend:', query);
      const response = await apiClient.get<TorneosListResponse>('/torneos', { params: query });
    return response.data;
  },

  /**
   * Crear un nuevo torneo
   */
  create: async (data: CreateTorneoRequest) => {
    const response = await apiClient.post('/torneos', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  /**
   * Actualizar un torneo
   */
  update: async (data: UpdateTorneoRequest) => {
    const response = await apiClient.patch('/torneos', data, {
      params: { action: 'update', id: data.id_torneo }
    });
    return response.data;
  },

  /**
   * Obtener admins asignados a un torneo
   */
  getAdmins: async (id_torneo: number) => {
    // This looks like it redirects to the admin router list with filters
    const response = await apiClient.get('/admin', {
      params: { action: 'list-torneo', id_torneo }
    });
    return response.data;
  },

  /**
   * Eliminar un torneo (soft delete)
   */
  delete: async (id: number) => {
    const response = await apiClient.delete('/torneos', {
      params: { id, action: 'delete' }
    });
    return response.data;
  },
};
