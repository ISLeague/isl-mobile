// ============================================
// 📊 ESTADÍSTICAS TYPES
// ============================================

export interface EstadisticasEquipo {
  id_equipo: number;
  nombre_equipo: string;
  puntos: number;
  PJ: number;
  PG: number;
  PE: number;
  PP: number;
  GF: number;
  GC: number;
  DG: number;
}

export interface Goleador {
  id_jugador: number;
  nombre: string;
  equipo: string;
  goles: number;
  penales: number;
  asistencias: number;
  partidos_jugados: number;
}

export interface AsistenciaJugador {
  id_jugador: number;
  nombre: string;
  equipo: string;
  asistencias: number;
  goles: number;
  partidos_jugados: number;
}

export interface TarjetasJugador {
  id_jugador: number;
  nombre: string;
  equipo: string;
  amarillas: number;
  rojas: number;
  partidos_jugados: number;
}

export interface MVPJugador {
  id_jugador: number;
  nombre: string;
  equipo: string;
  goles: number;
  asistencias: number;
  amarillas: number;
  rojas: number;
  partidos_jugados: number;
  puntuacion_mvp: number;
}

export interface PartidoDetalle {
  fecha: string;
  rival: string;
  resultado: string;
  goles: number;
  asistencias: number;
  amarillas?: number;
  rojas?: number;
}

export interface DetalleJugador {
  jugador: {
    id_jugador: number;
    nombre: string;
    numero_camiseta: number;
    equipo: string;
  };
  estadisticas: {
    partidos_jugados: number;
    goles: number;
    penales: number;
    asistencias: number;
    amarillas: number;
    rojas: number;
    promedio_goles: number;
    efectividad: string;
  };
  historial_partidos: PartidoDetalle[];
}

// Response types
export interface EstadisticasEquiposGlobalResponse {
  success: boolean;
  data: {
    estadisticas: EstadisticasEquipo[];
  };
  timestamp: string;
}

export interface EstadisticasEquiposGrupoResponse {
  success: boolean;
  data: {
    id_grupo: number;
    nombre_grupo: string;
    estadisticas: EstadisticasEquipo[];
  };
  timestamp: string;
}

export interface GoleadoresResponse {
  success: boolean;
  data: {
    goleadores: Goleador[];
  };
  timestamp: string;
}

export interface AsistenciasResponse {
  success: boolean;
  data: {
    asistencias: AsistenciaJugador[];
  };
  timestamp: string;
}

export interface TarjetasResponse {
  success: boolean;
  data: {
    tarjetas: TarjetasJugador[];
  };
  timestamp: string;
}

export interface MVPResponse {
  success: boolean;
  data: {
    mvps: MVPJugador[];
  };
  timestamp: string;
}

export interface DetalleJugadorResponse {
  success: boolean;
  data: DetalleJugador;
  timestamp: string;
}
