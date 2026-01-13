// Types for cambios-partido endpoint

export interface JugadorCambio {
  id_plantilla: number;
  nombre_completo: string;
  numero_camiseta: number | null;
  es_capitan?: boolean;
  puede_salir?: boolean;
  puede_entrar?: boolean;
}

export interface CambioPartido {
  id_cambio: number;
  id_partido: number;
  id_equipo: number;
  minuto: number | null;
  motivo: 'tactico' | 'lesion' | 'cansancio' | null;
  jugador_sale: {
    id_plantilla: number;
    nombre: string;
    numero: number | null;
  };
  jugador_entra: {
    id_plantilla: number;
    nombre: string;
    numero: number | null;
  };
}

export interface CambiosListResponse {
  id_partido: number;
  total_cambios: number;
  cambios: CambioPartido[];
  cambios_por_equipo: Record<number, CambioPartido[]>;
}

export interface DisponiblesResponse {
  id_partido: number;
  id_equipo: number;
  en_cancha: JugadorCambio[];
  en_banca: JugadorCambio[];
  cambios_realizados: number;
}

export interface RegistrarCambioRequest {
  id_partido: number;
  id_equipo: number;
  id_jugador_sale: number;
  id_jugador_entra: number;
  minuto?: number;
  motivo?: 'tactico' | 'lesion' | 'cansancio';
}

export interface RegistrarCambioResponse {
  message: string;
  cambio: {
    id_cambio: number;
    minuto: number | null;
    motivo: string | null;
    jugador_sale: { nombre_completo: string; numero_camiseta: number | null };
    jugador_entra: { nombre_completo: string; numero_camiseta: number | null };
  };
}

export interface BulkCambiosRequest {
  id_partido: number;
  cambios: {
    id_equipo: number;
    id_jugador_sale: number;
    id_jugador_entra: number;
    minuto?: number;
    motivo?: string;
  }[];
}

export interface BulkCambiosResponse {
  message: string;
  exitosos: number;
  errores: number;
  detalles_errores: string[];
}
