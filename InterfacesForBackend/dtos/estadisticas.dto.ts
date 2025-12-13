/**
 * Estadisticas DTOs
 * =================
 * Data Transfer Objects para estadísticas y rankings.
 */

// ============ TABLA DE GOLEADORES ============

export interface GoleadorDTO {
  posicion: number;
  jugador: {
    id_jugador: number;
    nombre_completo: string;
    foto: string | null;
  };
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  goles: number;
  penales: number;
  partidos_jugados: number;
  promedio_goles: number; // goles / partidos
}

export interface TablaGoleadoresResponseDTO {
  edicion: {
    id_edicion: number;
    numero: number;
    torneo: string;
  };
  categoria?: {
    id_categoria: number;
    nombre: string;
  };
  goleadores: GoleadorDTO[];
  actualizado_en: Date;
}

// ============ TABLA DE ASISTENCIAS ============

export interface AsistidorDTO {
  posicion: number;
  jugador: {
    id_jugador: number;
    nombre_completo: string;
    foto: string | null;
  };
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  asistencias: number;
  partidos_jugados: number;
}

export interface TablaAsistenciasResponseDTO {
  edicion: {
    id_edicion: number;
    numero: number;
    torneo: string;
  };
  asistidores: AsistidorDTO[];
  actualizado_en: Date;
}

// ============ TABLA DE TARJETAS ============

export interface TarjetasJugadorDTO {
  posicion: number;
  jugador: {
    id_jugador: number;
    nombre_completo: string;
    foto: string | null;
  };
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  amarillas: number;
  rojas: number;
  dobles_amarillas: number;
  total_puntos_tarjetas: number; // amarillas*1 + rojas*3
}

export interface TablaTarjetasResponseDTO {
  edicion: {
    id_edicion: number;
    numero: number;
  };
  jugadores: TarjetasJugadorDTO[];
}

// ============ FAIR PLAY ============

export interface FairPlayEquipoDTO {
  posicion: number;
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  amarillas: number;
  rojas: number;
  puntos_fair_play: number; // Menor es mejor
  partidos_jugados: number;
}

export interface TablaFairPlayResponseDTO {
  edicion: {
    id_edicion: number;
    numero: number;
  };
  equipos: FairPlayEquipoDTO[];
}

// ============ MVP Y RECONOCIMIENTOS ============

export interface MVPJugadorDTO {
  jugador: {
    id_jugador: number;
    nombre_completo: string;
    foto: string | null;
  };
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  veces_mvp: number;
}

export interface TablaMVPResponseDTO {
  edicion: {
    id_edicion: number;
    numero: number;
  };
  jugadores: MVPJugadorDTO[];
}

// ============ ESTADÍSTICAS GENERALES ============

export interface EstadisticasEdicionDTO {
  id_edicion: number;
  numero: number;
  torneo: string;
  total_equipos: number;
  total_jugadores: number;
  total_partidos: number;
  partidos_jugados: number;
  partidos_pendientes: number;
  total_goles: number;
  promedio_goles_partido: number;
  total_amarillas: number;
  total_rojas: number;
  equipo_mas_goleador?: {
    id_equipo: number;
    nombre: string;
    goles: number;
  };
  equipo_menos_goleado?: {
    id_equipo: number;
    nombre: string;
    goles_contra: number;
  };
  partido_con_mas_goles?: {
    id_partido: number;
    equipos: string;
    goles: number;
  };
  goleador?: GoleadorDTO;
}

// ============ HISTORIAL ============

export interface HistorialTorneoDTO {
  id_torneo: number;
  nombre: string;
  ediciones: HistorialEdicionDTO[];
}

export interface HistorialEdicionDTO {
  id_edicion: number;
  numero: number;
  campeon?: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  subcampeon?: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  goleador?: {
    id_jugador: number;
    nombre_completo: string;
    goles: number;
    equipo: string;
  };
  mvp?: {
    id_jugador: number;
    nombre_completo: string;
    equipo: string;
  };
}
