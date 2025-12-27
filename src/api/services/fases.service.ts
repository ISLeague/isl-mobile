import { apiClient } from '../client/axiosClient';
import {
  CreateFaseRequest,
  CreateFaseResponse,
  FasesListResponse,
  AvanzarEquiposRequest,
  AvanzarEquiposApiResponse,
  GenerarEliminatoriasRequest,
  GenerarEliminatoriasApiResponse,
} from '../types/fases.types';

/**
 * Servicio de Fases
 */
export const fasesService = {
  /**
   * Listar fases por edición categoría
   */
  list: async (idEdicionCategoria: number): Promise<FasesListResponse> => {
    const response = await apiClient.get('/fases-list', {
      params: { id_edicion_categoria: idEdicionCategoria },
    });
    return response.data;
  },

  /**
   * Obtener una fase por ID
   */
  get: async (id: number): Promise<{ success: boolean; data: any; timestamp: string }> => {
    const response = await apiClient.get('/fases-get', { params: { id } });
    return response.data;
  },

  /**
   * Crear una nueva fase (requiere autorización)
   */
  create: async (
    idEdicionCategoria: number,
    data: CreateFaseRequest
  ): Promise<CreateFaseResponse> => {
    const response = await apiClient.post('/fases-create', data, {
      params: { id_edicion_categoria: idEdicionCategoria },
    });
    return response.data;
  },

  /**
   * Avanzar equipos a siguiente fase según reglas de clasificación
   */
  avanzarEquipos: async (data: AvanzarEquiposRequest): Promise<AvanzarEquiposApiResponse> => {
    const response = await apiClient.post('/fases-avanzar-equipos', data);
    return response.data;
  },

  /**
   * Generar eliminatorias para una fase tipo knockout
   */
  generarEliminatorias: async (
    data: GenerarEliminatoriasRequest
  ): Promise<GenerarEliminatoriasApiResponse> => {
    const response = await apiClient.post('/fases-generar-eliminatorias', data);
    return response.data;
  },
};
