// ============================================
// 🏆 TORNEOS TYPES
// ============================================

export interface Torneo {
  id_torneo: number;
  nombre: string;
  temporada: string;
  logo: string | null;
  id_pais: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTorneoRequest {
  nombre: string;
  temporada: string;
  id_pais: number;
  logo?: string;
}

export interface UpdateTorneoRequest {
  id_torneo: number;
  nombre?: string;
  temporada?: string;
  logo?: string | null;
  activo?: boolean;
}

export interface TorneosListParams {
  id_pais?: number;
  page?: number;
  limit?: number;
  activo?: boolean | 'todos';
  q?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TorneosListResponse {
  success: boolean;
  data: Torneo[];
  pagination: PaginationInfo;
  timestamp: string;
}
