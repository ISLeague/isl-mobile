import { apiClient } from '../client/axiosClient';
import {
  CreateEquipoRequest,
  EquiposListResponse,
  CreateEquipoResponse,
  BulkCreateResponse,
  Equipo
} from '../types/equipos.types';

/**
 * Servicio de Equipos
 */
export const equiposService = {
  /**
   * Obtener un equipo por ID (sin autorización)
   */
  getById: async (idEquipo: number): Promise<{ data: Equipo }> => {
    const response = await apiClient.get('/equipos-get', {
      params: { id: idEquipo },
    });
    return response.data;
  },

  /**
   * Listar equipos por edición categoría (sin autorización)
   */
  list: async (idEdicionCategoria: number): Promise<EquiposListResponse> => {
    const response = await apiClient.get('/equipos-list', {
      params: { id_edicion_categoria: idEdicionCategoria },
    });
    return response.data;
  },

  /**
   * Crear un nuevo equipo (requiere autorización)
   */
  create: async (data: CreateEquipoRequest): Promise<CreateEquipoResponse> => {
    const response = await apiClient.post('/equipos-create', data);
    return response.data;
  },

  /**
   * Crear equipos masivamente desde CSV (requiere autorización)
   */
  createBulk: async (idEdicionCategoria: number, csvFile: File): Promise<BulkCreateResponse> => {
    const formData = new FormData();
    formData.append('csv', csvFile);

    const response = await apiClient.post(`/equipos-create-bulk/${idEdicionCategoria}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
