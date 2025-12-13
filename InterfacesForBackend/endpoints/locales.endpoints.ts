/**
 * Locales Endpoints
 * =================
 * Contratos de API para gestión de locales deportivos.
 * 
 * Base URL: /api/v1/locales
 */

import {
  CreateLocalRequestDTO,
  UpdateLocalRequestDTO,
  LocalResponseDTO,
  LocalListItemDTO,
  LocalMapDTO
} from '../dtos/local.dto';
import { ApiResponse, PaginatedResponse, PaginationParams, LocationParams } from '../responses/api.responses';

// ============================================
// CRUD DE LOCALES
// ============================================

/**
 * GET /api/v1/locales
 * -------------------
 * Listar locales con paginación y filtros.
 * 
 * @access Public
 * @query page, limit, sort_by, sort_order
 * @query id_edicion_categoria - Filtrar por categoría
 * @query activo - Filtrar por estado
 * @query q - Búsqueda por nombre
 */
export interface ListLocalesEndpoint {
  method: 'GET';
  path: '/api/v1/locales';
  query: PaginationParams & {
    id_edicion_categoria?: number;
    activo?: boolean;
    q?: string;
  };
  response: PaginatedResponse<LocalListItemDTO>;
}

/**
 * GET /api/v1/locales/:id
 * -----------------------
 * Obtener local por ID.
 * 
 * @access Public
 * @param id ID del local
 */
export interface GetLocalEndpoint {
  method: 'GET';
  path: '/api/v1/locales/:id';
  params: { id: number };
  response: ApiResponse<LocalResponseDTO>;
}

/**
 * POST /api/v1/locales
 * --------------------
 * Crear nuevo local.
 * 
 * @access Admin (del torneo)
 * @body CreateLocalRequestDTO
 */
export interface CreateLocalEndpoint {
  method: 'POST';
  path: '/api/v1/locales';
  request: CreateLocalRequestDTO;
  response: ApiResponse<LocalResponseDTO>;
}

/**
 * PUT /api/v1/locales/:id
 * -----------------------
 * Actualizar local.
 * 
 * @access Admin (del torneo)
 * @param id ID del local
 * @body UpdateLocalRequestDTO
 */
export interface UpdateLocalEndpoint {
  method: 'PUT';
  path: '/api/v1/locales/:id';
  params: { id: number };
  request: UpdateLocalRequestDTO;
  response: ApiResponse<LocalResponseDTO>;
}

/**
 * DELETE /api/v1/locales/:id
 * --------------------------
 * Eliminar local (soft delete).
 * Solo si no tiene partidos programados.
 * 
 * @access Admin (del torneo)
 * @param id ID del local
 */
export interface DeleteLocalEndpoint {
  method: 'DELETE';
  path: '/api/v1/locales/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// FOTO DEL LOCAL
// ============================================

/**
 * POST /api/v1/locales/:id/foto
 * -----------------------------
 * Subir/actualizar foto del local.
 * 
 * @access Admin (del torneo)
 * @param id ID del local
 * @body multipart/form-data { foto: File }
 */
export interface UploadLocalFotoEndpoint {
  method: 'POST';
  path: '/api/v1/locales/:id/foto';
  params: { id: number };
  request: FormData; // { foto: File }
  response: ApiResponse<{ foto_url: string }>;
}

/**
 * DELETE /api/v1/locales/:id/foto
 * -------------------------------
 * Eliminar foto del local.
 * 
 * @access Admin (del torneo)
 * @param id ID del local
 */
export interface DeleteLocalFotoEndpoint {
  method: 'DELETE';
  path: '/api/v1/locales/:id/foto';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// BÚSQUEDA GEOGRÁFICA
// ============================================

/**
 * GET /api/v1/locales/cercanos
 * ----------------------------
 * Obtener locales cercanos a una ubicación.
 * 
 * @access Public
 * @query latitud, longitud - Coordenadas del usuario
 * @query radio_km - Radio de búsqueda en km (default: 10)
 * @query limit - Máximo resultados
 */
export interface GetLocalesCercanosEndpoint {
  method: 'GET';
  path: '/api/v1/locales/cercanos';
  query: LocationParams & {
    limit?: number;
  };
  response: ApiResponse<LocalListItemDTO[]>;
}

/**
 * GET /api/v1/locales/mapa
 * ------------------------
 * Obtener locales para mostrar en mapa.
 * 
 * @access Public
 * @query id_edicion_categoria - Filtrar por categoría
 */
export interface GetLocalesMapaEndpoint {
  method: 'GET';
  path: '/api/v1/locales/mapa';
  query: {
    id_edicion_categoria?: number;
  };
  response: ApiResponse<LocalMapDTO[]>;
}

// ============================================
// PARTIDOS EN LOCAL
// ============================================

/**
 * GET /api/v1/locales/:id/partidos
 * --------------------------------
 * Obtener partidos programados en un local.
 * 
 * @access Public
 * @param id ID del local
 * @query fecha_desde, fecha_hasta - Rango de fechas
 */
export interface GetPartidosLocalEndpoint {
  method: 'GET';
  path: '/api/v1/locales/:id/partidos';
  params: { id: number };
  query: {
    fecha_desde?: Date;
    fecha_hasta?: Date;
  };
  response: ApiResponse<{
    id_partido: number;
    fecha: Date | null;
    hora: string | null;
    cancha: string;
    local: string;
    visitante: string;
    estado: string;
  }[]>;
}

// ============================================
// DISPONIBILIDAD
// ============================================

/**
 * GET /api/v1/locales/:id/disponibilidad
 * --------------------------------------
 * Obtener disponibilidad de canchas del local.
 * 
 * @access Admin (del torneo)
 * @param id ID del local
 * @query fecha - Fecha a consultar
 */
export interface GetDisponibilidadLocalEndpoint {
  method: 'GET';
  path: '/api/v1/locales/:id/disponibilidad';
  params: { id: number };
  query: {
    fecha: Date;
  };
  response: ApiResponse<{
    fecha: Date;
    canchas: {
      id_cancha: number;
      nombre: string;
      horarios_ocupados: {
        hora_inicio: string;
        hora_fin: string;
        partido: {
          id_partido: number;
          equipos: string;
        };
      }[];
      horarios_disponibles: string[];
    }[];
  }>;
}
