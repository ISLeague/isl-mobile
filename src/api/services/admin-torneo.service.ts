import { apiClient } from '../client/axiosClient';
import {
  AdminTorneoRegisterRequest,
  AdminTorneoRegisterResponse,
  AdminTorneoListParams,
  AdminTorneoListResponse,
  AdminTorneoAsignarRequest,
  AdminTorneoAsignarResponse,
  AdminTorneoDeleteRequest,
  AdminTorneoDeleteResponse,
  AdminTorneoDisponiblesResponse,
} from '../types/admin-torneos';

export const adminTorneoService = {
  /**
   * Register a new admin_torneo user
   * Creates a new admin with temporary credentials
   */
  register: async (data: AdminTorneoRegisterRequest): Promise<AdminTorneoRegisterResponse> => {
    const response = await apiClient.post<AdminTorneoRegisterResponse>(
      '/admin',
      data,
      { params: { action: 'register-torneo' } }
    );
    return response.data;
  },

  /**
   * List admin_torneo assignments
   * Can be filtered by id_torneo and/or id_usuario
   */
  list: async (params?: AdminTorneoListParams): Promise<AdminTorneoListResponse> => {
    const response = await apiClient.get<AdminTorneoListResponse>('/admin', {
      params: { ...params, action: 'list-torneo' },
    });
    return response.data;
  },

  /**
   * Assign an admin_torneo to a tournament
   */
  asignar: async (data: AdminTorneoAsignarRequest): Promise<AdminTorneoAsignarResponse> => {
    const response = await apiClient.post<AdminTorneoAsignarResponse>(
      '/admin',
      { id_usuario: data.id_usuario, id_target: data.id_torneo },
      { params: { action: 'assign-torneo' } }
    );
    return response.data;
  },

  /**
   * Delete an admin_torneo assignment
   */
  delete: async (data: AdminTorneoDeleteRequest): Promise<AdminTorneoDeleteResponse> => {
    const response = await apiClient.delete<AdminTorneoDeleteResponse>('/admin', {
      params: { action: 'delete-torneo', id: data.id_admin_torneo },
    });
    return response.data;
  },

  /**
   * Get available admins (not yet assigned) for a specific tournament
   */
  disponibles: async (id_torneo: number): Promise<AdminTorneoDisponiblesResponse> => {
    const response = await apiClient.get<AdminTorneoDisponiblesResponse>('/admin', {
      params: { id_torneo, action: 'available-torneo' },
    });
    return response.data;
  },
};

export default adminTorneoService;
