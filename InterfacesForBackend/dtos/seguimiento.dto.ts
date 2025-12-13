/**
 * Seguimiento DTOs
 * ================
 * Data Transfer Objects para seguimiento de equipos.
 */

// ============ REQUEST DTOs ============

export interface SeguirEquipoRequestDTO {
  id_equipo: number;
  notificar_partidos?: boolean;
  notificar_resultados?: boolean;
  notificar_goles?: boolean;
  notificar_tarjetas?: boolean;
}

export interface UpdateSeguimientoRequestDTO {
  notificar_partidos?: boolean;
  notificar_resultados?: boolean;
  notificar_goles?: boolean;
  notificar_tarjetas?: boolean;
}

// ============ RESPONSE DTOs ============

export interface SeguimientoResponseDTO {
  id_seguimiento: number;
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
    categoria: string;
    torneo: string;
  };
  config: {
    notificar_partidos: boolean;
    notificar_resultados: boolean;
    notificar_goles: boolean;
    notificar_tarjetas: boolean;
  };
  pago_fotos: boolean;
  fecha_seguimiento: Date;
}

export interface MiEquipoResponseDTO {
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
    color_primario: string | null;
    color_secundario: string | null;
  };
  edicion_categoria: {
    categoria: string;
    edicion: number;
    torneo: string;
    estado: string;
  };
  estadisticas: {
    posicion_grupo: number | null;
    puntos: number;
    pj: number;
    pg: number;
    pe: number;
    pp: number;
    gf: number;
    gc: number;
  };
  proximo_partido?: {
    id_partido: number;
    rival: {
      id_equipo: number;
      nombre: string;
      logo: string | null;
    };
    es_local: boolean;
    fecha: Date | null;
    hora: string | null;
    cancha?: string;
    local?: string;
  };
  ultimo_partido?: {
    id_partido: number;
    rival: {
      id_equipo: number;
      nombre: string;
      logo: string | null;
    };
    es_local: boolean;
    marcador_favor: number;
    marcador_contra: number;
    resultado: 'ganado' | 'empatado' | 'perdido';
    fecha: Date;
  };
  plantilla_count: number;
  fotos_disponibles: number;
  fotos_compradas: boolean;
}
