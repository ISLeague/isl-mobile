// ============================================
// 🔄 RONDAS TYPES
// ============================================

export interface CreateRondaRequest {
  numero: number;
  fase_id: number;
}

export interface UpdateRondaRequest {
  id: number;
  numero?: number;
}
