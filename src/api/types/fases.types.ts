// ============================================
// 🎯 FASES TYPES
// ============================================

export type TipoFase = 'grupo' | 'knockout';
export type TipoCopa = 'general' | 'oro' | 'plata' | 'bronce';

export interface Fase {
  id_fase: number;
  nombre: string;
  tipo: TipoFase;
  copa: TipoCopa;
  orden: number;
  partidos_ida_vuelta: boolean;
  permite_empate: boolean;
  permite_penales: boolean;
  activo: boolean;
  id_edicion_categoria: number;
  created_at?: string;
  updated_at?: string;
  grupos?: any[];
  rondas_count?: number;
}

export interface CreateFaseRequest {
  nombre: string;
  tipo: TipoFase;
  copa: TipoCopa;
  orden: number;
  partidos_ida_vuelta: boolean;
  permite_empate: boolean;
  permite_penales: boolean;
}

export interface AvanzarEquiposRequest {
  id_fase_origen: number;
  aplicar_reglas: boolean;
}

export interface AvanzarEquiposResponse {
  equipos_avanzados: number;
  por_copa: {
    oro: number;
    plata: number;
    bronce: number;
  };
  detalle: Array<{
    id_equipo: number;
    nombre: string;
    copa_destino: TipoCopa;
    id_fase_destino: number;
  }>;
}

export interface GenerarEliminatoriasRequest {
  id_fase: number;
  fecha_inicio: string;
  dias_entre_partidos: number;
  id_local_default: number;
}

export interface PartidoEliminatoriaGenerado {
  id_partido: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
}

export interface GenerarEliminatoriasResponse {
  partidos_generados: number;
  ronda: string;
  partidos: PartidoEliminatoriaGenerado[];
}

// Response types
export interface CreateFaseResponse {
  success: boolean;
  data: Fase;
  timestamp: string;
}

export interface FasesListResponse {
  success: boolean;
  data: Fase[];
  timestamp: string;
}

export interface AvanzarEquiposApiResponse {
  success: boolean;
  data: AvanzarEquiposResponse;
  timestamp: string;
}

export interface GenerarEliminatoriasApiResponse {
  success: boolean;
  data: GenerarEliminatoriasResponse;
  timestamp: string;
}
