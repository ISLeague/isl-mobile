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
  list: async (id_fase?: number) => {
    const response = await apiClient.get('/rondas', {
      params: { id_fase, action: 'list' }
    });
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/rondas', { params: { id, action: 'get' } });
    return response.data;
  },

  create: async (data: CreateRondaRequest) => {
    const response = await apiClient.post('/rondas', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  generarFixture: async (data: FixtureGenerateRequest): Promise<FixtureGenerateResponse> => {
    const response = await apiClient.post('/rondas', data, {
      params: { action: 'generar-fixtures' }
    });
    return response.data;
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

  update: async (data: UpdateRondaRequest) => {
    const response = await apiClient.patch('/rondas', data, {
      params: { action: 'update', id: data.id }
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/rondas', { params: { id, action: 'delete' } });
    return response.data;
  },
};
