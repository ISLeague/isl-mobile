// ============================================
// 👤 JUGADORES TYPES
// ============================================

export interface Jugador {
  id_jugador: number;
  nombre_completo: string;
  dni: string;
  numero_camiseta: number;
  fecha_nacimiento: string;
  es_refuerzo?: boolean;
  equipo_id?: number;
  id_equipo?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateJugadorRequest {
  nombre: string;
  dni: string;
  equipo_id: number;
}

// Response types
export interface JugadorResponse {
  success: boolean;
  data: Jugador;
  timestamp: string;
}

export interface JugadoresListResponse {
  success: boolean;
  data: Jugador[];
  timestamp: string;
}
