// ============================================
// 🔄 RONDAS TYPES
// ============================================

export interface Ronda {
  id_ronda: number;
  nombre: string;
  tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce';
  fecha_inicio: string;
  fecha_fin?: string;
  orden: number;
  id_fase?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRondaRequest {
  nombre: string;
  id_fase: number;
  tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce';
  es_amistosa?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  orden: number;
}

export interface FixtureGenerateRequest {
  id_ronda: number;
  tipo_generacion: 'round_robin' | 'amistoso_aleatorio';
  ida_vuelta?: boolean;
  cantidad_partidos?: number; // Solo para amistosos
}

export interface UpdateRondaRequest {
  id: number;
  numero?: number;
}

// Response types
export interface RondasListResponse {
  success: boolean;
  data: Ronda[];
  timestamp: string;
}
