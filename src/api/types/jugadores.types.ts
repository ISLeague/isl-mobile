// ============================================
// 👤 JUGADORES TYPES
// ============================================

export interface EstadisticasJugador {
  goles: number;
  asistencias: number;
  amarillas: number;
  rojas: number;
  partidos_jugados: number;
}

export interface Jugador {
  id_jugador: number;
  nombre_completo: string;
  dni: string;
  numero_camiseta?: number;
  fecha_nacimiento: string;
  posicion?: string;
  pie_dominante?: string;
  altura_cm?: number;
  peso_kg?: number;
  nacionalidad?: string;
  es_refuerzo?: boolean;
  es_capitan?: boolean;
  foto?: string | null;
  equipo_id?: number;
  id_equipo?: number;
  created_at?: string;
  updated_at?: string;
  estadisticas?: EstadisticasJugador;
}

export interface CreateJugadorRequest {
  id_equipo: number;
  nombre_completo: string;
  dni: string;
  fecha_nacimiento: string;
  numero_camiseta?: number;
  pie_dominante: string;
  es_refuerzo: boolean;
  es_capitan: boolean;
  foto?: string | null;
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

export interface JugadorDetalleData {
  jugador: Jugador;
  equipo: {
    id_equipo: number;
    nombre: string;
    logo?: string | null;
  };
  proximo_partido?: {
    id_partido: number;
    fecha: string;
    hora: string;
    rival: {
      nombre: string;
      logo?: string | null;
    };
    cancha: {
      nombre: string;
      direccion?: string;
    };
    local: boolean;
  } | null;
}

export interface JugadorDetalleResponse {
  success: boolean;
  data: JugadorDetalleData;
  timestamp: string;
}
