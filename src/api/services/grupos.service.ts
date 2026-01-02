import { apiClient } from '../client/axiosClient';
import {
  CreateGrupoRequest,
  CreateGrupoResponse,
  CreateGruposRequest,
  CreateGruposResponse,
  GruposListResponse,
  GruposGetResponse,
  AsignarEquiposRequest,
  AsignarEquiposResponse,
  AssignTeamsRequest,
  AssignTeamsResponse,
  SorteoRequest,
  SorteoResponse,
  GenerarFixtureRequest,
  GenerarFixtureApiResponse,
  ClasificacionApiResponse,
  UpdateReglasRequest,
  UpdateReglasResponse,
  DeleteGrupoRequest,
  DeleteGrupoResponse,
} from '../types/grupos.types';

/**
 * Servicio de Grupos
 */
export const gruposService = {
  /**
   * Listar grupos por fase
   */
  list: async (idFase: number): Promise<GruposListResponse> => {
    const response = await apiClient.get('/grupos', {
      params: { id_fase: idFase, action: 'list' },
    });
    return response.data;
  },

  /**
   * Obtener información completa de grupos de una fase
   * Incluye: fase, configuración de clasificación, grupos con equipos, y resumen
   */
  get: async (idFase: number): Promise<GruposGetResponse> => {
    const response = await apiClient.get('/grupos', {
      params: { id_fase: idFase, action: 'get' },
    });
    return response.data;
  },

  /**
   * Crear un nuevo grupo (requiere autorización)
   */
  create: async (data: CreateGrupoRequest): Promise<CreateGrupoResponse> => {
    const response = await apiClient.post('/grupos', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  /**
   * Crear múltiples grupos en bulk (requiere autorización)
   */
  createBulk: async (data: CreateGruposRequest): Promise<CreateGruposResponse> => {
    const response = await apiClient.post('/grupos', data, {
      params: { action: 'create' } // router handles bulk if data is array or just loops
    });
    return response.data;
  },

  /**
   * Asignar equipos a un grupo (requiere autorización)
   */
  asignarEquipos: async (data: AsignarEquiposRequest): Promise<AsignarEquiposResponse> => {
    const response = await apiClient.post('/grupos', data, {
      params: { action: 'assign' }
    });
    return response.data;
  },

  /**
   * @deprecated Use asignarEquipos instead
   * Asignar equipos a un grupo (requiere autorización)
   */
  assignTeams: async (data: AssignTeamsRequest): Promise<AssignTeamsResponse> => {
    const response = await apiClient.post('/grupos', data, {
      params: { action: 'assign' }
    });
    return response.data;
  },

  /**
   * Actualizar reglas de clasificación de una fase (requiere autorización)
   */
  updateReglas: async (idFase: number, data: UpdateReglasRequest): Promise<UpdateReglasResponse> => {
    const response = await apiClient.put('/grupos', data, {
      params: { id_fase: idFase, action: 'update-reglas' },
    });
    return response.data;
  },

  /**
   * Eliminar un grupo (requiere autorización)
   * @param idGrupo - ID del grupo a eliminar
   * @param forceDelete - Si es true, elimina el grupo aunque tenga equipos asignados
   */
  delete: async (idGrupo: number, forceDelete: boolean = false): Promise<DeleteGrupoResponse> => {
    const response = await apiClient.delete('/grupos', {
      params: { id: idGrupo, force_delete: forceDelete, action: 'delete' },
    });
    return response.data;
  },
};
