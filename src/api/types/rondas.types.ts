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
  numero: number;
  fase_id: number;
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
