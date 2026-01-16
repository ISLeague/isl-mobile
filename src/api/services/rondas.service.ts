import { apiClient } from '../client/axiosClient';
import {
  CreateRondaRequest,
  UpdateRondaRequest,
  FixtureGenerateRequest,
  FixtureGenerateResponse,
  FixturesSinPartidoResponse,
  CreateFixtureRequest,
  CreateFixtureResponse,
} from '../types/rondas.types';

export const rondasService = {
  list: async (params: {
    id_edicion_categoria?: number;
    id_fase?: number;
    tipo_ronda?: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  }) => {
    console.log("entrandooooo---")

    const response = await apiClient.get('/rondas', {
      params: {
        ...params,
        action: 'list'
      }
    });
     console.log("resonse ", response.data)
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/rondas', { params: { id, action: 'get' } });
    return response.data;
  },

  create: async (data: CreateRondaRequest) => {
    // console.log("intentando crear rondas " )
    const response = await apiClient.post('/rondas', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  generarFixture: async (data: FixtureGenerateRequest): Promise<FixtureGenerateResponse> => {
    console.log('🌐 [generarFixture] Enviando POST a /rondas con action=generar-fixtures');
    console.log('📋 [generarFixture] Datos enviados:', JSON.stringify(data, null, 2));
    
    try {
      const response = await apiClient.post('/rondas', data, {
        params: { action: 'generar-fixtures' }
      });
      console.log('✅ [generarFixture] Respuesta exitosa:', response.data);
      return response.data;
    } catch (error) {
      console.log('💥 [generarFixture] Error en la llamada:', error);
      throw error;
    }
  },

  fixturesSinPartido: async (id_ronda: number): Promise<FixturesSinPartidoResponse> => {
    const response = await apiClient.get('/rondas', {
      params: { id: id_ronda, action: 'fixtures-sin-partido' },
    });
    return response.data;
  },

  createFixture: async (data: CreateFixtureRequest): Promise<CreateFixtureResponse> => {
    const response = await apiClient.post('/rondas', data, {
      params: { action: 'create-fixture' }
    });
    return response.data;
  },

  update: async (id: number, data: UpdateRondaRequest) => {
    console.log('🔁 [rondasService.update] PATCH /rondas?id=', id, ' payload:', data);
    const response = await apiClient.patch('/rondas', data, {
      // Call the function directly with the id query param as requested
      params: { id }
    });
    console.log('✅ [rondasService.update] response:', response.data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/rondas', {
      params: { action: 'delete' },
      data: { id_ronda: id }
    });
    return response.data;
  },

  /**
   * Aplicar fecha a todos los partidos de una ronda
   */
  applyDateToMatches: async (id_ronda: number, fecha: string) => {
    const response = await apiClient.post('/rondas', {
      id_ronda,
      fecha,
    }, {
      params: { action: 'apply-date-to-matches' }
    });
    return response.data;
  },
};
