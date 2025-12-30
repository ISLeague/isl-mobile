import { apiClient } from '../client/axiosClient';
import {
  CreatePartidoRequest,
  UpdatePartidoRequest,
  PartidoResultadoRequest,
  RegistrarResultadoRequest,
  RegistrarResultadoResponse,
  CreatePartidoAmistosoRequest,
  CreatePartidoAmistosoResponse,
  GetPartidosPorJornadaRequest,
  PartidosPorJornadaResponse,
  CreatePartidoFromFixtureRequest,
} from '../types/partidos.types';

/**
 * Servicio de Partidos
 */
export const partidosService = {
  /**
   * Listar todos los partidos
   */
  list: async (id_ronda?: number) => {
    const response = await apiClient.get('/partidos-list', {
      params: id_ronda ? { id_ronda } : undefined,
    });
    return response.data;
  },

  /**
   * Obtener un partido por ID
   */
  get: async (id: number) => {
    const response = await apiClient.get(`/partidos-get/${id}`);
    return response.data;
  },

  /**
   * Obtener resultado completo de un partido con estadísticas
   */
  getResultado: async (id: number) => {
    const response = await apiClient.get(`/partidos-resultado/${id}`);
    return response.data;
  },

  /**
   * Obtener detalle completo de un partido
   */
  detalle: async (id: number) => {
    const response = await apiClient.get('/partidos-detalle', {
      params: { id },
    });
    return response.data;
  },

  /**
   * Crear un nuevo partido
   */
  create: async (data: CreatePartidoRequest) => {
    const response = await apiClient.post('/partidos-create', data);
    return response.data;
  },

  /**
   * Actualizar un partido
   */
  update: async (data: UpdatePartidoRequest) => {
    const response = await apiClient.put('/partidos-update', data);
    return response.data;
  },

  /**
   * Registrar resultado de un partido (legacy)
   */
  resultado: async (data: PartidoResultadoRequest) => {
    const response = await apiClient.post('/partidos-resultado', data);
    return response.data;
  },

  /**
   * Registrar resultado completo de un partido con eventos (requiere autorización)
   */
  registrarResultado: async (
    data: RegistrarResultadoRequest
  ): Promise<RegistrarResultadoResponse> => {
    const response = await apiClient.post('/partidos-resultado', data);
    return response.data;
  },

  /**
   * Crear partido amistoso (requiere autorización)
   */
  createAmistoso: async (
    data: CreatePartidoAmistosoRequest
  ): Promise<CreatePartidoAmistosoResponse> => {
    const response = await apiClient.post('/partidos-create-amistoso', data);
    return response.data;
  },

  /**
   * Obtener partidos agrupados por jornada (para página principal)
   * @param params - Filtros opcionales para obtener partidos
   * @returns Partidos agrupados por jornada con información completa
   */
  getPartidosPorJornada: async (
    params?: GetPartidosPorJornadaRequest
  ): Promise<PartidosPorJornadaResponse> => {
    const response = await apiClient.get('/partidos-por-jornada', { params });
    return response.data;
  },

  /**
   * Crear partido desde fixture generado (requiere autorización)
   */
  createFromFixture: async (data: CreatePartidoFromFixtureRequest) => {
    const response = await apiClient.post('/partidos-create', data);
    return response.data;
  },
};
