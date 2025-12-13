/**
 * Fases Endpoints
 * ===============
 * Contratos de API para gestión de fases de competición.
 * 
 * Base URL: /api/v1/fases
 */

import {
  CreateFaseRequestDTO,
  UpdateFaseRequestDTO,
  FaseResponseDTO
} from '../dtos/partido.dto';
import { ApiResponse } from '../responses/api.responses';

// ============================================
// CRUD DE FASES
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/fases
 * ----------------------------------------
 * Listar fases de una edición-categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface ListFasesEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/fases';
  params: { id: number };
  response: ApiResponse<FaseResponseDTO[]>;
}

/**
 * GET /api/v1/fases/:id
 * ---------------------
 * Obtener fase por ID.
 * 
 * @access Public
 * @param id ID de la fase
 */
export interface GetFaseEndpoint {
  method: 'GET';
  path: '/api/v1/fases/:id';
  params: { id: number };
  response: ApiResponse<FaseResponseDTO>;
}

/**
 * POST /api/v1/edicion-categorias/:id/fases
 * -----------------------------------------
 * Crear nueva fase.
 * 
 * @access Admin (del torneo)
 * @param id ID de la edición-categoría
 * @body CreateFaseRequestDTO
 */
export interface CreateFaseEndpoint {
  method: 'POST';
  path: '/api/v1/edicion-categorias/:id/fases';
  params: { id: number };
  request: CreateFaseRequestDTO;
  response: ApiResponse<FaseResponseDTO>;
}

/**
 * PUT /api/v1/fases/:id
 * ---------------------
 * Actualizar fase.
 * 
 * @access Admin (del torneo)
 * @param id ID de la fase
 * @body UpdateFaseRequestDTO
 */
export interface UpdateFaseEndpoint {
  method: 'PUT';
  path: '/api/v1/fases/:id';
  params: { id: number };
  request: UpdateFaseRequestDTO;
  response: ApiResponse<FaseResponseDTO>;
}

/**
 * DELETE /api/v1/fases/:id
 * ------------------------
 * Eliminar fase.
 * Solo si no tiene partidos jugados.
 * 
 * @access Admin (del torneo)
 * @param id ID de la fase
 */
export interface DeleteFaseEndpoint {
  method: 'DELETE';
  path: '/api/v1/fases/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// ORDENAMIENTO DE FASES
// ============================================

/**
 * PUT /api/v1/edicion-categorias/:id/fases/orden
 * ----------------------------------------------
 * Reordenar fases.
 * 
 * @access Admin (del torneo)
 * @param id ID de la edición-categoría
 * @body { orden: { id_fase: number, orden: number }[] }
 */
export interface ReordenarFasesEndpoint {
  method: 'PUT';
  path: '/api/v1/edicion-categorias/:id/fases/orden';
  params: { id: number };
  request: {
    orden: { id_fase: number; orden: number }[];
  };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// CONFIGURACIÓN DE AVANCE
// ============================================

/**
 * GET /api/v1/fases/:id/reglas-avance
 * -----------------------------------
 * Obtener reglas de avance de una fase.
 * 
 * @access Public
 * @param id ID de la fase
 */
export interface GetReglasAvanceFaseEndpoint {
  method: 'GET';
  path: '/api/v1/fases/:id/reglas-avance';
  params: { id: number };
  response: ApiResponse<{
    id_fase: number;
    nombre_fase: string;
    reglas: {
      id_regla: number;
      fase_destino: {
        id_fase: number;
        nombre: string;
        copa: string | null;
      };
      posicion_inicial: number;
      posicion_final: number;
      cupos: number;
      mejor_tercero: boolean;
    }[];
  }>;
}

/**
 * POST /api/v1/fases/:id/reglas-avance
 * ------------------------------------
 * Crear regla de avance para la fase.
 * 
 * @access Admin (del torneo)
 * @param id ID de la fase origen
 * @body { id_fase_destino, posicion_inicial, posicion_final, cupos, mejor_tercero? }
 */
export interface CreateReglaAvanceEndpoint {
  method: 'POST';
  path: '/api/v1/fases/:id/reglas-avance';
  params: { id: number };
  request: {
    id_fase_destino: number;
    posicion_inicial: number;
    posicion_final: number;
    cupos: number;
    mejor_tercero?: boolean;
    descripcion?: string;
  };
  response: ApiResponse<{ message: string }>;
}

/**
 * DELETE /api/v1/reglas-avance/:id
 * --------------------------------
 * Eliminar regla de avance.
 * 
 * @access Admin (del torneo)
 * @param id ID de la regla
 */
export interface DeleteReglaAvanceEndpoint {
  method: 'DELETE';
  path: '/api/v1/reglas-avance/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// PROGRESO DE FASE
// ============================================

/**
 * GET /api/v1/fases/:id/progreso
 * ------------------------------
 * Obtener progreso de la fase.
 * 
 * @access Public
 * @param id ID de la fase
 */
export interface GetProgresoFaseEndpoint {
  method: 'GET';
  path: '/api/v1/fases/:id/progreso';
  params: { id: number };
  response: ApiResponse<{
    id_fase: number;
    nombre: string;
    tipo: string;
    partidos_totales: number;
    partidos_jugados: number;
    partidos_pendientes: number;
    porcentaje_completado: number;
    rondas: {
      id_ronda: number;
      nombre: string;
      partidos_jugados: number;
      partidos_totales: number;
    }[];
  }>;
}
