// ============================================
// 📁 EDICION-CATEGORIAS TYPES
// ============================================

import { Categoria } from './categorias.types';

export interface EdicionCategoria {
  id_edicion_categoria: number;
  id_edicion: number;
  id_categoria: number;
  max_equipos: number;
  max_jugadores_por_equipo: number;
  min_jugadores_por_equipo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Nested objects (optional, only in responses)
  categoria?: Categoria;
}

export interface CreateEdicionCategoriaRequest {
  id_edicion: number;
  id_categoria: number;
  max_equipos?: number;
  max_jugadores_por_equipo?: number;
  min_jugadores_por_equipo?: number;
  permite_refuerzos_override?: boolean;
  max_refuerzos_override?: number;
}

export interface EdicionCategoriaListParams {
  id_edicion?: number;
  id_categoria?: number;
  activo?: boolean;
}

export interface EdicionCategoriaListResponse {
  success: boolean;
  data: {
    data: EdicionCategoria[];
    total: number;
    filters: {
      id_edicion: number | null;
      id_categoria: number | null;
      activo: boolean | null;
    };
  };
  timestamp: string;
}

export interface CreateEdicionCategoriaResponse {
  success: boolean;
  data: EdicionCategoria;
  timestamp: string;
}
