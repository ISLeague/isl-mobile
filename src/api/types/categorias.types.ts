// ============================================
// 📁 CATEGORIAS TYPES
// ============================================

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  tiene_restriccion_edad: boolean;
  edad_minima: number | null;
  edad_maxima: number | null;
  permite_refuerzos: boolean;
  max_refuerzos: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoriaRequest {
  nombre: string;
  descripcion: string;
  tiene_restriccion_edad?: boolean;
  edad_minima?: number;
  edad_maxima?: number;
  permite_refuerzos?: boolean;
  max_refuerzos?: number;
}

export interface UpdateCategoriaRequest {
  id_categoria: number;
  nombre?: string;
  descripcion?: string;
  tiene_restriccion_edad?: boolean;
  edad_minima?: number;
  edad_maxima?: number;
  permite_refuerzos?: boolean;
  max_refuerzos?: number;
  activo?: boolean;
}
