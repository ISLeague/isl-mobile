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
    const response = await apiClient.get<TorneosListResponse>('/torneos-list', {
      params: {
        ...params,
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
    const response = await apiClient.get<TorneosListResponse>('/torneos-list', {
      params: {
        id_pais,
        ...params,
        // Si no se especifica 'activo', por default usar true
        activo: params?.activo !== undefined ? params.activo : true,
      }
    });
    return response.data;
  },

  /**
   * Crear un nuevo torneo
   */
  create: async (data: CreateTorneoRequest) => {
    const response = await apiClient.post('/torneos-create', data);
    return response.data;
  },

  /**
   * Actualizar un torneo
   */
  update: async (data: UpdateTorneoRequest) => {
    const response = await apiClient.put('/torneos-update', data);
    return response.data;
  },

  /**
   * Obtener admins asignados a un torneo
   */
  getAdmins: async (id_torneo: number) => {
    const response = await apiClient.get(`/torneos/${id_torneo}/admins`);
    return response.data;
  },
};
