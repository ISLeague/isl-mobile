/**
 * Equipo DTOs
 * ===========
 * Data Transfer Objects para equipos.
 */

// ============ REQUEST DTOs ============

export interface CreateEquipoRequestDTO {
  nombre: string;
  nombre_corto?: string;
  logo?: string;
  color_primario?: string;
  color_secundario?: string;
  id_edicion_categoria: number;
  nombre_delegado?: string;
  telefono_delegado?: string;
  email_delegado?: string;
}

export interface UpdateEquipoRequestDTO {
  nombre?: string;
  nombre_corto?: string;
  logo?: string;
  color_primario?: string;
  color_secundario?: string;
  nombre_delegado?: string;
  telefono_delegado?: string;
  email_delegado?: string;
  activo?: boolean;
}

export interface AsignarGrupoRequestDTO {
  id_equipo: number;
  id_grupo: number;
}

// ============ RESPONSE DTOs ============

export interface EquipoResponseDTO {
  id_equipo: number;
  nombre: string;
  nombre_corto: string | null;
  logo: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  edicion_categoria: {
    id_edicion_categoria: number;
    categoria_nombre: string;
    edicion_numero: number;
    torneo_nombre: string;
  };
  nombre_delegado: string | null;
  telefono_delegado: string | null;
  email_delegado: string | null;
  jugadores_count: number;
  activo: boolean;
  created_at: Date;
}

export interface EquipoListItemDTO {
  id_equipo: number;
  nombre: string;
  nombre_corto: string | null;
  logo: string | null;
  categoria_nombre: string;
  jugadores_count: number;
  activo: boolean;
}

export interface EquipoDetalleDTO {
  id_equipo: number;
  nombre: string;
  nombre_corto: string | null;
  logo: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  edicion_categoria: {
    id_edicion_categoria: number;
    categoria_nombre: string;
    edicion_numero: number;
    torneo_nombre: string;
  };
  delegado: {
    nombre: string | null;
    telefono: string | null;
    email: string | null;
  };
  jugadores: JugadorPlantillaDTO[];
  estadisticas: EquipoEstadisticasDTO;
  grupo?: {
    id_grupo: number;
    nombre: string;
  };
}

export interface JugadorPlantillaDTO {
  id_jugador: number;
  nombre_completo: string;
  numero_camiseta: number | null;
  posicion: string | null;
  foto: string | null;
  es_capitan: boolean;
  es_refuerzo: boolean;
  estado: string;
}

export interface EquipoEstadisticasDTO {
  partidos_jugados: number;
  partidos_ganados: number;
  partidos_empatados: number;
  partidos_perdidos: number;
  goles_favor: number;
  goles_contra: number;
  puntos: number;
  posicion_grupo?: number;
}
