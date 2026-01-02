import { apiClient } from '../client/axiosClient';
import { AdminCategoriaAsignarRequest, AdminCategoriaAsignarResponse, AdminCategoriaDeleteRequest, AdminCategoriaDeleteResponse, AdminCategoriaListParams, AdminCategoriaListResponse, AdminCategoriaRegisterRequest, AdminCategoriaRegisterResponse } from '../types/admin-categoria';

export const adminCategoriaService = {
  /**
   * Register a new admin_Categoria user
   * Creates a new admin with temporary credentials
   */
  register: async (data: AdminCategoriaRegisterRequest): Promise<AdminCategoriaRegisterResponse> => {
    const response = await apiClient.post<AdminCategoriaRegisterResponse>(
      '/admin',
      data,
      { params: { action: 'register-categoria' } }
    );
    return response.data;
  },

  /**
   * List admin_Categoria assignments
   * Can be filtered by id_Categoria and/or id_usuario
   */
  list: async (params?: AdminCategoriaListParams): Promise<AdminCategoriaListResponse> => {
    const response = await apiClient.get<AdminCategoriaListResponse>('/admin', {
      params: { ...params, action: 'list-categoria' },
    });
    return response.data;
  },

  /**
   * Assign an admin_Categoria to a tournament
   */
  asignar: async (data: AdminCategoriaAsignarRequest): Promise<AdminCategoriaAsignarResponse> => {
    const response = await apiClient.post<AdminCategoriaAsignarResponse>(
      '/admin',
      { id_usuario: data.id_usuario, id_target: data.id_categoria },
      { params: { action: 'assign-categoria' } }
    );
    return response.data;
  },

  /**
   * Delete an admin_Categoria assignment
   */
  delete: async (data: AdminCategoriaDeleteRequest): Promise<AdminCategoriaDeleteResponse> => {
    const response = await apiClient.delete<AdminCategoriaDeleteResponse>('/admin', {
      params: { action: 'delete-categoria', id: data.id_admin_categoria },
    });
    return response.data;
  },
};

export default adminCategoriaService;
