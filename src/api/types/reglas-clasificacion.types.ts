// ============================================
// 📋 REGLAS DE CLASIFICACIÓN TYPES
// ============================================

import { TipoCopa } from './fases.types';

export interface ReglaClasificacion {
  id_regla: number;
  id_fase_origen: number;
  posicion_desde: number;
  posicion_hasta: number;
  copa_destino: TipoCopa;
  id_fase_destino: number;
  descripcion: string;
  orden: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateReglaClasificacionRequest {
  id_fase_origen: number;
  posicion_desde: number;
  posicion_hasta: number;
  copa_destino: TipoCopa;
  id_fase_destino: number;
  descripcion: string;
  orden: number;
}

export interface ValidacionRegla {
  valido: boolean;
  mensaje?: string;
}

export interface ValidarReglasResponse {
  id_fase: number;
  fase_nombre: string;
  valido: boolean;
  validaciones: ValidacionRegla[];
  mensaje: string;
}

export interface EquipoClasificado {
  id_equipo: number;
  nombre_equipo: string;
  grupo: string;
  posicion: number;
  puntos: number;
}

export interface EquiposClasificadosResponse {
  id_fase: number;
  fase_nombre: string;
  total_equipos: number;
  equipos_por_copa: {
    oro: EquipoClasificado[];
    plata: EquipoClasificado[];
    bronce: EquipoClasificado[];
  };
}

// Response types
export interface CreateReglaClasificacionResponse {
  success: boolean;
  data: ReglaClasificacion;
  timestamp: string;
}

export interface ValidarReglasApiResponse {
  success: boolean;
  data: ValidarReglasResponse;
  timestamp: string;
}

export interface EquiposClasificadosApiResponse {
  success: boolean;
  data: EquiposClasificadosResponse;
  timestamp: string;
}
