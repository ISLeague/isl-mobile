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

export interface EstadisticasHistoricas {
  partidos_jugados: number;
  minutos_jugados: number;
  goles_totales: number;
  asistencias_totales: number;
  amarillas_totales: number;
  rojas_totales: number;
  dobles_amarillas: number;
  autogoles: number;
  penales_convertidos: number;
  penales_fallados: number;
  mvp_partidos: number;
  es_goleador: boolean;
  es_mejor_jugador: boolean;
  posicion_final_equipo: number | null;
  id_historial_jugador?: number;
  id_plantilla?: number;
  id_edicion_categoria?: number;
  id_equipo?: number;
  created_at?: string;
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
  id_plantilla: number;
  id_equipo?: number;
  nombre_completo: string;
  dni: string;
  fecha_nacimiento: string;
  edad?: number;
  numero_camiseta: number;
  pie_dominante: string;
  foto: string | null;
  activo_en_equipo: boolean;
  es_refuerzo: boolean;
  es_capitan: boolean;
  fecha_registro: string;
  equipo: {
    id_equipo: number;
    nombre: string;
    nombre_corto: string;
    logo: string | null;
  };
  estadisticas_historicas: EstadisticasHistoricas;
  created_at: string;
  updated_at: string;
}

export interface JugadorDetalleResponse {
  success: boolean;
  data: JugadorDetalleData;
  timestamp: string;
}
