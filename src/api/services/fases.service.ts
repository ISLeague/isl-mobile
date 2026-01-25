import { apiClient } from '../client/axiosClient';
import {
  CreateFaseRequest,
  CreateFaseResponse,
  FasesListResponse,
  AvanzarEquiposRequest,
  AvanzarEquiposApiResponse,
  GenerarEliminatoriasRequest,
  GenerarEliminatoriasApiResponse,
  ObtenerClasificadosApiResponse,
  TipoCopa,
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
   * Obtener fases de tipo grupo para una edición categoría
   */
  getFaseGrupos: async (idEdicionCategoria: number): Promise<FasesListResponse> => {
    console.log('🌐 [getFaseGrupos] Llamando a API con idEdicionCategoria:', idEdicionCategoria);
    const response = await apiClient.get('/fases', {
      params: { 
        action: 'get-fase-grupos', 
        id_edicion_categoria: idEdicionCategoria 
      },
    });
    console.log('✅ [getFaseGrupos] Respuesta recibida:', response.data);
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
      params: { 
        action: 'create',
        id_edicion_categoria: data.id_edicion_categoria 
      },
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

  /**
   * Obtener equipos clasificados según reglas
   * @param idEdicionCategoria - ID de la edición categoría
   * @param copa - Copa (oro, plata, bronce)
   */
  obtenerClasificados: async (
    idEdicionCategoria: number,
    copa?: TipoCopa
  ): Promise<ObtenerClasificadosApiResponse> => {
    const params: any = { id_edicion_categoria: idEdicionCategoria, action: 'obtener-clasificados' };
    if (copa) {
      params.copa = copa;
    }
    const response = await apiClient.get('/fases', { params });
    return response.data;
  },

  /**
   * Obtener o crear fase knockout para una copa específica
   */
  getOrCreateKnockout: async (
    idEdicionCategoria: number,
    copa: TipoCopa
  ): Promise<{
    success: boolean;
    data: {
      fase: any;
      created: boolean;
    };
    timestamp: string;
  }> => {
    const response = await apiClient.get('/fases', {
      params: {
        action: 'get-or-create-knockout',
        id_edicion_categoria: idEdicionCategoria,
        copa,
      },
    });
    return response.data;
  },
};
