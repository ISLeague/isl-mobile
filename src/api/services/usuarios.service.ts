import { apiClient } from '../client/axiosClient';
import {
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
  AsignarAdminTorneoRequest,
  UsuarioListItem
} from '../types/usuarios.types';

export const usuariosService = {
  list: async () => {
    const response = await apiClient.get('/usuarios-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/usuarios-get', { params: { id } });
    return response.data;
  },

  create: async (data: CreateUsuarioRequest) => {
    const response = await apiClient.post('/usuarios-create', data);
    return response.data;
  },

  update: async (data: UpdateUsuarioRequest) => {
    const response = await apiClient.put('/usuarios-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/usuarios-delete', { params: { id } });
    return response.data;
  },

  /**
   * Listar todos los administradores
   */
  listAdmins: async (id_torneo?: number) => {
    const response = await apiClient.get<{ success: boolean; data: UsuarioListItem[] }>('/usuarios/admins', {
      params: id_torneo ? { id_torneo } : undefined
    });
    return response.data;
  },

  /**
   * Asignar admin a torneos
   */
  asignarAdminTorneo: async (data: AsignarAdminTorneoRequest) => {
    const response = await apiClient.post('/usuarios/asignar-admin-torneo', data);
    return response.data;
  },

  /**
   * Quitar acceso de admin a un torneo
   */
  removerAdminTorneo: async (id_usuario: number, id_torneo: number) => {
    const response = await apiClient.delete(`/usuarios/${id_usuario}/torneos/${id_torneo}`);
    return response.data;
  },
};
