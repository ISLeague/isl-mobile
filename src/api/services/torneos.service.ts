import { apiClient } from '../client/axiosClient';
import {
  CreateTorneoRequest,
  UpdateTorneoRequest,
  TorneosListParams,
  TorneosListResponse
} from '../types/torneos.types';

/**
 * Servicio de Torneos
 */
export const torneosService = {
  /**
   * Listar todos los torneos con parámetros opcionales
   */
  list: async (params?: TorneosListParams): Promise<TorneosListResponse> => {
    const response = await apiClient.get<TorneosListResponse>('/torneos', {
      params: {
        ...params,
        action: 'list',
        // Si no se especifica 'activo', por default usar true
        activo: params?.activo !== undefined ? params.activo : true,
      }
    });
    return response.data;
  },

  /**
   * Obtener torneos por país con búsqueda y filtros
   */
  getByCountry: async (
    id_pais: number,
    params?: Omit<TorneosListParams, 'id_pais'>
  ): Promise<TorneosListResponse> => {
      const { page = 1, limit = 10, activo = 'todos', q } = (params || {}) as TorneosListParams;
      // Send activo as 'todos' by default (when unspecified) to request all tournaments.
      const query = { id_pais, page, limit, activo, q } as any;
      console.log('🔗 [torneosService.getByCountry] query being sent to backend:', query);
      const response = await apiClient.get('/torneos', { params: query });
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
