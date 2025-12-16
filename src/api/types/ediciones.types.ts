// ============================================
// 📅 EDICIONES TYPES
// ============================================

export interface Edicion {
  id: number;
  nombre: string;
  torneo_id: number;
}

export interface CreateEdicionRequest {
  nombre: string;
  torneo_id: number;
}
