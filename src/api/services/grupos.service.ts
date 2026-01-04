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
    // console.log("entrando a obtener grupos ", idFase)
    const response = await apiClient.get('/grupos', {
      params: { id_fase: idFase, action: 'list' },
    });
    // console.log("respuesta get grupos ", response)
    return response.data;
  },

  /**
   * Obtener información completa de un grupo específico con equipos y clasificación
   */
  getGrupo: async (idGrupo: number): Promise<any> => {
    const response = await apiClient.get('/grupos', {
      params: { id_grupo: idGrupo, action: 'get' },
    });
    return response.data;
  },

  /**
   * Obtener clasificación específica de un grupo
   * Usa vista vista_clasificacion_grupos
   */
  getClasificacion: async (idGrupo: number): Promise<any> => {
    const response = await apiClient.get('/grupos', {
      params: { id_grupo: idGrupo, action: 'clasificacion' },
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
      params: { action: 'bulk' }
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
    const response = await apiClient.patch('/grupos', data, {
      params: { id_fase: idFase, action: 'update-reglas' },
    });
    return response.data;
  },

  /**
   * Eliminar un grupo (requiere autorización)
   * @param idGrupo - ID del grupo a eliminar
   */
  delete: async (idGrupo: number): Promise<DeleteGrupoResponse> => {
    // console.log("eliminando... ", idGrupo)
    const response = await apiClient.delete('/grupos', {
      params: { id: idGrupo },
    });
    // console.log("respuestaaa ", response.data)
    return response.data;
  },
};
