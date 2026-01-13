import { apiClient } from '../client/axiosClient';
import {
  ListSeguimientosResponse,
  CreateSeguimientoRequest,
  CreateSeguimientoResponse,
  UpdatePreferenciasRequest,
  DeleteSeguimientoResponse,
} from '../types/seguimiento-equipos.types';

/**
 * Servicio de Seguimiento de Equipos (Equipos Favoritos)
 */
export const seguimientoEquiposService = {
  /**
   * Listar equipos favoritos del usuario
   * @param idEdicionCategoria - Opcional: Filtrar por edición-categoría específica
   */
  list: async (idEdicionCategoria?: number): Promise<ListSeguimientosResponse> => {
    const params = idEdicionCategoria ? { id_edicion_categoria: idEdicionCategoria } : {};
    const response = await apiClient.get('/seguimiento-equipos', { params });
    return response.data;
  },

  /**
   * Agregar equipo a favoritos
   */
  create: async (data: CreateSeguimientoRequest): Promise<CreateSeguimientoResponse> => {
    const response = await apiClient.post('/seguimiento-equipos', data);
    return response.data;
  },

  /**
   * Actualizar preferencias de notificaciones
   */
  updatePreferencias: async (
    id: number,
    data: UpdatePreferenciasRequest
  ): Promise<CreateSeguimientoResponse> => {
    const response = await apiClient.patch(`/seguimiento-equipos?id=${id}`, data);
    return response.data;
  },

  /**
   * Dejar de seguir un equipo
   */
  delete: async (id: number): Promise<DeleteSeguimientoResponse> => {
    const response = await apiClient.delete(`/seguimiento-equipos?id=${id}`);
    return response.data;
  },

  /**
   * Verificar si el usuario sigue a un equipo específico
   */
  isFollowing: async (idEquipo: number, idEdicionCategoria: number): Promise<boolean> => {
    try {
      const response = await apiClient.get('/seguimiento-equipos', {
        params: { id_edicion_categoria: idEdicionCategoria },
      });

      if (response.data.success && response.data.data?.equipos_favoritos) {
        return response.data.data.equipos_favoritos.some(
          (seg: any) => seg.equipo?.id_equipo === idEquipo
        );
      }
      return false;
    } catch (error) {
      return false;
    }
  },
};
