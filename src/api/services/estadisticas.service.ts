import { apiClient } from '../client/axiosClient';
import {
  EstadisticasEquiposGlobalResponse,
  EstadisticasEquiposGrupoResponse,
  GoleadoresResponse,
  AsistenciasResponse,
  TarjetasResponse,
  MVPResponse,
  DetalleJugadorResponse,
} from '../types/estadisticas.types';

/**
 * Servicio de Estadísticas
 */
export const estadisticasService = {
  /**
   * Obtener estadísticas globales de equipos por edición categoría
   */
  equiposGlobal: async (idEdicionCategoria: number): Promise<EstadisticasEquiposGlobalResponse> => {
    const response = await apiClient.get('/estadisticas-equipos-global', {
      params: { id_edicion_categoria: idEdicionCategoria },
    });
    return response.data;
  },

  /**
   * Obtener estadísticas de equipos por grupo
   */
  equiposGrupo: async (idGrupo: number): Promise<EstadisticasEquiposGrupoResponse> => {
    const response = await apiClient.get('/estadisticas-equipos-grupo', {
      params: { id_grupo: idGrupo },
    });
    return response.data;
  },

  /**
   * Obtener top goleadores
   */
  goleadores: async (idEdicionCategoria: number, limit: number = 10): Promise<GoleadoresResponse> => {
    const response = await apiClient.get('/estadisticas-jugadores-goleadores', {
      params: {
        id_edicion_categoria: idEdicionCategoria,
        limit,
      },
    });
    return response.data;
  },

  /**
   * Obtener top asistencias
   */
  asistencias: async (idEdicionCategoria: number, limit: number = 10): Promise<AsistenciasResponse> => {
    const response = await apiClient.get('/estadisticas-jugadores-asistencias', {
      params: {
        id_edicion_categoria: idEdicionCategoria,
        limit,
      },
    });
    return response.data;
  },

  /**
   * Obtener tabla de tarjetas
   */
  tarjetas: async (idEdicionCategoria: number): Promise<TarjetasResponse> => {
    const response = await apiClient.get('/estadisticas-jugadores-tarjetas', {
      params: { id_edicion_categoria: idEdicionCategoria },
    });
    return response.data;
  },

  /**
   * Obtener jugadores MVP
   */
  mvp: async (idEdicionCategoria: number, limit: number = 10): Promise<MVPResponse> => {
    const response = await apiClient.get('/estadisticas-jugadores-mvp', {
      params: {
        id_edicion_categoria: idEdicionCategoria,
        limit,
      },
    });
    return response.data;
  },

  /**
   * Obtener detalle de estadísticas de un jugador
   */
  detalleJugador: async (idJugador: number, idEdicionCategoria: number): Promise<DetalleJugadorResponse> => {
    const response = await apiClient.get('/estadisticas-jugadores-detalle', {
      params: {
        id_jugador: idJugador,
        id_edicion_categoria: idEdicionCategoria,
      },
    });
    return response.data;
  },

  // Legacy methods (mantener compatibilidad)
  goleadoresPorEdicion: async (edicion_id: number) => {
    const response = await apiClient.get('/estadisticas-goleadores-edicion', {
      params: { edicion_id },
    });
    return response.data;
  },
};
