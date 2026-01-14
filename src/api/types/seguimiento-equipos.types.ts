export interface SeguimientoEquipo {
  id_seguimiento: number;
  id_usuario: number;
  id_equipo: number;
  id_edicion_categoria: number;
  fecha_seguimiento: string;
  equipo?: {
    id_equipo: number;
    nombre: string;
    nombre_corto?: string;
    logo?: string;
  };
  edicion_categoria?: {
    id_edicion_categoria: number;
    ediciones: {
      id_edicion: number;
      nombre: string;
      numero: number;
    };
    categorias: {
      id_categoria: number;
      nombre: string;
    };
  };
  preferencias?: {
    notificar_partidos: boolean;
    notificar_resultados: boolean;
  };
  estadisticas?: {
    partidos_jugados: number;
    partidos_ganados: number;
    partidos_perdidos: number;
    partidos_empatados: number;
    goles_favor: number;
    goles_contra: number;
  };
}

export interface ListSeguimientosResponse {
  success: boolean;
  data: {
    equipos_favoritos: SeguimientoEquipo[];
    total: number;
  };
}

export interface CreateSeguimientoRequest {
  id_equipo: number;
  id_edicion_categoria: number;
  notificar_partidos?: boolean;
  notificar_resultados?: boolean;
  notificar_goles?: boolean;
  notificar_tarjetas?: boolean;
}

export interface CreateSeguimientoResponse {
  success: boolean;
  data: {
    message: string;
    seguimiento: SeguimientoEquipo;
  };
}

export interface UpdatePreferenciasRequest {
  notificar_partidos?: boolean;
  notificar_resultados?: boolean;
  notificar_goles?: boolean;
  notificar_tarjetas?: boolean;
}

export interface DeleteSeguimientoResponse {
  success: boolean;
  data: {
    message: string;
  };
}
