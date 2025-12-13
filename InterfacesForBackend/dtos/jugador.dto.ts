/**
 * Jugador DTOs
 * ============
 * Data Transfer Objects para jugadores y plantillas.
 */

// ============ REQUEST DTOs ============

export interface CreateJugadorRequestDTO {
  nombre_completo: string;
  dni: string;
  fecha_nacimiento: Date;
  numero_camiseta?: number;
  posicion?: string;
  pie_dominante?: 'izquierdo' | 'derecho' | 'ambidiestro';
  foto?: string;
  altura_cm?: number;
  peso_kg?: number;
  nacionalidad?: string;
  id_usuario?: number; // Si tiene cuenta en la app
}

export interface UpdateJugadorRequestDTO {
  nombre_completo?: string;
  numero_camiseta?: number | null;
  posicion?: string | null;
  pie_dominante?: 'izquierdo' | 'derecho' | 'ambidiestro' | null;
  foto?: string | null;
  estado?: 'activo' | 'inactivo' | 'suspendido' | 'lesionado';
  altura_cm?: number | null;
  peso_kg?: number | null;
  nacionalidad?: string | null;
}

export interface AgregarJugadorPlantillaRequestDTO {
  id_jugador: number;
  id_equipo: number;
  numero_camiseta?: number;
  es_refuerzo?: boolean;
  es_capitan?: boolean;
}

export interface ActualizarPlantillaRequestDTO {
  numero_camiseta?: number | null;
  es_refuerzo?: boolean;
  es_capitan?: boolean;
  activo_en_equipo?: boolean;
  motivo_baja?: string;
}

// ============ RESPONSE DTOs ============

export interface JugadorResponseDTO {
  id_jugador: number;
  nombre_completo: string;
  dni: string;
  fecha_nacimiento: Date;
  edad: number; // Calculado
  numero_camiseta: number | null;
  posicion: string | null;
  pie_dominante: string | null;
  foto: string | null;
  estado: string;
  altura_cm: number | null;
  peso_kg: number | null;
  nacionalidad: string | null;
  equipo_actual?: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  created_at: Date;
}

export interface JugadorDetalleDTO {
  id_jugador: number;
  nombre_completo: string;
  dni: string;
  fecha_nacimiento: Date;
  edad: number;
  numero_camiseta: number | null;
  posicion: string | null;
  pie_dominante: string | null;
  foto: string | null;
  estado: string;
  altura_cm: number | null;
  peso_kg: number | null;
  nacionalidad: string | null;
  equipo_actual?: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
    categoria: string;
    es_capitan: boolean;
    es_refuerzo: boolean;
  };
  estadisticas_edicion: JugadorEstadisticasDTO;
  historial_equipos: HistorialEquipoJugadorDTO[];
}

export interface JugadorEstadisticasDTO {
  partidos_jugados: number;
  minutos_jugados: number;
  goles: number;
  asistencias: number;
  amarillas: number;
  rojas: number;
  mvp_partidos: number;
}

export interface HistorialEquipoJugadorDTO {
  id_equipo: number;
  nombre_equipo: string;
  logo: string | null;
  edicion: number;
  torneo: string;
  partidos: number;
  goles: number;
}

export interface JugadorListItemDTO {
  id_jugador: number;
  nombre_completo: string;
  numero_camiseta: number | null;
  posicion: string | null;
  foto: string | null;
  equipo: string | null;
  estado: string;
}
