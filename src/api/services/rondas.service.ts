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
    const response = await apiClient.get('/rondas-list', {
      params: id_fase ? { id_fase } : undefined
    });
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/rondas-get', { params: { id } });
    return response.data;
  },

  create: async (data: CreateRondaRequest) => {
    const response = await apiClient.post('/rondas-create', data);
    return response.data;
  },

  generarFixture: async (data: FixtureGenerateRequest): Promise<FixtureGenerateResponse> => {
    const response = await apiClient.post('/rondas-generar-fixtures', data);
    return response.data;
  },

  fixturesSinPartido: async (id_ronda: number): Promise<FixturesSinPartidoResponse> => {
    const response = await apiClient.get('/rondas-fixtures-sin-partido', {
      params: { id_ronda },
    });
    return response.data;
  },

  createFixture: async (data: CreateFixtureRequest): Promise<CreateFixtureResponse> => {
    const response = await apiClient.post('/rondas-create-fixture', data);
    return response.data;
  },

  update: async (data: UpdateRondaRequest) => {
    const response = await apiClient.put('/rondas-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/rondas-delete', { params: { id } });
    return response.data;
  },
};
