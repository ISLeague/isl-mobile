// ============================================
// 🏆 GRUPOS TYPES
// ============================================

import type { Equipo } from './equipos.types';

export interface Grupo {
  id_grupo: number;
  nombre: string;
  id_fase: number;
  cantidad_equipos: number;
  equipos_pasan_oro?: number;
  equipos_pasan_plata?: number;
  equipos_pasan_bronce?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGrupoRequest {
  id_fase: number;
  nombre: string;
  cantidad_equipos?: number;
  // Configuración de clasificación (opcional, se crea si no existe)
  equipos_oro?: number;
  equipos_plata?: number;
  equipos_bronce?: number;
  posiciones_oro?: string; // "1" o "1,2"
  posiciones_plata?: string; // "2,3"
  posiciones_bronce?: string; // "3,4"
  descripcion_clasificacion?: string;
}

export interface CreateGruposRequest {
  id_fase: number;
  cantidad_grupos: number;
  cantidad_equipos_por_grupo: number;
  // Configuración de clasificación (opcional, se crea si no existe)
  equipos_oro?: number;
  equipos_plata?: number;
  equipos_bronce?: number;
  posiciones_oro?: string; // "1" o "1,2"
  posiciones_plata?: string; // "2,3"
  posiciones_bronce?: string; // "3,4"
  descripcion_clasificacion?: string;
}

export interface AsignarEquiposRequest {
  id_grupo: number;
  equipos: number[]; // Array de IDs de equipos en orden
}

export interface UpdateReglasRequest {
  equipos_oro?: number;
  equipos_plata?: number;
  equipos_bronce?: number;
  posiciones_oro?: string;
  posiciones_plata?: string;
  posiciones_bronce?: string;
  descripcion?: string;
}

export interface DeleteGrupoRequest {
  force_delete?: boolean;
}

// Deprecated - use AsignarEquiposRequest instead
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

// Configuración de Clasificación para una Fase
export interface ConfiguracionClasificacion {
  id_configuracion: number;
  id_fase: number;
  equipos_oro: number;
  equipos_plata: number;
  equipos_bronce: number;
  posiciones_oro: string;
  posiciones_plata: string;
  posiciones_bronce: string;
  descripcion: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Tipo para una fila de clasificación con datos del equipo
export interface Clasificacion {
  id_clasificacion: number;
  id_equipo: number;
  id_grupo: number;
  posicion: number | null;
  puntos: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  tarjetas_amarillas?: number;
  tarjetas_rojas?: number;
  goles_head_to_head?: number;
  puntos_head_to_head?: number;
  puntos_bonus?: number;
  puntos_penalizacion?: number;
  motivo_penalizacion?: string | null;
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

export interface CreateGruposResponse {
  success: boolean;
  data: {
    grupos_creados: number;
    grupos: Grupo[];
  };
  timestamp: string;
}

export interface GruposListResponse {
  success: boolean;
  data: Grupo[];
  timestamp: string;
}

export interface AsignarEquiposResponse {
  success: boolean;
  data: {
    equipos_asignados: number;
    id_grupo: number;
  };
  timestamp: string;
}

// Deprecated - use AsignarEquiposResponse instead
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

// Equipo asignado a un grupo
export interface EquipoGrupo {
  id_equipo_grupo: number;
  fecha_asignacion: string;
  posicion_sorteo: number | null;
  equipo: Equipo;
  clasificacion: Clasificacion[];
}

// Grupo con equipos asignados
export interface GrupoDetallado {
  id_grupo: number;
  nombre: string;
  cantidad_equipos: number;
  equipos_avanzan: number;
  total_equipos_inscritos: number;
  equipos: EquipoGrupo[];
}

// Resumen de grupos
export interface ResumenGrupos {
  total_grupos: number;
  total_equipos: number;
  total_partidos_jugados: number;
  equipos_promedio_por_grupo: number;
}

// Información de fase simplificada
export interface FaseSimple {
  id_fase: number;
  nombre: string;
  tipo: string;
}

// Respuesta completa del endpoint /grupos-get
export interface GruposGetResponse {
  success: boolean;
  data: {
    fase: FaseSimple;
    configuracion_clasificacion: ConfiguracionClasificacion;
    grupos: GrupoDetallado[];
    resumen: ResumenGrupos;
  };
  timestamp: string;
}

// Respuesta de actualizar reglas de clasificación
export interface UpdateReglasResponse {
  success: boolean;
  data: {
    configuracion_actualizada: ConfiguracionClasificacion;
    fase: FaseSimple;
    grupos_afectados: Array<{
      id_grupo: number;
      nombre: string;
    }>;
    campos_actualizados: string[];
  };
  timestamp: string;
}

// Respuesta de eliminar grupo
export interface DeleteGrupoResponse {
  success: boolean;
  data: {
    id_grupo: number;
    nombre: string;
    equipos_removidos: number;
    clasificaciones_eliminadas: number;
  };
  timestamp: string;
}
