/**
 * Torneo DTOs
 * ===========
 * Data Transfer Objects para torneos, ediciones y categorías.
 */

// ============ TORNEO DTOs ============

export interface CreateTorneoRequestDTO {
  nombre: string;
  descripcion?: string;
  logo?: string;
  id_pais: number;
}

export interface UpdateTorneoRequestDTO {
  nombre?: string;
  descripcion?: string;
  logo?: string;
  activo?: boolean;
}

export interface TorneoResponseDTO {
  id_torneo: number;
  nombre: string;
  descripcion: string | null;
  logo: string | null;
  pais: {
    id_pais: number;
    nombre: string;
    emoji: string;
  };
  activo: boolean;
  ediciones_count: number;
  created_at: Date;
}

export interface TorneoListItemDTO {
  id_torneo: number;
  nombre: string;
  logo: string | null;
  pais_nombre: string;
  pais_emoji: string;
  edicion_actual?: {
    id_edicion: number;
    numero: number;
    estado: string;
  };
}

// ============ EDICION DTOs ============

export interface CreateEdicionRequestDTO {
  numero: number;
  nombre?: string;
  id_torneo: number;
  fecha_inicio?: Date;
  fecha_fin?: Date;
}

export interface UpdateEdicionRequestDTO {
  nombre?: string;
  estado?: 'abierto' | 'cerrado' | 'en juego';
  fecha_inicio?: Date;
  fecha_fin?: Date;
}

export interface EdicionResponseDTO {
  id_edicion: number;
  numero: number;
  nombre: string | null;
  estado: string;
  id_torneo: number;
  torneo_nombre: string;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  categorias: EdicionCategoriaResumenDTO[];
  created_at: Date;
}

export interface EdicionCategoriaResumenDTO {
  id_edicion_categoria: number;
  id_categoria: number;
  nombre_categoria: string;
  equipos_count: number;
}

// ============ CATEGORIA DTOs ============

export interface CreateCategoriaRequestDTO {
  nombre: string;
  descripcion?: string;
  tiene_restriccion_edad?: boolean;
  edad_minima?: number;
  edad_maxima?: number;
  permite_refuerzos?: boolean;
  max_refuerzos?: number;
}

export interface UpdateCategoriaRequestDTO {
  nombre?: string;
  descripcion?: string;
  tiene_restriccion_edad?: boolean;
  edad_minima?: number | null;
  edad_maxima?: number | null;
  permite_refuerzos?: boolean;
  max_refuerzos?: number | null;
  activo?: boolean;
}

export interface CategoriaResponseDTO {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  tiene_restriccion_edad: boolean;
  edad_minima: number | null;
  edad_maxima: number | null;
  permite_refuerzos: boolean;
  max_refuerzos: number | null;
  activo: boolean;
}

// ============ EDICION-CATEGORIA DTOs ============

export interface CreateEdicionCategoriaRequestDTO {
  id_edicion: number;
  id_categoria: number;
  max_equipos?: number;
  max_jugadores_por_equipo?: number;
  min_jugadores_por_equipo?: number;
  permite_refuerzos_override?: boolean;
  max_refuerzos_override?: number;
}

export interface UpdateEdicionCategoriaRequestDTO {
  max_equipos?: number | null;
  max_jugadores_por_equipo?: number | null;
  min_jugadores_por_equipo?: number | null;
  permite_refuerzos_override?: boolean | null;
  max_refuerzos_override?: number | null;
  activo?: boolean;
}

export interface EdicionCategoriaResponseDTO {
  id_edicion_categoria: number;
  edicion: {
    id_edicion: number;
    numero: number;
    nombre: string | null;
    estado: string;
  };
  categoria: {
    id_categoria: number;
    nombre: string;
  };
  max_equipos: number | null;
  max_jugadores_por_equipo: number | null;
  min_jugadores_por_equipo: number | null;
  permite_refuerzos: boolean;
  max_refuerzos: number | null;
  equipos_count: number;
  activo: boolean;
}
