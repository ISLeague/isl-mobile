import { apiClient } from '../client/axiosClient';
import { CreateJugadorRequest } from '../types/jugadores.types';

/**
 * Servicio de Jugadores
 */
export const jugadoresService = {
  /**
   * Listar todos los jugadores
   */
  list: async (idEquipo: number) => {
    const response = await apiClient.get('/jugadores-list', {
      params: { id_equipo: idEquipo },
    });
    return response.data;
  },

  

  /**
   * Obtener un jugador por ID
   */
  get: async (id: number) => {
    const response = await apiClient.get('/jugadores-get', {
      params: { id },
    });
    return response.data;
  },

  /**
   * Obtener un jugador por DNI
   */
  getByDNI: async (dni: string) => {
    const response = await apiClient.get('/jugadores-dni', {
      params: { dni },
    });
    return response.data;
  },

  /**
   * Obtener detalle completo de un jugador
   */
  detalle: async (id: number) => {
    const response = await apiClient.get('/jugadores-detalle', {
      params: { id },
    });
    return response.data;
  },

  /**
   * Crear un nuevo jugador
   */
  create: async (data: CreateJugadorRequest) => {
    const response = await apiClient.post('/jugadores-create', data);
    return response.data;
  },

  /**
   * Crear jugadores en masa desde CSV
   */
  createBulk: async (idEquipo: number, csvFile: any) => {
    const formData = new FormData();
    formData.append('csv', csvFile);

    const response = await apiClient.post(`/jugadores-create-bulk/${idEquipo}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
