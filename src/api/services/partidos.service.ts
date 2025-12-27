import { apiClient } from '../client/axiosClient';
import {
  CreatePartidoRequest,
  UpdatePartidoRequest,
  PartidoResultadoRequest,
  RegistrarResultadoRequest,
  RegistrarResultadoResponse,
  CreatePartidoAmistosoRequest,
  CreatePartidoAmistosoResponse,
} from '../types/partidos.types';

/**
 * Servicio de Partidos
 */
export const partidosService = {
  /**
   * Listar todos los partidos
   */
  list: async () => {
    const response = await apiClient.get('/partidos-list');
    return response.data;
  },

  /**
   * Obtener un partido por ID
   */
  get: async (id: number) => {
    const response = await apiClient.get('/partidos-get', {
      params: { id },
    });
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
};
