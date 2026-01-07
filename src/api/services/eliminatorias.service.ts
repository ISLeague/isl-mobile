import { apiClient } from '../client/axiosClient';
import {
  CreateLlaveRequest,
  CreateLlaveApiResponse,
  ActualizarGanadorRequest,
  ActualizarGanadorApiResponse,
  LlavesListParams,
  LlavesListApiResponse,
  CampeonesApiResponse,
} from '../types/eliminatorias.types';

/**
 * Servicio de Eliminatorias
 */
export const eliminatoriasService = {
  /**
   * Crear una nueva llave de eliminatorias
   */
  createLlave: async (data: CreateLlaveRequest): Promise<CreateLlaveApiResponse> => {
    const response = await apiClient.post('/eliminatorias', data, {
      params: { action: 'create-llave' }
    });
    return response.data;
  },

  /**
   * Actualizar el ganador de una llave
   */
  actualizarGanador: async (
    id: number,
    data: ActualizarGanadorRequest
  ): Promise<ActualizarGanadorApiResponse> => {
    const response = await apiClient.patch('/eliminatorias', data, {
      params: { action: 'actualizar-ganador', id }
    });
    return response.data;
  },

  /**
   * Listar llaves de una fase
   */
  list: async (params: LlavesListParams): Promise<LlavesListApiResponse> => {
    const queryParams: any = {
      action: 'list',
      id_fase: params.id_fase
    };

    if (params.ronda) {
      queryParams.ronda = params.ronda;
    }

    if (params.estado) {
      queryParams.estado = params.estado;
    }

    const response = await apiClient.get('/eliminatorias', {
      params: queryParams
    });
    return response.data;
  },

  /**
   * Obtener campeones de todas las copas
   */
  getCampeones: async (idEdicionCategoria: number): Promise<CampeonesApiResponse> => {
    const response = await apiClient.get('/eliminatorias', {
      params: {
        action: 'campeones',
        id_edicion_categoria: idEdicionCategoria
      }
    });
    return response.data;
  },
};
