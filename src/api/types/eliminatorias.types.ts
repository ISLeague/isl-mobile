// ============================================
// 🏆 ELIMINATORIAS TYPES
// ============================================

import { TipoCopa } from './fases.types';

export type RondaEliminatoria = 'eliminatoria' | '16avos' | 'octavos' | 'cuartos' | 'semifinal' | 'final';
export type EstadoLlave = 'pendiente' | 'en_curso' | 'finalizado';

export interface Eliminatoria {
  id_eliminatoria: number;
  id_fase: number;
  ronda: RondaEliminatoria;
  numero_llave: number;
  id_equipo_a: number | null;
  id_equipo_b: number | null;
  origen_a: string | null;
  origen_b: string | null;
  id_equipo_ganador: number | null;
  estado: EstadoLlave;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLlaveRequest {
  id_fase: number;
  ronda: RondaEliminatoria;
  id_equipo_a?: number;
  id_equipo_b?: number;
  origen_a?: string;
  origen_b?: string;
}

export interface ActualizarGanadorRequest {
  id_equipo_ganador: number;
  estado?: EstadoLlave;
}

export interface LlavesListParams {
  id_fase: number;
  ronda?: RondaEliminatoria;
  estado?: EstadoLlave;
}

export interface LlavesPorRonda {
  eliminatoria: Eliminatoria[];
  '16avos': Eliminatoria[];
  octavos: Eliminatoria[];
  cuartos: Eliminatoria[];
  semifinal: Eliminatoria[];
  final: Eliminatoria[];
}

export interface LlavesListResponse {
  fase: {
    id_fase: number;
    nombre: string;
    tipo: string;
    copa: TipoCopa;
  };
  total_llaves: number;
  llaves_por_ronda: LlavesPorRonda;
  todas_las_llaves: Eliminatoria[];
}

export interface CampeonInfo {
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  fase: {
    id_fase: number;
    nombre: string;
    copa: TipoCopa;
  };
  llave_final: {
    id_eliminatoria: number;
    numero_llave: number;
  };
}

export interface CampeonesResponse {
  edicion_categoria: {
    id_edicion_categoria: number;
    ediciones: {
      nombre: string;
    };
    categorias: {
      nombre: string;
    };
  };
  campeones: {
    oro: CampeonInfo | null;
    plata: CampeonInfo | null;
    bronce: CampeonInfo | null;
  };
}

// Response types
export interface CreateLlaveApiResponse {
  success: boolean;
  data: Eliminatoria;
  timestamp: string;
}

export interface ActualizarGanadorApiResponse {
  success: boolean;
  data: Eliminatoria;
  timestamp: string;
}

export interface LlavesListApiResponse {
  success: boolean;
  data: LlavesListResponse;
  timestamp: string;
}

export interface CampeonesApiResponse {
  success: boolean;
  data: CampeonesResponse;
  timestamp: string;
}

// ============================================
// 🆕 NUEVOS TIPOS PARA KNOCKOUT MEJORADO
// ============================================

/**
 * Equipo disponible para selección en knockout
 */
export interface EquipoDisponible {
  id_equipo: number;
  nombre: string;
  nombre_corto: string | null;
  logo: string | null;
  origen: string;
  tipo_origen: 'grupos' | 'eliminatoria';
  ya_asignado: boolean;
  es_sugerido?: boolean; // TRUE si el equipo es sugerido para esta copa según configuración
  // Opcionales según origen
  grupo?: string;
  posicion?: number;
  puntos?: number;
  llave_previa?: number;
  id_eliminatoria_previa?: number;
}

/**
 * Response del endpoint get-equipos-disponibles
 */
export interface GetEquiposDisponiblesResponse {
  success: boolean;
  data: {
    ronda_solicitada: RondaEliminatoria;
    copa: string;
    fase_knockout_id: number | null;
    tiene_ronda_previa: boolean;
    ronda_previa: RondaEliminatoria | null;
    equipos: EquipoDisponible[];
    total_equipos: number;
    equipos_disponibles: number;
  };
  timestamp: string;
}

/**
 * Input para crear una llave
 */
export interface CrearLlaveInput {
  id_equipo_a: number | null;
  id_equipo_b: number | null;
  origen_a?: string;
  origen_b?: string;
}

/**
 * Request para crear ronda completa
 */
export interface CrearRondaCompletaRequest {
  id_fase: number;
  ronda: RondaEliminatoria;
  llaves?: CrearLlaveInput[];
  crear_partidos?: boolean;
  datos_partidos?: {
    fecha?: string | null;
    hora?: string | null;
    id_cancha?: number | null;
  };
}

/**
 * Response de crear ronda completa
 */
export interface CrearRondaCompletaResponse {
  success: boolean;
  data: {
    mensaje: string;
    ronda: RondaEliminatoria;
    id_ronda: number;
    fase: {
      id_fase: number;
      nombre: string;
      tipo: string;
      copa: string;
    };
    llaves_creadas: number;
    partidos_creados: number;
    llaves: Eliminatoria[];
    partidos: any[];
  };
  timestamp: string;
}

/**
 * Cruce automático sugerido
 */
export interface CruceAutomatico {
  id_equipo_a: number;
  id_equipo_b: number;
  equipo_a: EquipoDisponible;
  equipo_b: EquipoDisponible;
  origen_a: string;
  origen_b: string;
}

/**
 * Response de generar cruces automáticos
 */
export interface GenerarCrucesResponse {
  success: boolean;
  data: {
    ronda: RondaEliminatoria;
    copa: string;
    cruces_sugeridos: CruceAutomatico[];
    total_cruces: number;
  };
  timestamp: string;
}
