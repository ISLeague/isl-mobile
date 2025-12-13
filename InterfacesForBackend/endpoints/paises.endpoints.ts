/**
 * Paises Endpoints
 * ================
 * Contratos de API para gestión de países.
 * 
 * Base URL: /api/v1/paises
 */

import {
  CreatePaisRequestDTO,
  UpdatePaisRequestDTO,
  PaisResponseDTO,
  PaisListItemDTO,
  PaisConTorneosDTO
} from '../dtos/pais.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// CRUD DE PAÍSES
// ============================================

/**
 * GET /api/v1/paises
 * ------------------
 * Listar todos los países activos.
 * 
 * @access Public
 * @query activo - Filtrar por estado (default: true)
 */
export interface ListPaisesEndpoint {
  method: 'GET';
  path: '/api/v1/paises';
  query: {
    activo?: boolean;
  };
  response: ApiResponse<PaisListItemDTO[]>;
}

/**
 * GET /api/v1/paises/:id
 * ----------------------
 * Obtener país por ID.
 * 
 * @access Public
 * @param id ID del país
 */
export interface GetPaisEndpoint {
  method: 'GET';
  path: '/api/v1/paises/:id';
  params: { id: number };
  response: ApiResponse<PaisResponseDTO>;
}

/**
 * GET /api/v1/paises/:id/torneos
 * ------------------------------
 * Obtener país con sus torneos.
 * 
 * @access Public
 * @param id ID del país
 */
export interface GetPaisConTorneosEndpoint {
  method: 'GET';
  path: '/api/v1/paises/:id/torneos';
  params: { id: number };
  response: ApiResponse<PaisConTorneosDTO>;
}

/**
 * POST /api/v1/paises
 * -------------------
 * Crear nuevo país.
 * 
 * @access SuperAdmin
 * @body CreatePaisRequestDTO
 */
export interface CreatePaisEndpoint {
  method: 'POST';
  path: '/api/v1/paises';
  request: CreatePaisRequestDTO;
  response: ApiResponse<PaisResponseDTO>;
}

/**
 * PUT /api/v1/paises/:id
 * ----------------------
 * Actualizar país.
 * 
 * @access SuperAdmin
 * @param id ID del país
 * @body UpdatePaisRequestDTO
 */
export interface UpdatePaisEndpoint {
  method: 'PUT';
  path: '/api/v1/paises/:id';
  params: { id: number };
  request: UpdatePaisRequestDTO;
  response: ApiResponse<PaisResponseDTO>;
}

/**
 * DELETE /api/v1/paises/:id
 * -------------------------
 * Eliminar país (soft delete).
 * Solo si no tiene torneos asociados.
 * 
 * @access SuperAdmin
 * @param id ID del país
 */
export interface DeletePaisEndpoint {
  method: 'DELETE';
  path: '/api/v1/paises/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// SELECCIÓN DE PAÍS (USUARIOS)
// ============================================

/**
 * GET /api/v1/paises/disponibles
 * ------------------------------
 * Obtener países con torneos activos (para selección inicial).
 * 
 * @access Public
 */
export interface GetPaisesDisponiblesEndpoint {
  method: 'GET';
  path: '/api/v1/paises/disponibles';
  response: ApiResponse<PaisConTorneosDTO[]>;
}
