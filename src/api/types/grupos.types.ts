// ============================================
// 🏆 GRUPOS TYPES
// ============================================

import type { Equipo } from './equipos.types';

export interface Grupo {
  id_grupo: number;
  nombre: string;
  id_fase: number;
  cantidad_equipos: number;
  orden: number;
  equipos_pasan_oro?: number;
  equipos_pasan_plata?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGrupoRequest {
  nombre: string;
  id_fase: number;
  cantidad_equipos: number;
  orden: number;
}

export interface AssignTeamsRequest {
  id_grupo: number;
  equipos: number[];
}

export interface SorteoRequest {
  id_fase: number;
  equipos: number[];
}

export interface GenerarFixtureRequest {
  id_grupo: number;
  fecha_inicio: string;
  dias_entre_partidos: number;
  id_local_default: number;
}

export interface PartidoGenerado {
  id_partido: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  ronda: number;
}

export interface GenerarFixtureResponse {
  partidos_generados: number;
  rondas: number;
  partidos: PartidoGenerado[];
}

// Tipo para una fila de clasificación con datos del equipo
export interface Clasificacion {
  id_clasificacion: number;
  id_equipo: number;
  id_grupo: number;
  posicion: number;
  puntos: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClasificacionEquipo {
  posicion: number;
  equipo: string;
  puntos: number;
  PJ: number;
  PG: number;
  PE: number;
  PP: number;
  GF: number;
  GC: number;
  DG: number;
}

export interface ClasificacionResponse {
  grupo: string;
  clasificacion: ClasificacionEquipo[];
}

// Response types
export interface CreateGrupoResponse {
  success: boolean;
  data: Grupo;
  timestamp: string;
}

export interface GruposListResponse {
  success: boolean;
  data: Grupo[];
  timestamp: string;
}

export interface AssignTeamsResponse {
  success: boolean;
  data: {
    equipos_asignados: number;
    id_grupo: number;
  };
  timestamp: string;
}

export interface SorteoResponse {
  success: boolean;
  data: {
    grupos: Array<{
      id_grupo: number;
      nombre: string;
      equipos: number[];
    }>;
  };
  timestamp: string;
}

export interface GenerarFixtureApiResponse {
  success: boolean;
  data: GenerarFixtureResponse;
  timestamp: string;
}

export interface ClasificacionConEquipo {
  clasificacion: Clasificacion;
  equipo: Equipo;
}

export interface ClasificacionApiResponse {
  success: boolean;
  data: ClasificacionConEquipo[];
  timestamp: string;
}
