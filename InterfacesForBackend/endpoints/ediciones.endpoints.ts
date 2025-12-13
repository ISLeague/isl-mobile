/**
 * Ediciones Endpoints
 * ===================
 * Contratos de API para gestión de ediciones de torneos.
 * 
 * Base URL: /api/v1/ediciones
 */

import {
  CreateEdicionRequestDTO,
  UpdateEdicionRequestDTO,
  EdicionResponseDTO,
  EdicionCategoriaResumenDTO
} from '../dtos/torneo.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// CRUD DE EDICIONES
// ============================================

/**
 * GET /api/v1/torneos/:id_torneo/ediciones
 * ----------------------------------------
 * Listar ediciones de un torneo.
 * 
 * @access Public
 * @param id_torneo ID del torneo
 * @query estado - Filtrar por estado
 */
export interface ListEdicionesEndpoint {
  method: 'GET';
  path: '/api/v1/torneos/:id_torneo/ediciones';
  params: { id_torneo: number };
  query: {
    estado?: 'abierto' | 'cerrado' | 'en juego';
  };
  response: ApiResponse<EdicionResponseDTO[]>;
}

/**
 * GET /api/v1/ediciones/:id
 * -------------------------
 * Obtener edición por ID con detalles.
 * 
 * @access Public
 * @param id ID de la edición
 */
export interface GetEdicionEndpoint {
  method: 'GET';
  path: '/api/v1/ediciones/:id';
  params: { id: number };
  response: ApiResponse<EdicionResponseDTO>;
}

/**
 * GET /api/v1/torneos/:id_torneo/edicion-actual
 * ---------------------------------------------
 * Obtener la edición actual/activa de un torneo.
 * 
 * @access Public
 * @param id_torneo ID del torneo
 */
export interface GetEdicionActualEndpoint {
  method: 'GET';
  path: '/api/v1/torneos/:id_torneo/edicion-actual';
  params: { id_torneo: number };
  response: ApiResponse<EdicionResponseDTO>;
}

/**
 * POST /api/v1/torneos/:id_torneo/ediciones
 * -----------------------------------------
 * Crear nueva edición para un torneo.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id_torneo ID del torneo
 * @body CreateEdicionRequestDTO
 */
export interface CreateEdicionEndpoint {
  method: 'POST';
  path: '/api/v1/torneos/:id_torneo/ediciones';
  params: { id_torneo: number };
  request: CreateEdicionRequestDTO;
  response: ApiResponse<EdicionResponseDTO>;
}

/**
 * PUT /api/v1/ediciones/:id
 * -------------------------
 * Actualizar edición.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id ID de la edición
 * @body UpdateEdicionRequestDTO
 */
export interface UpdateEdicionEndpoint {
  method: 'PUT';
  path: '/api/v1/ediciones/:id';
  params: { id: number };
  request: UpdateEdicionRequestDTO;
  response: ApiResponse<EdicionResponseDTO>;
}

/**
 * DELETE /api/v1/ediciones/:id
 * ----------------------------
 * Eliminar edición (soft delete).
 * Solo si no tiene partidos jugados.
 * 
 * @access SuperAdmin
 * @param id ID de la edición
 */
export interface DeleteEdicionEndpoint {
  method: 'DELETE';
  path: '/api/v1/ediciones/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// CAMBIO DE ESTADO
// ============================================

/**
 * PUT /api/v1/ediciones/:id/estado
 * --------------------------------
 * Cambiar estado de la edición.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id ID de la edición
 * @body { estado: 'abierto' | 'cerrado' | 'en juego' }
 */
export interface CambiarEstadoEdicionEndpoint {
  method: 'PUT';
  path: '/api/v1/ediciones/:id/estado';
  params: { id: number };
  request: { estado: 'abierto' | 'cerrado' | 'en juego' };
  response: ApiResponse<EdicionResponseDTO>;
}

/**
 * POST /api/v1/ediciones/:id/iniciar
 * ----------------------------------
 * Iniciar edición (cambiar a "en juego").
 * Valida que tenga equipos y fixture configurado.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id ID de la edición
 */
export interface IniciarEdicionEndpoint {
  method: 'POST';
  path: '/api/v1/ediciones/:id/iniciar';
  params: { id: number };
  response: ApiResponse<EdicionResponseDTO>;
}

/**
 * POST /api/v1/ediciones/:id/finalizar
 * ------------------------------------
 * Finalizar edición (cambiar a "cerrado").
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id ID de la edición
 */
export interface FinalizarEdicionEndpoint {
  method: 'POST';
  path: '/api/v1/ediciones/:id/finalizar';
  params: { id: number };
  response: ApiResponse<EdicionResponseDTO>;
}

// ============================================
// RESUMEN DE EDICIÓN
// ============================================

/**
 * GET /api/v1/ediciones/:id/resumen
 * ---------------------------------
 * Obtener resumen de la edición con estadísticas.
 * 
 * @access Public
 * @param id ID de la edición
 */
export interface GetEdicionResumenEndpoint {
  method: 'GET';
  path: '/api/v1/ediciones/:id/resumen';
  params: { id: number };
  response: ApiResponse<{
    edicion: EdicionResponseDTO;
    estadisticas: {
      total_equipos: number;
      total_jugadores: number;
      total_partidos: number;
      partidos_jugados: number;
      goles_totales: number;
    };
    goleador?: {
      id_jugador: number;
      nombre: string;
      goles: number;
    };
    campeon?: {
      id_equipo: number;
      nombre: string;
      logo: string | null;
    };
  }>;
}
