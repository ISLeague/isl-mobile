import { apiClient } from '../client/axiosClient';
import {
  CreateReglaClasificacionRequest,
  CreateReglaClasificacionResponse,
  ValidarReglasApiResponse,
  EquiposClasificadosApiResponse,
} from '../types/reglas-clasificacion.types';

/**
 * Servicio de Reglas de Clasificación
 */
export const reglasClasificacionService = {
  /**
   * Crear una nueva regla de clasificación (requiere autorización)
   */
  create: async (
    data: CreateReglaClasificacionRequest
  ): Promise<CreateReglaClasificacionResponse> => {
    const response = await apiClient.post('/reglas-clasificacion-create', data);
    return response.data;
  },

  /**
   * Validar reglas de clasificación de una fase
   */
  validar: async (idFase: number): Promise<ValidarReglasApiResponse> => {
    const response = await apiClient.get('/reglas-clasificacion-validar', {
      params: { id_fase: idFase },
    });
    return response.data;
  },

  /**
   * Obtener equipos clasificados según las reglas
   */
  getEquiposClasificados: async (idFase: number): Promise<EquiposClasificadosApiResponse> => {
    const response = await apiClient.get('/reglas-clasificacion-equipos-clasificados', {
      params: { id_fase: idFase },
    });
    return response.data;
  },
};
