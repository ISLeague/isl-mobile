import { apiClient } from '../client/axiosClient';
import {
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
  AsignarAdminTorneoRequest,
  UsuarioListItem
} from '../types/usuarios.types';

export const usuariosService = {
  list: async () => {
    const response = await apiClient.get('/usuarios', { params: { action: 'list' } });
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/usuarios', { params: { id, action: 'get' } });
    return response.data;
  },

  create: async (data: CreateUsuarioRequest) => {
    const response = await apiClient.post('/usuarios', data, { params: { action: 'create' } });
    return response.data;
  },

  update: async (data: UpdateUsuarioRequest) => {
    const response = await apiClient.patch('/usuarios', data, { params: { action: 'update', id: data.id } });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/usuarios', { params: { id, action: 'delete' } });
    return response.data;
  },

  /**
   * Listar todos los administradores
   */
  listAdmins: async (id_torneo?: number) => {
    const response = await apiClient.get<{ success: boolean; data: UsuarioListItem[] }>('/admin', {
      params: { action: 'list-torneo', id_torneo }
    });
    return response.data;
  },

  /**
   * Asignar admin a torneos
   */
  asignarAdminTorneo: async (data: AsignarAdminTorneoRequest) => {
    const response = await apiClient.post('/admin',
      { id_usuario: data.id_usuario, id_target: data.id_torneos[0] },
      { params: { action: 'assign-torneo' } }
    );
    return response.data;
  },

  /**
   * Quitar acceso de admin a un torneo
   */
  removerAdminTorneo: async (id_usuario: number, id_torneo: number) => {
    // This needs careful handling in the router. For now, assuming it finds the assignment by IDs.
    const response = await apiClient.delete('/admin', {
      params: { action: 'delete-torneo', id_usuario, id_torneo }
    });
    return response.data;
  },

  /**
   * Actualizar perfil del usuario actual (nombre, pais)
   */
  updateProfile: async (data: { nombre?: string; id_pais?: number }) => {
    const response = await apiClient.post('/usuarios', data, {
      params: { action: 'profile-update' }
    });
    return response.data;
  },

  /**
   * Cambiar contraseña del usuario actual
   */
  changePassword: async (password: string) => {
    const response = await apiClient.post('/usuarios', { new_password: password }, {
      params: { action: 'change-password' }
    });
    return response.data;
  },
};
