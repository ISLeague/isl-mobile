import { apiClient } from '../client/axiosClient';
import {
  CreateGrupoRequest,
  CreateGrupoResponse,
  GruposListResponse,
  AssignTeamsRequest,
  AssignTeamsResponse,
  SorteoRequest,
  SorteoResponse,
  GenerarFixtureRequest,
  GenerarFixtureApiResponse,
  ClasificacionApiResponse,
} from '../types/grupos.types';

/**
 * Servicio de Grupos
 */
export const gruposService = {
  /**
   * Listar grupos por fase
   */
  list: async (idFase: number): Promise<GruposListResponse> => {
    const response = await apiClient.get('/grupos-list', {
      params: { id_fase: idFase },
    });
    return response.data;
  },

  /**
   * Crear un nuevo grupo (requiere autorización)
   */
  create: async (data: CreateGrupoRequest): Promise<CreateGrupoResponse> => {
    const response = await apiClient.post('/grupos-create', data);
    return response.data;
  },

  /**
   * Asignar equipos a un grupo (requiere autorización)
   */
  assignTeams: async (data: AssignTeamsRequest): Promise<AssignTeamsResponse> => {
    const response = await apiClient.post('/grupos-assign-teams', data);
    return response.data;
  },

  /**
   * Sorteo automático de equipos en grupos (requiere autorización)
   */
  sorteo: async (data: SorteoRequest): Promise<SorteoResponse> => {
    const response = await apiClient.post('/grupos-sorteo', data);
    return response.data;
  },

  /**
   * Generar fixture automático para un grupo (requiere autorización)
   */
  generarFixture: async (data: GenerarFixtureRequest): Promise<GenerarFixtureApiResponse> => {
    const response = await apiClient.post('/grupos-generar-fixture', data);
    return response.data;
  },

  /**
   * Obtener clasificación de un grupo
   */
  clasificacion: async (idGrupo: number): Promise<ClasificacionApiResponse> => {
    const response = await apiClient.get('/grupos-clasificacion', {
      params: { id_grupo: idGrupo },
    });
    return response.data;
  },
};
