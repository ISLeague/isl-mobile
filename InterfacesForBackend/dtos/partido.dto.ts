/**
 * Partido DTOs
 * ============
 * Data Transfer Objects para partidos, fases y rondas.
 */

// ============ FASE DTOs ============

export interface CreateFaseRequestDTO {
  nombre: string;
  tipo: 'grupo' | 'knockout';
  copa?: 'general' | 'oro' | 'plata' | 'bronce';
  orden: number;
  id_edicion_categoria: number;
  partidos_ida_vuelta?: boolean;
  permite_empate?: boolean;
  permite_penales?: boolean;
}

export interface UpdateFaseRequestDTO {
  nombre?: string;
  orden?: number;
  partidos_ida_vuelta?: boolean;
  permite_empate?: boolean;
  permite_penales?: boolean;
  activo?: boolean;
}

export interface FaseResponseDTO {
  id_fase: number;
  nombre: string;
  tipo: string;
  copa: string | null;
  orden: number;
  partidos_ida_vuelta: boolean;
  permite_empate: boolean;
  permite_penales: boolean;
  grupos?: GrupoResumenDTO[];
  rondas_count: number;
  activo: boolean;
}

// ============ GRUPO DTOs ============

export interface CreateGrupoRequestDTO {
  nombre: string;
  id_fase: number;
  cantidad_equipos?: number;
  equipos_pasan_oro?: number;
  equipos_pasan_plata?: number;
  equipos_pasan_bronce?: number;
}

export interface UpdateGrupoRequestDTO {
  nombre?: string;
  cantidad_equipos?: number;
  equipos_pasan_oro?: number;
  equipos_pasan_plata?: number;
  equipos_pasan_bronce?: number;
  activo?: boolean;
}

export interface GrupoResumenDTO {
  id_grupo: number;
  nombre: string;
  equipos_count: number;
}

export interface GrupoDetalleDTO {
  id_grupo: number;
  nombre: string;
  fase: {
    id_fase: number;
    nombre: string;
  };
  equipos: EquipoGrupoDTO[];
  clasificacion: ClasificacionDTO[];
  config_avance: {
    equipos_pasan_oro: number;
    equipos_pasan_plata: number;
    equipos_pasan_bronce: number;
  };
}

export interface EquipoGrupoDTO {
  id_equipo: number;
  nombre: string;
  logo: string | null;
}

export interface ClasificacionDTO {
  posicion: number;
  equipo: {
    id_equipo: number;
    nombre: string;
    nombre_corto: string | null;
    logo: string | null;
  };
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  puntos: number;
  destino?: 'copa_oro' | 'copa_plata' | 'copa_bronce' | 'eliminado';
}

// ============ RONDA DTOs ============

export interface CreateRondaRequestDTO {
  nombre: string;
  id_fase: number;
  tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce';
  es_amistosa?: boolean;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  orden: number;
}

export interface UpdateRondaRequestDTO {
  nombre?: string;
  fecha_inicio?: Date | null;
  fecha_fin?: Date | null;
  orden?: number;
  activo?: boolean;
}

export interface RondaResponseDTO {
  id_ronda: number;
  nombre: string;
  tipo: string;
  subtipo_eliminatoria: string | null;
  es_amistosa: boolean;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  orden: number;
  partidos_count: number;
  partidos_jugados: number;
}

// ============ PARTIDO DTOs ============

export interface CreatePartidoRequestDTO {
  id_equipo_local: number;
  id_equipo_visitante: number;
  id_ronda: number;
  id_fase: number;
  id_cancha?: number;
  fecha?: Date;
  hora?: string;
}

export interface UpdatePartidoRequestDTO {
  id_cancha?: number | null;
  fecha?: Date | null;
  hora?: string | null;
  estado_partido?: 'Pendiente' | 'En curso' | 'Finalizado' | 'Suspendido' | 'Aplazado' | 'Cancelado';
  arbitro_principal?: string | null;
  observaciones?: string | null;
}

export interface CargarResultadoRequestDTO {
  marcador_local: number;
  marcador_visitante: number;
  penales_local?: number;
  penales_visitante?: number;
  fue_a_penales?: boolean;
  wo?: boolean;
  wo_equipo_ganador?: number;
  wo_motivo?: string;
  eventos?: CreateEventoPartidoDTO[];
}

export interface CreateEventoPartidoDTO {
  id_jugador: number;
  id_equipo: number;
  tipo_evento: 'gol' | 'gol_penal' | 'autogol' | 'asistencia' | 'amarilla' | 'roja' | 'doble_amarilla' | 'cambio_entrada' | 'cambio_salida' | 'penal_fallado' | 'penal_atajado' | 'mvp';
  minuto: number;
  tiempo_extra?: boolean;
  id_jugador_relacionado?: number;
  descripcion?: string;
}

export interface PartidoResponseDTO {
  id_partido: number;
  equipo_local: {
    id_equipo: number;
    nombre: string;
    nombre_corto: string | null;
    logo: string | null;
  };
  equipo_visitante: {
    id_equipo: number;
    nombre: string;
    nombre_corto: string | null;
    logo: string | null;
  };
  ronda: {
    id_ronda: number;
    nombre: string;
  };
  fase: {
    id_fase: number;
    nombre: string;
  };
  cancha?: {
    id_cancha: number;
    nombre: string;
    local_nombre: string;
  };
  fecha: Date | null;
  hora: string | null;
  estado_partido: string;
  marcador_local: number | null;
  marcador_visitante: number | null;
  penales_local: number | null;
  penales_visitante: number | null;
  fue_a_penales: boolean;
  wo: boolean;
}

export interface PartidoDetalleDTO extends PartidoResponseDTO {
  eventos: EventoPartidoDTO[];
  alineacion_local?: AlineacionEquipoDTO;
  alineacion_visitante?: AlineacionEquipoDTO;
  arbitro_principal: string | null;
  observaciones: string | null;
}

export interface EventoPartidoDTO {
  id_evento: number;
  jugador: {
    id_jugador: number;
    nombre_completo: string;
    numero_camiseta: number | null;
  };
  equipo: {
    id_equipo: number;
    nombre: string;
  };
  tipo_evento: string;
  minuto: number;
  tiempo_extra: boolean;
  jugador_relacionado?: {
    id_jugador: number;
    nombre_completo: string;
  };
}

export interface AlineacionEquipoDTO {
  titulares: JugadorAlineacionDTO[];
  suplentes: JugadorAlineacionDTO[];
}

export interface JugadorAlineacionDTO {
  id_jugador: number;
  nombre_completo: string;
  numero_camiseta: number;
  posicion: string | null;
}

// ============ FIXTURE DTOs ============

export interface GenerarFixtureRequestDTO {
  id_fase: number;
  tipo: 'todos_contra_todos' | 'ida_vuelta';
  fecha_inicio?: Date;
  intervalo_dias?: number; // Días entre jornadas
}

export interface FixtureGeneradoDTO {
  rondas: RondaFixtureDTO[];
  total_partidos: number;
}

export interface RondaFixtureDTO {
  nombre: string;
  partidos: PartidoFixtureDTO[];
}

export interface PartidoFixtureDTO {
  equipo_local: string;
  equipo_visitante: string;
  fecha_sugerida?: Date;
}
