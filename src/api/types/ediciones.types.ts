// ============================================
// 📅 EDICIONES TYPES
// ============================================

export type EstadoEdicion = 'abierto' | 'cerrado' | 'en juego';

export interface TorneoInfoEdicion {
  logo: string | null;
  nombre: string;
}

export interface Edicion {
  id_edicion: number;
  numero: number;
  nombre: string;
  estado: EstadoEdicion;
  id_torneo: number;
  fecha_inicio: string;
  fecha_fin: string;
  created_at: string;
  updated_at: string;
  torneo?: TorneoInfoEdicion;
}

// Request types
export interface CreateEdicionRequest {
  numero: number;
  nombre: string;
  id_torneo: number;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface UpdateEdicionRequest {
  numero?: number;
  nombre?: string;
  estado?: EstadoEdicion;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface EdicionesListParams {
  id_torneo?: number;
  estado?: EstadoEdicion;
}

// Response types
export interface CreateEdicionResponse {
  success: boolean;
  data: Edicion;
  timestamp: string;
}

export interface EdicionesListResponse {
  success: boolean;
  data: Edicion[];
  timestamp: string;
}

export interface UpdateEdicionResponse {
  success: boolean;
  data: Edicion;
  timestamp: string;
}
