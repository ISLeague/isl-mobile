// ============================================
// 🏆 ELIMINATORIAS TYPES
// ============================================

import { TipoCopa } from './fases.types';

export type RondaEliminatoria = 'octavos' | 'cuartos' | 'semifinal' | 'final';
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
  numero_llave: number;
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
