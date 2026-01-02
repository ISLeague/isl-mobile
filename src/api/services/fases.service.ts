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
    const response = await apiClient.get('/fases', {
      params: { id_edicion_categoria: idEdicionCategoria, action: 'list' },
    });
    return response.data;
  },

  /**
   * Obtener una fase por ID
   */
  get: async (id: number): Promise<{ success: boolean; data: any; timestamp: string }> => {
    const response = await apiClient.get('/fases', { params: { id, action: 'get' } });
    return response.data;
  },

  /**
   * Crear una nueva fase (requiere autorización)
   */
  create: async (data: CreateFaseRequest): Promise<CreateFaseResponse> => {
    const response = await apiClient.post('/fases', data, {
      params: { action: 'create' },
    });
    return response.data;
  },

  /**
   * Avanzar equipos a siguiente fase según reglas de clasificación
   */
  avanzarEquipos: async (data: AvanzarEquiposRequest): Promise<AvanzarEquiposApiResponse> => {
    const response = await apiClient.post('/fases', data, {
      params: { action: 'avanzar-equipos' }
    });
    return response.data;
  },

  /**
   * Generar eliminatorias para una fase tipo knockout
   */
  generarEliminatorias: async (
    data: GenerarEliminatoriasRequest
  ): Promise<GenerarEliminatoriasApiResponse> => {
    const response = await apiClient.post('/fases', data, {
      params: { action: 'generar-eliminatorias' }
    });
    return response.data;
  },
};
