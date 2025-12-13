/**
 * Grupos Endpoints
 * ================
 * Contratos de API para gestión de grupos y clasificación.
 * 
 * Base URL: /api/v1/grupos
 */

import {
  CreateGrupoRequestDTO,
  UpdateGrupoRequestDTO,
  GrupoDetalleDTO,
  GrupoResumenDTO,
  ClasificacionDTO
} from '../dtos/partido.dto';
import { ApiResponse } from '../responses/api.responses';

// ============================================
// CRUD DE GRUPOS
// ============================================

/**
 * GET /api/v1/fases/:id_fase/grupos
 * ---------------------------------
 * Listar grupos de una fase.
 * 
 * @access Public
 * @param id_fase ID de la fase
 */
export interface ListGruposEndpoint {
  method: 'GET';
  path: '/api/v1/fases/:id_fase/grupos';
  params: { id_fase: number };
  response: ApiResponse<GrupoResumenDTO[]>;
}

/**
 * GET /api/v1/grupos/:id
 * ----------------------
 * Obtener grupo por ID con detalles.
 * 
 * @access Public
 * @param id ID del grupo
 */
export interface GetGrupoEndpoint {
  method: 'GET';
  path: '/api/v1/grupos/:id';
  params: { id: number };
  response: ApiResponse<GrupoDetalleDTO>;
}

/**
 * POST /api/v1/fases/:id_fase/grupos
 * ----------------------------------
 * Crear nuevo grupo.
 * 
 * @access Admin (del torneo)
 * @param id_fase ID de la fase
 * @body CreateGrupoRequestDTO
 */
export interface CreateGrupoEndpoint {
  method: 'POST';
  path: '/api/v1/fases/:id_fase/grupos';
  params: { id_fase: number };
  request: CreateGrupoRequestDTO;
  response: ApiResponse<GrupoDetalleDTO>;
}

/**
 * PUT /api/v1/grupos/:id
 * ----------------------
 * Actualizar grupo.
 * 
 * @access Admin (del torneo)
 * @param id ID del grupo
 * @body UpdateGrupoRequestDTO
 */
export interface UpdateGrupoEndpoint {
  method: 'PUT';
  path: '/api/v1/grupos/:id';
  params: { id: number };
  request: UpdateGrupoRequestDTO;
  response: ApiResponse<GrupoDetalleDTO>;
}

/**
 * DELETE /api/v1/grupos/:id
 * -------------------------
 * Eliminar grupo.
 * Solo si no tiene partidos jugados.
 * 
 * @access Admin (del torneo)
 * @param id ID del grupo
 */
export interface DeleteGrupoEndpoint {
  method: 'DELETE';
  path: '/api/v1/grupos/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// CLASIFICACIÓN (TABLA DE POSICIONES)
// ============================================

/**
 * GET /api/v1/grupos/:id/clasificacion
 * ------------------------------------
 * Obtener tabla de posiciones del grupo.
 * 
 * @access Public
 * @param id ID del grupo
 */
export interface GetClasificacionGrupoEndpoint {
  method: 'GET';
  path: '/api/v1/grupos/:id/clasificacion';
  params: { id: number };
  response: ApiResponse<ClasificacionDTO[]>;
}

/**
 * GET /api/v1/edicion-categorias/:id/clasificacion
 * ------------------------------------------------
 * Obtener clasificación de todos los grupos de una categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface GetClasificacionCategoriaEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/clasificacion';
  params: { id: number };
  response: ApiResponse<{
    id_edicion_categoria: number;
    categoria: string;
    grupos: {
      id_grupo: number;
      nombre: string;
      clasificacion: ClasificacionDTO[];
    }[];
  }>;
}

/**
 * POST /api/v1/grupos/:id/recalcular-clasificacion
 * ------------------------------------------------
 * Forzar recálculo de la clasificación del grupo.
 * 
 * @access Admin (del torneo)
 * @param id ID del grupo
 */
export interface RecalcularClasificacionEndpoint {
  method: 'POST';
  path: '/api/v1/grupos/:id/recalcular-clasificacion';
  params: { id: number };
  response: ApiResponse<ClasificacionDTO[]>;
}

// ============================================
// PENALIZACIONES Y BONIFICACIONES
// ============================================

/**
 * POST /api/v1/clasificacion/:id_clasificacion/penalizacion
 * ---------------------------------------------------------
 * Agregar penalización de puntos a un equipo.
 * 
 * @access Admin (del torneo)
 * @param id_clasificacion ID del registro de clasificación
 * @body { puntos: number, motivo: string }
 */
export interface AgregarPenalizacionEndpoint {
  method: 'POST';
  path: '/api/v1/clasificacion/:id_clasificacion/penalizacion';
  params: { id_clasificacion: number };
  request: {
    puntos: number;
    motivo: string;
  };
  response: ApiResponse<ClasificacionDTO>;
}

/**
 * POST /api/v1/clasificacion/:id_clasificacion/bonus
 * --------------------------------------------------
 * Agregar bonificación de puntos a un equipo.
 * 
 * @access Admin (del torneo)
 * @param id_clasificacion ID del registro de clasificación
 * @body { puntos: number, motivo: string }
 */
export interface AgregarBonusEndpoint {
  method: 'POST';
  path: '/api/v1/clasificacion/:id_clasificacion/bonus';
  params: { id_clasificacion: number };
  request: {
    puntos: number;
    motivo: string;
  };
  response: ApiResponse<ClasificacionDTO>;
}

/**
 * DELETE /api/v1/clasificacion/:id_clasificacion/ajuste
 * -----------------------------------------------------
 * Eliminar penalización o bonificación.
 * 
 * @access Admin (del torneo)
 * @param id_clasificacion ID del registro
 */
export interface EliminarAjusteClasificacionEndpoint {
  method: 'DELETE';
  path: '/api/v1/clasificacion/:id_clasificacion/ajuste';
  params: { id_clasificacion: number };
  response: ApiResponse<ClasificacionDTO>;
}

// ============================================
// SORTEO Y DISTRIBUCIÓN DE GRUPOS
// ============================================

/**
 * POST /api/v1/fases/:id_fase/sorteo-grupos
 * -----------------------------------------
 * Realizar sorteo automático de equipos en grupos.
 * 
 * @access Admin (del torneo)
 * @param id_fase ID de la fase de grupos
 * @body { cantidad_grupos: number, equipos?: number[] }
 */
export interface SorteoGruposEndpoint {
  method: 'POST';
  path: '/api/v1/fases/:id_fase/sorteo-grupos';
  params: { id_fase: number };
  request: {
    cantidad_grupos: number;
    equipos?: number[]; // IDs de equipos a distribuir (si no se pasan, usa todos)
    cabezas_serie?: number[]; // IDs de equipos cabezas de serie
  };
  response: ApiResponse<{
    grupos: {
      id_grupo: number;
      nombre: string;
      equipos: { id_equipo: number; nombre: string }[];
    }[];
  }>;
}

/**
 * POST /api/v1/fases/:id_fase/crear-grupos-automatico
 * ---------------------------------------------------
 * Crear grupos y distribuir equipos automáticamente.
 * 
 * @access Admin (del torneo)
 * @param id_fase ID de la fase de grupos
 * @body Configuración de creación
 */
export interface CrearGruposAutomaticoEndpoint {
  method: 'POST';
  path: '/api/v1/fases/:id_fase/crear-grupos-automatico';
  params: { id_fase: number };
  request: {
    cantidad_grupos: number;
    equipos_por_grupo: number;
    equipos_pasan_oro?: number;
    equipos_pasan_plata?: number;
    equipos_pasan_bronce?: number;
    distribuir_equipos: boolean; // Si hacer sorteo automático
  };
  response: ApiResponse<GrupoDetalleDTO[]>;
}
