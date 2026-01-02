import { apiClient } from '../client/axiosClient';
import {
  CreateEdicionRequest,
  CreateEdicionResponse,
  EdicionesListParams,
  EdicionesListResponse,
  UpdateEdicionRequest,
  UpdateEdicionResponse,
} from '../types/ediciones.types';

export const edicionesService = {
  /**
   * List ediciones with optional filters
   * Can be filtered by id_torneo and/or estado
   */
  list: async (params?: EdicionesListParams): Promise<EdicionesListResponse> => {
    const response = await apiClient.get<EdicionesListResponse>('/ediciones', {
      params: { ...params, action: 'list' },
    });
    return response.data;
  },

  /**
   * Create a new edicion (superadmin and admin_torneo only)
   */
  create: async (data: CreateEdicionRequest): Promise<CreateEdicionResponse> => {
    const response = await apiClient.post<CreateEdicionResponse>(
      '/ediciones',
      data,
      { params: { action: 'create' } }
    );
    return response.data;
  },

  /**
   * Update an existing edicion
   * Can update numero, nombre, estado, fecha_inicio, and/or fecha_fin
   */
  update: async (id_edicion: number, data: UpdateEdicionRequest): Promise<UpdateEdicionResponse> => {
    const response = await apiClient.patch<UpdateEdicionResponse>(
      '/ediciones',
      data,
      {
        params: { id_edicion, action: 'update' },
      }
    );
    return response.data;
  },
};

export default edicionesService;
