/**
 * Categorias Endpoints
 * ====================
 * Contratos de API para gestión de categorías y edición-categorías.
 * 
 * Base URL: /api/v1/categorias
 */

import {
  CreateCategoriaRequestDTO,
  UpdateCategoriaRequestDTO,
  CategoriaResponseDTO,
  CreateEdicionCategoriaRequestDTO,
  UpdateEdicionCategoriaRequestDTO,
  EdicionCategoriaResponseDTO
} from '../dtos/torneo.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// CRUD DE CATEGORÍAS (GLOBALES)
// ============================================

/**
 * GET /api/v1/categorias
 * ----------------------
 * Listar todas las categorías.
 * 
 * @access Public
 * @query activo - Filtrar por estado
 */
export interface ListCategoriasEndpoint {
  method: 'GET';
  path: '/api/v1/categorias';
  query: {
    activo?: boolean;
  };
  response: ApiResponse<CategoriaResponseDTO[]>;
}

/**
 * GET /api/v1/categorias/:id
 * --------------------------
 * Obtener categoría por ID.
 * 
 * @access Public
 * @param id ID de la categoría
 */
export interface GetCategoriaEndpoint {
  method: 'GET';
  path: '/api/v1/categorias/:id';
  params: { id: number };
  response: ApiResponse<CategoriaResponseDTO>;
}

/**
 * POST /api/v1/categorias
 * -----------------------
 * Crear nueva categoría global.
 * 
 * @access SuperAdmin
 * @body CreateCategoriaRequestDTO
 */
export interface CreateCategoriaEndpoint {
  method: 'POST';
  path: '/api/v1/categorias';
  request: CreateCategoriaRequestDTO;
  response: ApiResponse<CategoriaResponseDTO>;
}

/**
 * PUT /api/v1/categorias/:id
 * --------------------------
 * Actualizar categoría.
 * 
 * @access SuperAdmin
 * @param id ID de la categoría
 * @body UpdateCategoriaRequestDTO
 */
export interface UpdateCategoriaEndpoint {
  method: 'PUT';
  path: '/api/v1/categorias/:id';
  params: { id: number };
  request: UpdateCategoriaRequestDTO;
  response: ApiResponse<CategoriaResponseDTO>;
}

/**
 * DELETE /api/v1/categorias/:id
 * -----------------------------
 * Eliminar categoría (soft delete).
 * Solo si no está siendo usada en ediciones.
 * 
 * @access SuperAdmin
 * @param id ID de la categoría
 */
export interface DeleteCategoriaEndpoint {
  method: 'DELETE';
  path: '/api/v1/categorias/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// EDICIÓN-CATEGORÍA (Categorías en Ediciones)
// ============================================

/**
 * GET /api/v1/ediciones/:id_edicion/categorias
 * --------------------------------------------
 * Listar categorías de una edición.
 * 
 * @access Public
 * @param id_edicion ID de la edición
 */
export interface ListEdicionCategoriasEndpoint {
  method: 'GET';
  path: '/api/v1/ediciones/:id_edicion/categorias';
  params: { id_edicion: number };
  response: ApiResponse<EdicionCategoriaResponseDTO[]>;
}

/**
 * GET /api/v1/edicion-categorias/:id
 * ----------------------------------
 * Obtener edición-categoría por ID con detalles completos.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface GetEdicionCategoriaEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id';
  params: { id: number };
  response: ApiResponse<EdicionCategoriaResponseDTO>;
}

/**
 * POST /api/v1/ediciones/:id_edicion/categorias
 * ---------------------------------------------
 * Agregar categoría a una edición.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id_edicion ID de la edición
 * @body CreateEdicionCategoriaRequestDTO
 */
export interface CreateEdicionCategoriaEndpoint {
  method: 'POST';
  path: '/api/v1/ediciones/:id_edicion/categorias';
  params: { id_edicion: number };
  request: CreateEdicionCategoriaRequestDTO;
  response: ApiResponse<EdicionCategoriaResponseDTO>;
}

/**
 * PUT /api/v1/edicion-categorias/:id
 * ----------------------------------
 * Actualizar configuración de categoría en edición.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id ID de la edición-categoría
 * @body UpdateEdicionCategoriaRequestDTO
 */
export interface UpdateEdicionCategoriaEndpoint {
  method: 'PUT';
  path: '/api/v1/edicion-categorias/:id';
  params: { id: number };
  request: UpdateEdicionCategoriaRequestDTO;
  response: ApiResponse<EdicionCategoriaResponseDTO>;
}

/**
 * DELETE /api/v1/edicion-categorias/:id
 * -------------------------------------
 * Eliminar categoría de una edición.
 * Solo si no tiene equipos registrados.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id ID de la edición-categoría
 */
export interface DeleteEdicionCategoriaEndpoint {
  method: 'DELETE';
  path: '/api/v1/edicion-categorias/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// RESUMEN DE EDICIÓN-CATEGORÍA
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/resumen
 * ------------------------------------------
 * Obtener resumen de la categoría en la edición.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface GetEdicionCategoriaResumenEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/resumen';
  params: { id: number };
  response: ApiResponse<{
    id_edicion_categoria: number;
    categoria: string;
    edicion: number;
    torneo: string;
    equipos_count: number;
    jugadores_count: number;
    partidos_jugados: number;
    partidos_pendientes: number;
    goles_totales: number;
    fase_actual?: string;
  }>;
}
