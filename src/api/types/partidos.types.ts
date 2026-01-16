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

export interface EstadisticaJugador {
  id_jugador: number;
  id_equipo: number;
  goles: number;
  asistencias: number;
  tarjetas_amarillas: number;
  tarjetas_rojas: number;
  es_mvp: boolean;
}

export interface RegistrarResultadoRequest {
  id_partido: number;
  goles_local: number;
  goles_visitante: number;
  penales_local?: number;
  penales_visitante?: number;
  fue_a_penales?: boolean;
  walkover?: boolean;
  walkover_ganador?: 'local' | 'visitante' | null;
  estado: string;
  estadisticas_jugadores: EstadisticaJugador[];
}

export interface CreatePartidoAmistosoRequest {
  id_equipo_local: number;
  id_equipo_visitante: number;
  fecha_hora: string;
  id_local: number;
  id_cancha: number;
}

export interface CreatePartidoFromFixtureRequest {
  id_fixture: number;
  id_equipo_local: number;
  id_equipo_visitante: number;
  id_ronda: number;
  id_fase: number;
  id_cancha?: number | null;
  fecha?: string | null;
  hora?: string | null;
  tipo_partido: 'clasificacion' | 'eliminatoria' | 'amistoso';
  afecta_clasificacion: boolean;
  estado_partido?: string;
  observaciones?: string;
}

export interface CreatePartidoEliminatoriaRequest {
  id_eliminatoria: number;
  fecha?: string;
  hora?: string;
  id_cancha?: number;
  arbitro_principal?: string;
  observaciones?: string;
}

export interface Partido {
  id_partido: number;
  id_fixture?: number;
  id_equipo_local: number;
  id_equipo_visitante: number;
  id_ronda?: number;
  id_fase?: number;
  id_cancha?: number;
  id_eliminatoria?: number;
  tipo_partido?: 'clasificacion' | 'eliminatoria' | 'amistoso';
  afecta_clasificacion?: boolean;
  fecha_hora?: string;
  fecha?: string;
  hora?: string;
  estado?: EstadoPartido;
  estado_partido?: string;
  marcador_local?: number | null;
  marcador_visitante?: number | null;
  penales_local?: number | null;
  penales_visitante?: number | null;
  fue_a_penales?: boolean;
  wo?: boolean;
  wo_equipo_ganador?: number | null;
  wo_motivo?: string | null;
  arbitro_principal?: string;
  observaciones?: string | null;
  motivo_amistoso?: string | null;
  created_at?: string;
  updated_at?: string;
  // Objetos anidados de la API
  equipo_local?: {
    id_equipo: number;
    nombre: string;
    logo: string;
  };
  equipo_visitante?: {
    id_equipo: number;
    nombre: string;
    logo: string;
  };
  cancha?: {
    id_cancha: number;
    nombre: string;
  };
  ronda?: {
    id_ronda: number;
    nombre: string;
    tipo: 'fase_grupos' | 'amistosa' | 'eliminatorias';
  };
  eliminatoria?: {
    id_eliminatoria: number;
    ronda: string;
    numero_llave: number;
  };
  // Legacy support
  goles_local?: number;
  goles_visitante?: number;
  id_local?: number;
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
  id_cancha?: number;
}

export interface PartidoResultadoRequest {
  partido_id: number;
  goles_local: number;
  goles_visitante: number;
}

// Response types
export interface RegistrarResultadoResponse {
  success: boolean;
  message?: string;
  data: {
    id_partido: number;
    marcador_local: number;
    marcador_visitante: number;
    estado_partido: string;
  };
  timestamp: string;
}

export interface CreatePartidoAmistosoResponse {
  success: boolean;
  data: Partido;
  timestamp: string;
}

// ============================================
// 📅 PARTIDOS POR JORNADA (MAIN PAGE)
// ============================================

/**
 * Partido con información completa para visualización
 */
export interface PartidoDetallado {
  id_partido: number;
  fecha_hora: string;
  estado: EstadoPartido;

  // Equipo Local
  id_equipo_local: number;
  nombre_equipo_local: string;
  escudo_equipo_local?: string;
  goles_local?: number;

  // Equipo Visitante
  id_equipo_visitante: number;
  nombre_equipo_visitante: string;
  escudo_equipo_visitante?: string;
  goles_visitante?: number;

  // Penales (para eliminatorias)
  penales_local?: number;
  penales_visitante?: number;

  // Cancha y Local
  id_cancha?: number;
  nombre_cancha?: string;
  id_local?: number;
  nombre_local?: string;

  // Metadata
  created_at?: string;
  updated_at?: string;
}

/**
 * Jornada (Ronda) con sus partidos
 */
export interface JornadaConPartidos {
  id_ronda: number;
  nombre: string;
  tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce';
  fecha_inicio?: string;
  fecha_fin?: string;
  orden: number;

  // Partidos de esta jornada
  partidos: PartidoDetallado[];

  // Estadísticas
  total_partidos: number;
  partidos_finalizados: number;
  partidos_pendientes: number;
}

/**
 * Request para obtener partidos por jornada
 */
export interface GetPartidosPorJornadaRequest {
  id_edicion_categoria?: number; // Para obtener todas las jornadas de una edición
  id_fase?: number; // Para obtener jornadas de una fase específica
  id_ronda?: number; // Para obtener partidos de una ronda específica
  incluir_finalizados?: boolean; // Default: true
  incluir_pendientes?: boolean; // Default: true
}

/**
 * Response de partidos agrupados por jornada
 */
export interface PartidosPorJornadaResponse {
  success: boolean;
  data: {
    jornadas: JornadaConPartidos[];
    total_jornadas: number;
    total_partidos: number;
  };
  timestamp: string;
}

// ============================================
// 🏆 KNOCKOUT LIST
// ============================================

export interface ListKnockoutResponse {
  success: boolean;
  data: {
    total: number;
    partidos_por_etapa: {
      octavos: Partido[];
      cuartos: Partido[];
      semifinal: Partido[];
      final: Partido[];
    };
  };
  timestamp: string;
}
