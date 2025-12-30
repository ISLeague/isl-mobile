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
    const response = await apiClient.get('/grupos-list', {
      params: { id_fase: idFase },
    });
    return response.data;
  },

  /**
   * Obtener información completa de grupos de una fase
   * Incluye: fase, configuración de clasificación, grupos con equipos, y resumen
   */
  get: async (idFase: number): Promise<GruposGetResponse> => {
    const response = await apiClient.get('/grupos-get', {
      params: { id_fase: idFase },
    });
    return response.data;
  },

  /**
   * Crear un nuevo grupo (requiere autorización)
   */
  create: async (data: CreateGrupoRequest): Promise<CreateGrupoResponse> => {
    console.log('🔧 [GruposService.create] Endpoint: POST /grupos-create');
    console.log('🔧 [GruposService.create] Request data:', JSON.stringify(data, null, 2));

    const response = await apiClient.post('/grupos-create', data);

    console.log('🔧 [GruposService.create] Response status:', response.status);
    console.log('🔧 [GruposService.create] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  },

  /**
   * Crear múltiples grupos en bulk (requiere autorización)
   */
  createBulk: async (data: CreateGruposRequest): Promise<CreateGruposResponse> => {
    console.log('🔧 [GruposService.createBulk] Endpoint: POST /grupos-create-bulk');
    console.log('🔧 [GruposService.createBulk] Request data:', JSON.stringify(data, null, 2));

    const response = await apiClient.post('/grupos-create-bulk', data);

    console.log('🔧 [GruposService.createBulk] Response status:', response.status);
    console.log('🔧 [GruposService.createBulk] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  },

  /**
   * Asignar equipos a un grupo (requiere autorización)
   */
  asignarEquipos: async (data: AsignarEquiposRequest): Promise<AsignarEquiposResponse> => {
    console.log('🔧 [GruposService.asignarEquipos] Endpoint: POST /grupos-asignar');
    console.log('🔧 [GruposService.asignarEquipos] Request data:', JSON.stringify(data, null, 2));

    const response = await apiClient.post('/grupos-asignar', data);

    console.log('🔧 [GruposService.asignarEquipos] Response status:', response.status);
    console.log('🔧 [GruposService.asignarEquipos] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  },

  /**
   * @deprecated Use asignarEquipos instead
   * Asignar equipos a un grupo (requiere autorización)
   */
  assignTeams: async (data: AssignTeamsRequest): Promise<AssignTeamsResponse> => {
    const response = await apiClient.post('/grupos-assign-teams', data);
    return response.data;
  },





  /**
   * Actualizar reglas de clasificación de una fase (requiere autorización)
   */
  updateReglas: async (idFase: number, data: UpdateReglasRequest): Promise<UpdateReglasResponse> => {
    console.log('🔧 [GruposService.updateReglas] Endpoint: PUT /grupos-update-reglas');
    console.log('🔧 [GruposService.updateReglas] idFase:', idFase);
    console.log('🔧 [GruposService.updateReglas] Request data:', JSON.stringify(data, null, 2));

    const response = await apiClient.put('/grupos-update-reglas', data, {
      params: { id_fase: idFase },
    });

    console.log('🔧 [GruposService.updateReglas] Response status:', response.status);
    console.log('🔧 [GruposService.updateReglas] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  },

  /**
   * Eliminar un grupo (requiere autorización)
   * @param idGrupo - ID del grupo a eliminar
   * @param forceDelete - Si es true, elimina el grupo aunque tenga equipos asignados
   */
  delete: async (idGrupo: number, forceDelete: boolean = false): Promise<DeleteGrupoResponse> => {
    console.log('🔧 [GruposService.delete] Endpoint: DELETE /grupos-delete');
    console.log('🔧 [GruposService.delete] idGrupo:', idGrupo);
    console.log('🔧 [GruposService.delete] forceDelete:', forceDelete);

    const requestData: DeleteGrupoRequest = forceDelete ? { force_delete: true } : {};

    const response = await apiClient.delete('/grupos-delete', {
      params: { id_grupo: idGrupo },
      data: requestData,
    });

    console.log('🔧 [GruposService.delete] Response status:', response.status);
    console.log('🔧 [GruposService.delete] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  },
};
