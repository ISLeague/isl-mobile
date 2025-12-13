/**
 * Equipos Endpoints
 * =================
 * Contratos de API para gestión de equipos.
 * 
 * Base URL: /api/v1/equipos
 */

import {
  CreateEquipoRequestDTO,
  UpdateEquipoRequestDTO,
  AsignarGrupoRequestDTO,
  EquipoResponseDTO,
  EquipoListItemDTO,
  EquipoDetalleDTO,
  EquipoEstadisticasDTO
} from '../dtos/equipo.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// CRUD DE EQUIPOS
// ============================================

/**
 * GET /api/v1/equipos
 * -------------------
 * Listar equipos con paginación y filtros.
 * 
 * @access Public
 * @query page, limit, sort_by, sort_order
 * @query id_edicion_categoria - Filtrar por edición-categoría
 * @query activo - Filtrar por estado
 * @query q - Búsqueda por nombre
 */
export interface ListEquiposEndpoint {
  method: 'GET';
  path: '/api/v1/equipos';
  query: PaginationParams & {
    id_edicion_categoria?: number;
    activo?: boolean;
    q?: string;
  };
  response: PaginatedResponse<EquipoListItemDTO>;
}

/**
 * GET /api/v1/edicion-categorias/:id/equipos
 * ------------------------------------------
 * Listar equipos de una edición-categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface ListEquiposByEdicionCategoriaEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/equipos';
  params: { id: number };
  response: ApiResponse<EquipoListItemDTO[]>;
}

/**
 * GET /api/v1/equipos/:id
 * -----------------------
 * Obtener equipo por ID.
 * 
 * @access Public
 * @param id ID del equipo
 */
export interface GetEquipoEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id';
  params: { id: number };
  response: ApiResponse<EquipoResponseDTO>;
}

/**
 * GET /api/v1/equipos/:id/detalle
 * -------------------------------
 * Obtener equipo con detalles completos (jugadores, estadísticas).
 * 
 * @access Public
 * @param id ID del equipo
 */
export interface GetEquipoDetalleEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id/detalle';
  params: { id: number };
  response: ApiResponse<EquipoDetalleDTO>;
}

/**
 * POST /api/v1/equipos
 * --------------------
 * Crear nuevo equipo.
 * 
 * @access Admin (del torneo)
 * @body CreateEquipoRequestDTO
 */
export interface CreateEquipoEndpoint {
  method: 'POST';
  path: '/api/v1/equipos';
  request: CreateEquipoRequestDTO;
  response: ApiResponse<EquipoResponseDTO>;
}

/**
 * PUT /api/v1/equipos/:id
 * -----------------------
 * Actualizar equipo.
 * 
 * @access Admin (del torneo)
 * @param id ID del equipo
 * @body UpdateEquipoRequestDTO
 */
export interface UpdateEquipoEndpoint {
  method: 'PUT';
  path: '/api/v1/equipos/:id';
  params: { id: number };
  request: UpdateEquipoRequestDTO;
  response: ApiResponse<EquipoResponseDTO>;
}

/**
 * DELETE /api/v1/equipos/:id
 * --------------------------
 * Eliminar equipo (soft delete).
 * Solo si no tiene partidos jugados.
 * 
 * @access Admin (del torneo)
 * @param id ID del equipo
 */
export interface DeleteEquipoEndpoint {
  method: 'DELETE';
  path: '/api/v1/equipos/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// LOGO DEL EQUIPO
// ============================================

/**
 * POST /api/v1/equipos/:id/logo
 * -----------------------------
 * Subir/actualizar logo del equipo.
 * 
 * @access Admin (del torneo)
 * @param id ID del equipo
 * @body multipart/form-data { logo: File }
 */
export interface UploadEquipoLogoEndpoint {
  method: 'POST';
  path: '/api/v1/equipos/:id/logo';
  params: { id: number };
  request: FormData; // { logo: File }
  response: ApiResponse<{ logo_url: string }>;
}

/**
 * DELETE /api/v1/equipos/:id/logo
 * -------------------------------
 * Eliminar logo del equipo.
 * 
 * @access Admin (del torneo)
 * @param id ID del equipo
 */
export interface DeleteEquipoLogoEndpoint {
  method: 'DELETE';
  path: '/api/v1/equipos/:id/logo';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// ASIGNACIÓN A GRUPOS
// ============================================

/**
 * POST /api/v1/equipos/:id/asignar-grupo
 * --------------------------------------
 * Asignar equipo a un grupo.
 * 
 * @access Admin (del torneo)
 * @param id ID del equipo
 * @body { id_grupo: number }
 */
export interface AsignarEquipoGrupoEndpoint {
  method: 'POST';
  path: '/api/v1/equipos/:id/asignar-grupo';
  params: { id: number };
  request: { id_grupo: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * DELETE /api/v1/equipos/:id/grupo
 * --------------------------------
 * Quitar equipo de su grupo.
 * 
 * @access Admin (del torneo)
 * @param id ID del equipo
 */
export interface RemoverEquipoGrupoEndpoint {
  method: 'DELETE';
  path: '/api/v1/equipos/:id/grupo';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/grupos/:id_grupo/equipos
 * -------------------------------------
 * Asignar múltiples equipos a un grupo.
 * 
 * @access Admin (del torneo)
 * @param id_grupo ID del grupo
 * @body { id_equipos: number[] }
 */
export interface AsignarEquiposGrupoEndpoint {
  method: 'POST';
  path: '/api/v1/grupos/:id_grupo/equipos';
  params: { id_grupo: number };
  request: { id_equipos: number[] };
  response: ApiResponse<{ message: string; equipos_asignados: number }>;
}

// ============================================
// ESTADÍSTICAS DEL EQUIPO
// ============================================

/**
 * GET /api/v1/equipos/:id/estadisticas
 * ------------------------------------
 * Obtener estadísticas del equipo en la edición actual.
 * 
 * @access Public
 * @param id ID del equipo
 */
export interface GetEquipoEstadisticasEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id/estadisticas';
  params: { id: number };
  response: ApiResponse<EquipoEstadisticasDTO>;
}

/**
 * GET /api/v1/equipos/:id/partidos
 * --------------------------------
 * Obtener partidos del equipo.
 * 
 * @access Public
 * @param id ID del equipo
 * @query estado - Filtrar por estado del partido
 * @query limit - Limitar cantidad
 */
export interface GetEquipoPartidosEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id/partidos';
  params: { id: number };
  query: {
    estado?: 'Pendiente' | 'En curso' | 'Finalizado';
    limit?: number;
  };
  response: ApiResponse<{
    proximos: any[];
    jugados: any[];
  }>;
}

/**
 * GET /api/v1/equipos/:id/historial
 * ---------------------------------
 * Obtener historial del equipo en ediciones anteriores.
 * 
 * @access Public
 * @param id ID del equipo
 */
export interface GetEquipoHistorialEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id/historial';
  params: { id: number };
  response: ApiResponse<{
    id_equipo: number;
    nombre: string;
    ediciones: {
      id_edicion: number;
      numero: number;
      torneo: string;
      fase_final: string;
      posicion: number | null;
      copa: string | null;
      es_campeon: boolean;
    }[];
  }>;
}

// ============================================
// BÚSQUEDA DE EQUIPOS
// ============================================

/**
 * GET /api/v1/equipos/buscar
 * --------------------------
 * Buscar equipos por nombre.
 * 
 * @access Public
 * @query q - Término de búsqueda
 * @query id_edicion_categoria - Limitar a una categoría
 * @query limit - Máximo resultados (default: 10)
 */
export interface BuscarEquiposEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/buscar';
  query: {
    q: string;
    id_edicion_categoria?: number;
    limit?: number;
  };
  response: ApiResponse<EquipoListItemDTO[]>;
}
