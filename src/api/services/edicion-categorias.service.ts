import { apiClient } from '../client/axiosClient';
import {
  CreateEdicionCategoriaRequest,
  CreateEdicionCategoriaResponse,
  EdicionCategoriaListParams,
  EdicionCategoriaListResponse,
} from '../types/edicion-categorias.types';

export const edicionCategoriasService = {
  /**
   * List edicion-categoria assignments
   */
  list: async (params?: EdicionCategoriaListParams): Promise<EdicionCategoriaListResponse> => {
    const response = await apiClient.get<EdicionCategoriaListResponse>(
      '/edicion-categorias-list',
      { params }
    );
    return response.data;
  },

  /**
   * Create/assign a categoria to an edicion
   */
  create: async (data: CreateEdicionCategoriaRequest): Promise<CreateEdicionCategoriaResponse> => {
    const response = await apiClient.post<CreateEdicionCategoriaResponse>(
      '/edicion-categorias-create',
      data
    );
    return response.data;
  },
};
