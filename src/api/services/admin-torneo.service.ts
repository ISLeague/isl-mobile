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
      '/admin-torneo-register',
      data
    );
    return response.data;
  },

  /**
   * List admin_torneo assignments
   * Can be filtered by id_torneo and/or id_usuario
   */
  list: async (params?: AdminTorneoListParams): Promise<AdminTorneoListResponse> => {
    const response = await apiClient.get<AdminTorneoListResponse>('/admin-torneo-list', {
      params,
    });
    return response.data;
  },

  /**
   * Assign an admin_torneo to a tournament
   */
  asignar: async (data: AdminTorneoAsignarRequest): Promise<AdminTorneoAsignarResponse> => {
    const response = await apiClient.post<AdminTorneoAsignarResponse>(
      '/admin-torneo-asignar',
      data
    );
    return response.data;
  },

  /**
   * Delete an admin_torneo assignment
   */
  delete: async (data: AdminTorneoDeleteRequest): Promise<AdminTorneoDeleteResponse> => {
    const response = await apiClient.delete<AdminTorneoDeleteResponse>('/admin-torneo-delete', {
      data,
    });
    return response.data;
  },

  /**
   * Get available admins (not yet assigned) for a specific tournament
   */
  disponibles: async (id_torneo: number): Promise<AdminTorneoDisponiblesResponse> => {
    const response = await apiClient.get<AdminTorneoDisponiblesResponse>('/admin-torneo-disponibles', {
      params: { id_torneo },
    });
    return response.data;
  },
};

export default adminTorneoService;
