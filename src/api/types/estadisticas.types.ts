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

// Estadísticas de equipo detalladas
export interface JugadorEstadisticas {
  id_plantilla: number;
  nombre: string;
  numero_camiseta: number | null;
  foto: string | null;
  pie_dominante: string;
  es_refuerzo: boolean;
  es_capitan: boolean;
  estadisticas: {
    goles: number;
    asistencias: number;
    mvps: number;
    tarjetas_amarillas: number;
    tarjetas_rojas: number;
    partidos_jugados: number;
    autogoles: number;
    penales_convertidos: number;
    penales_fallados: number;
    es_goleador: boolean;
    es_mejor_jugador: boolean;
  };
}

export interface EstadisticasDetalleEquipo {
  partidos_jugados: number;
  partidos_ganados: number;
  partidos_empatados: number;
  partidos_perdidos: number;
  goles_a_favor: number;
  goles_en_contra: number;
  tarjetas_amarillas: number;
  tarjetas_rojas: number;
  diferencia_goles?: number;
  puntos?: number;
  posicion?: number;
}

export interface DetalleEquipo {
  equipo: {
    id_equipo: number;
    nombre: string;
    nombre_corto: string;
    logo: string;
    edicion_categoria: {
      id_edicion_categoria: number;
      edicion: {
        id_edicion: number;
        nombre: string;
        numero: number;
      };
      categoria: {
        id_categoria: number;
        nombre: string;
      };
    };
  };
  estadisticas_equipo: EstadisticasDetalleEquipo;
  ultimos_5_partidos: string[];
  jugadores: JugadorEstadisticas[];
}

export interface DetalleEquipoResponse {
  success: boolean;
  data: DetalleEquipo;
  timestamp: string;
}
export interface GlobalStatsPlayer {
  posicion: number;
  id_plantilla: number;
  nombre: string;
  numero_camiseta: number | null;
  foto: string | null;
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string;
  };
  estadisticas: {
    goles: number;
    asistencias: number;
    mvps: number;
    tarjetas_amarillas: number;
    tarjetas_rojas: number;
    partidos_jugados: number;
  };
}

export interface GlobalStatsResponse {
  success: boolean;
  data: {
    edicion_categoria: {
      id_edicion_categoria: number;
      edicion: {
        id_edicion: number;
        nombre: string;
        numero: number;
      };
      categoria: {
        id_categoria: number;
        nombre: string;
      };
    };
    goleadores: GlobalStatsPlayer[];
    asistidores: GlobalStatsPlayer[];
    mvps: GlobalStatsPlayer[];
    tarjetas_rojas: GlobalStatsPlayer[];
    tarjetas_amarillas: GlobalStatsPlayer[];
  };
  timestamp: string;
}
