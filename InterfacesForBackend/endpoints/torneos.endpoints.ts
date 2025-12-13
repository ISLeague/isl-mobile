/**
 * Torneos Endpoints
 * =================
 * Contratos de API para gestión de torneos.
 * 
 * Base URL: /api/v1/torneos
 */

import {
  CreateTorneoRequestDTO,
  UpdateTorneoRequestDTO,
  TorneoResponseDTO,
  TorneoListItemDTO
} from '../dtos/torneo.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// CRUD DE TORNEOS
// ============================================

/**
 * GET /api/v1/torneos
 * -------------------
 * Listar torneos con paginación y filtros.
 * 
 * @access Public
 * @query page, limit, sort_by, sort_order
 * @query id_pais - Filtrar por país
 * @query activo - Filtrar por estado
 * @query q - Búsqueda por nombre
 */
export interface ListTorneosEndpoint {
  method: 'GET';
  path: '/api/v1/torneos';
  query: PaginationParams & {
    id_pais?: number;
    activo?: boolean;
    q?: string;
  };
  response: PaginatedResponse<TorneoListItemDTO>;
}

/**
 * GET /api/v1/torneos/:id
 * -----------------------
 * Obtener torneo por ID con detalles.
 * 
 * @access Public
 * @param id ID del torneo
 */
export interface GetTorneoEndpoint {
  method: 'GET';
  path: '/api/v1/torneos/:id';
  params: { id: number };
  response: ApiResponse<TorneoResponseDTO>;
}

/**
 * POST /api/v1/torneos
 * --------------------
 * Crear nuevo torneo.
 * 
 * @access SuperAdmin
 * @body CreateTorneoRequestDTO
 */
export interface CreateTorneoEndpoint {
  method: 'POST';
  path: '/api/v1/torneos';
  request: CreateTorneoRequestDTO;
  response: ApiResponse<TorneoResponseDTO>;
}

/**
 * PUT /api/v1/torneos/:id
 * -----------------------
 * Actualizar torneo.
 * 
 * @access SuperAdmin
 * @param id ID del torneo
 * @body UpdateTorneoRequestDTO
 */
export interface UpdateTorneoEndpoint {
  method: 'PUT';
  path: '/api/v1/torneos/:id';
  params: { id: number };
  request: UpdateTorneoRequestDTO;
  response: ApiResponse<TorneoResponseDTO>;
}

/**
 * DELETE /api/v1/torneos/:id
 * --------------------------
 * Eliminar torneo (soft delete).
 * Solo si no tiene ediciones activas.
 * 
 * @access SuperAdmin
 * @param id ID del torneo
 */
export interface DeleteTorneoEndpoint {
  method: 'DELETE';
  path: '/api/v1/torneos/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// LOGO DEL TORNEO
// ============================================

/**
 * POST /api/v1/torneos/:id/logo
 * -----------------------------
 * Subir/actualizar logo del torneo.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id ID del torneo
 * @body multipart/form-data { logo: File }
 */
export interface UploadTorneoLogoEndpoint {
  method: 'POST';
  path: '/api/v1/torneos/:id/logo';
  params: { id: number };
  request: FormData; // { logo: File }
  response: ApiResponse<{ logo_url: string }>;
}

/**
 * DELETE /api/v1/torneos/:id/logo
 * -------------------------------
 * Eliminar logo del torneo.
 * 
 * @access SuperAdmin, Admin (del torneo)
 * @param id ID del torneo
 */
export interface DeleteTorneoLogoEndpoint {
  method: 'DELETE';
  path: '/api/v1/torneos/:id/logo';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// TORNEOS POR PAÍS
// ============================================

/**
 * GET /api/v1/paises/:id_pais/torneos
 * -----------------------------------
 * Obtener torneos de un país.
 * 
 * @access Public
 * @param id_pais ID del país
 * @query activo - Filtrar por estado
 */
export interface GetTorneosByPaisEndpoint {
  method: 'GET';
  path: '/api/v1/paises/:id_pais/torneos';
  params: { id_pais: number };
  query: {
    activo?: boolean;
  };
  response: ApiResponse<TorneoListItemDTO[]>;
}

// ============================================
// MIS TORNEOS (ADMIN)
// ============================================

/**
 * GET /api/v1/torneos/mis-torneos
 * -------------------------------
 * Obtener torneos asignados al admin autenticado.
 * 
 * @access Admin
 */
export interface GetMisTorneosEndpoint {
  method: 'GET';
  path: '/api/v1/torneos/mis-torneos';
  response: ApiResponse<TorneoListItemDTO[]>;
}
