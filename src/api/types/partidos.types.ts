// ============================================
// ⚽ PARTIDOS TYPES
// ============================================

export type TipoEvento = 'gol' | 'asistencia' | 'amarilla' | 'roja' | 'penal_gol' | 'penal_fallado';
export type EstadoPartido = 'pendiente' | 'en_curso' | 'finalizado' | 'suspendido' | 'cancelado';

export interface EventoPartido {
  tipo: TipoEvento;
  minuto: number;
  id_jugador: number;
  id_equipo: number;
  id_asistencia?: number;
}

export interface RegistrarResultadoRequest {
  id_partido: number;
  goles_local: number;
  goles_visitante: number;
  estado: EstadoPartido;
  eventos: EventoPartido[];
}

export interface CreatePartidoAmistosoRequest {
  id_equipo_local: number;
  id_equipo_visitante: number;
  fecha_hora: string;
  id_local: number;
  id_cancha: number;
}

export interface Partido {
  id_partido: number;
  id_equipo_local: number;
  id_equipo_visitante: number;
  fecha_hora: string;
  goles_local?: number;
  goles_visitante?: number;
  estado: EstadoPartido;
  id_local?: number;
  id_cancha?: number;
  created_at?: string;
  updated_at?: string;
}

// Legacy types (mantener compatibilidad)
export interface CreatePartidoRequest {
  equipo_local_id: number;
  equipo_visitante_id: number;
  fecha: string;
  local_id: number;
}

export interface UpdatePartidoRequest {
  id: number;
  fecha?: string;
}

export interface PartidoResultadoRequest {
  partido_id: number;
  goles_local: number;
  goles_visitante: number;
}

// Response types
export interface RegistrarResultadoResponse {
  success: boolean;
  data: {
    id_partido: number;
    goles_local: number;
    goles_visitante: number;
    estado: EstadoPartido;
    eventos_registrados: number;
  };
  timestamp: string;
}

export interface CreatePartidoAmistosoResponse {
  success: boolean;
  data: Partido;
  timestamp: string;
}
