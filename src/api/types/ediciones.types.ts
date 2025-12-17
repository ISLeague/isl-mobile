// ============================================
// 📅 EDICIONES TYPES
// ============================================

export type EstadoEdicion = 'abierto' | 'cerrado' | 'en juego';

export interface Edicion {
  id_edicion: number;
  numero: number;
  nombre: string | null;
  estado: EstadoEdicion;
  id_torneo: number;
  torneoId?: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEdicionRequest {
  numero: number;
  nombre?: string | null;
  estado: EstadoEdicion;
  id_torneo: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}
