import { apiClient } from '../client/axiosClient';

// Types
export interface Minijuego {
  id: number;
  nombre_minijuego: string;
  imagen_url: string | null;
  description: string | null;
  activo: boolean;
}

export interface Sala {
  id: string;
  codigo_sala: string;
  id_minijuego: number;
  id_host: string;
  estado: 'esperando' | 'jugando' | 'finalizada';
  modo_juego: 'jugadores' | 'clubes' | 'mixto';
  ronda_actual: number;
  jugadores: SalaJugador[];
}

export interface SalaJugador {
  id: number;
  id_sala: string;
  id_usuario: string;
  nombre_display: string;
  foto_url: string | null;
  orden_llegada: number;
}

export interface MiCarta {
  es_impostor: boolean;
  ronda: number;
  contenido: {
    tipo: 'jugador' | 'club';
    nombre: string;
    imagen_url: string | null;
  } | null;
}

export const minigamesService = {
  /**
   * Lista todos los minijuegos disponibles
   */
  list: async (): Promise<Minijuego[]> => {
    const response = await apiClient.get('/minigames', {
      params: { action: 'list' }
    });
    return response.data.data;
  },

  /**
   * Crea una nueva sala
   */
  createSala: async (id_minijuego: number, modo_juego: 'jugadores' | 'clubes' | 'mixto' = 'jugadores'): Promise<{ id_sala: string; codigo_sala: string; modo_juego: string }> => {
    const response = await apiClient.post('/minigames', 
      { id_minijuego, modo_juego },
      { params: { action: 'create-sala' } }
    );
    return response.data.data;
  },

  /**
   * Unirse a una sala existente
   */
  joinSala: async (codigo_sala: string): Promise<{ id_sala: string; codigo_sala: string; modo_juego: string }> => {
    const response = await apiClient.post('/minigames',
      { codigo_sala },
      { params: { action: 'join-sala' } }
    );
    return response.data.data;
  },

  /**
   * Salir de una sala
   */
  leaveSala: async (id_sala: string): Promise<void> => {
    await apiClient.post('/minigames',
      { id_sala },
      { params: { action: 'leave-sala' } }
    );
  },

  /**
   * Obtener info de una sala
   */
  getSala: async (params: { id_sala?: string; codigo_sala?: string }): Promise<Sala> => {
    const response = await apiClient.get('/minigames', {
      params: { action: 'get-sala', ...params }
    });
    return response.data.data;
  },

  /**
   * Iniciar una nueva ronda (solo host)
   */
  startRound: async (id_sala: string): Promise<{ ronda: number; id_ronda: number }> => {
    const response = await apiClient.post('/minigames',
      { id_sala },
      { params: { action: 'start-round' } }
    );
    return response.data.data;
  },

  /**
   * Obtener mi carta de la ronda actual
   */
  getMyCard: async (id_sala: string): Promise<MiCarta> => {
    const response = await apiClient.get('/minigames', {
      params: { action: 'get-my-card', id_sala }
    });
    return response.data.data;
  },

  /**
   * Terminar partida (solo host)
   */
  endGame: async (id_sala: string): Promise<void> => {
    await apiClient.post('/minigames',
      { id_sala },
      { params: { action: 'end-game' } }
    );
  },
};
