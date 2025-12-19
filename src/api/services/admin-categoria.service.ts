import { apiClient } from '../client/axiosClient';
import { AdminCategoriaAsignarRequest, AdminCategoriaAsignarResponse, AdminCategoriaDeleteRequest, AdminCategoriaDeleteResponse, AdminCategoriaListParams, AdminCategoriaListResponse, AdminCategoriaRegisterRequest, AdminCategoriaRegisterResponse } from '../types/admin-categoria';

export const adminCategoriaService = {
  /**
   * Register a new admin_Categoria user
   * Creates a new admin with temporary credentials
   */
  register: async (data: AdminCategoriaRegisterRequest): Promise<AdminCategoriaRegisterResponse> => {
    const response = await apiClient.post<AdminCategoriaRegisterResponse>(
      '/admin-categoria-register',
      data
    );
    return response.data;
  },

  /**
   * List admin_Categoria assignments
   * Can be filtered by id_Categoria and/or id_usuario
   */
  list: async (params?: AdminCategoriaListParams): Promise<AdminCategoriaListResponse> => {
    const response = await apiClient.get<AdminCategoriaListResponse>('/admin-categoria-list', {
      params,
    });
    return response.data;
  },

  /**
   * Assign an admin_Categoria to a tournament
   */
  asignar: async (data: AdminCategoriaAsignarRequest): Promise<AdminCategoriaAsignarResponse> => {
    const response = await apiClient.post<AdminCategoriaAsignarResponse>(
      '/admin-categoria-asignar',
      data
    );
    return response.data;
  },

  /**
   * Delete an admin_Categoria assignment
   */
  delete: async (data: AdminCategoriaDeleteRequest): Promise<AdminCategoriaDeleteResponse> => {
    const response = await apiClient.delete<AdminCategoriaDeleteResponse>('/admin-categoria-delete', {
      data,
    });
    return response.data;
  },
};

export default adminCategoriaService;
