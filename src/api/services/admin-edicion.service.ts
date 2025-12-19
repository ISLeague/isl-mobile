import { apiClient } from '../client/axiosClient';
import {
  AdminEdicionAsignarRequest,
  AdminEdicionAsignarResponse,
  AdminEdicionDeleteRequest,
  AdminEdicionDeleteResponse,
  AdminEdicionListParams,
  AdminEdicionListResponse,
  AdminEdicionRegisterRequest,
  AdminEdicionRegisterResponse,
  AdminEdicionDisponiblesResponse,
} from '../types/admin-edicion';

export const adminEdicionService = {
  /**
   * Register a new admin_Edicion user
   * Creates a new admin with temporary credentials
   */
  register: async (data: AdminEdicionRegisterRequest): Promise<AdminEdicionRegisterResponse> => {
    const response = await apiClient.post<AdminEdicionRegisterResponse>(
      '/admin-edicion-register',
      data
    );
    return response.data;
  },

  /**
   * List admin_Edicion assignments
   * Can be filtered by id_Edicion and/or id_usuario
   */
  list: async (params?: AdminEdicionListParams): Promise<AdminEdicionListResponse> => {
    const response = await apiClient.get<AdminEdicionListResponse>('/admin-edicion-list', {
      params,
    });
    return response.data;
  },

  /**
   * Assign an admin_Edicion to a tournament
   */
  asignar: async (data: AdminEdicionAsignarRequest): Promise<AdminEdicionAsignarResponse> => {
    const response = await apiClient.post<AdminEdicionAsignarResponse>(
      '/admin-edicion-asignar',
      data
    );
    return response.data;
  },

  /**
   * Delete an admin_Edicion assignment
   */
  delete: async (data: AdminEdicionDeleteRequest): Promise<AdminEdicionDeleteResponse> => {
    const response = await apiClient.delete<AdminEdicionDeleteResponse>('/admin-edicion-delete', {
      data,
    });
    return response.data;
  },

  /**
   * Get available admins (not yet assigned) for a specific edicion
   */
  disponibles: async (id_edicion: number): Promise<AdminEdicionDisponiblesResponse> => {
    const response = await apiClient.get<AdminEdicionDisponiblesResponse>('/admin-edicion-disponibles', {
      params: { id_edicion },
    });
    return response.data;
  },
};

export default adminEdicionService;
