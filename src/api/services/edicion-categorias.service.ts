import { apiClient } from '../client/axiosClient';
import {
  CreateEdicionCategoriaRequest,
  CreateEdicionCategoriaResponse,
  EdicionCategoriaListParams,
  EdicionCategoriaListResponse,
  EdicionCategoria,
} from '../types/edicion-categorias.types';

export const edicionCategoriasService = {
  /**
   * List edicion-categoria assignments
   */
  list: async (params?: EdicionCategoriaListParams): Promise<EdicionCategoriaListResponse> => {
    const response = await apiClient.get<EdicionCategoriaListResponse>(
      '/edicion-categorias',
      { params: { ...params, action: 'list' } }
    );
    return response.data;
  },

  /**
   * Get a single edicion-categoria by ID
   */
  getById: async (idEdicionCategoria: number): Promise<{ success: boolean; data: EdicionCategoria }> => {
    // Use the list endpoint but filter for the specific ID
    const response = await apiClient.get(
      '/edicion-categorias',
      { params: { id_edicion_categoria: idEdicionCategoria, action: 'list' } }
    );
    // The response structure is { data: { data: [...] } }
    const items = response.data?.data?.data || response.data?.data || [];
    const item = Array.isArray(items) ? items[0] : items;
    return { success: true, data: item };
  },

  /**
   * Create/assign a categoria to an edicion
   */
  create: async (data: CreateEdicionCategoriaRequest): Promise<CreateEdicionCategoriaResponse> => {
    const response = await apiClient.post<CreateEdicionCategoriaResponse>(
      '/edicion-categorias',
      data,
      { params: { action: 'create' } }
    );
    return response.data;
  },
};
