import { apiClient } from '../client/axiosClient';
import { CreateJugadorRequest } from '../types/jugadores.types';

/**
 * Servicio de Jugadores
 */
export const jugadoresService = {
  /**
   * Listar todos los jugadores
   */
  list: async () => {
    const response = await apiClient.get('/jugadores-list');
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
};
