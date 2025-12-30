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
  create: async (data: CreateFaseRequest): Promise<CreateFaseResponse> => {
    console.log('🔧 [FasesService.create] Endpoint: POST /fases-create');
    console.log('🔧 [FasesService.create] Full data:', JSON.stringify(data, null, 2));

    // Extraer id_edicion_categoria para enviarlo como query param
    const { id_edicion_categoria, ...bodyData } = data;

    console.log('🔧 [FasesService.create] Query params:', { id_edicion_categoria });
    console.log('🔧 [FasesService.create] Request body:', JSON.stringify(bodyData, null, 2));

    const response = await apiClient.post('/fases-create', bodyData, {
      params: { id_edicion_categoria },
    });

    console.log('🔧 [FasesService.create] Response status:', response.status);
    console.log('🔧 [FasesService.create] Response data:', JSON.stringify(response.data, null, 2));

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
