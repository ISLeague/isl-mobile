/**
 * Usuarios Endpoints
 * ==================
 * Contratos de API para gestión de usuarios.
 * 
 * Base URL: /api/v1/usuarios
 */

import {
  CreateUsuarioRequestDTO,
  UpdateUsuarioRequestDTO,
  UpdateUsuarioRolRequestDTO,
  AsignarAdminTorneoRequestDTO,
  UsuarioResponseDTO,
  UsuarioListItemDTO,
  UsuarioPerfilDTO
} from '../dtos/usuario.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// CRUD DE USUARIOS (SUPERADMIN)
// ============================================

/**
 * GET /api/v1/usuarios
 * --------------------
 * Listar todos los usuarios con paginación.
 * 
 * @access SuperAdmin
 * @query page, limit, sort_by, sort_order
 * @query rol - Filtrar por rol
 * @query id_pais - Filtrar por país
 * @query activo - Filtrar por estado
 * @query q - Búsqueda por email o nombre
 */
export interface ListUsuariosEndpoint {
  method: 'GET';
  path: '/api/v1/usuarios';
  query: PaginationParams & {
    rol?: 'superadmin' | 'admin' | 'fan' | 'invitado';
    id_pais?: number;
    activo?: boolean;
    q?: string;
  };
  response: PaginatedResponse<UsuarioListItemDTO>;
}

/**
 * GET /api/v1/usuarios/:id
 * ------------------------
 * Obtener usuario por ID.
 * 
 * @access SuperAdmin, Admin (solo usuarios de sus torneos)
 * @param id ID del usuario
 */
export interface GetUsuarioEndpoint {
  method: 'GET';
  path: '/api/v1/usuarios/:id';
  params: { id: number };
  response: ApiResponse<UsuarioResponseDTO>;
}

/**
 * POST /api/v1/usuarios
 * ---------------------
 * Crear nuevo usuario (solo admin o jugador).
 * 
 * @access SuperAdmin
 * @body CreateUsuarioRequestDTO
 */
export interface CreateUsuarioEndpoint {
  method: 'POST';
  path: '/api/v1/usuarios';
  request: CreateUsuarioRequestDTO;
  response: ApiResponse<UsuarioResponseDTO>;
}

/**
 * PUT /api/v1/usuarios/:id
 * ------------------------
 * Actualizar usuario.
 * 
 * @access SuperAdmin, Admin (solo jugadores de sus torneos)
 * @param id ID del usuario
 * @body UpdateUsuarioRequestDTO
 */
export interface UpdateUsuarioEndpoint {
  method: 'PUT';
  path: '/api/v1/usuarios/:id';
  params: { id: number };
  request: UpdateUsuarioRequestDTO;
  response: ApiResponse<UsuarioResponseDTO>;
}

/**
 * DELETE /api/v1/usuarios/:id
 * ---------------------------
 * Eliminar usuario (soft delete).
 * 
 * @access SuperAdmin
 * @param id ID del usuario
 */
export interface DeleteUsuarioEndpoint {
  method: 'DELETE';
  path: '/api/v1/usuarios/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// GESTIÓN DE ROLES Y PERMISOS
// ============================================

/**
 * PUT /api/v1/usuarios/:id/rol
 * ----------------------------
 * Cambiar rol de usuario.
 * 
 * @access SuperAdmin
 * @param id ID del usuario
 * @body UpdateUsuarioRolRequestDTO
 */
export interface UpdateUsuarioRolEndpoint {
  method: 'PUT';
  path: '/api/v1/usuarios/:id/rol';
  params: { id: number };
  request: UpdateUsuarioRolRequestDTO;
  response: ApiResponse<UsuarioResponseDTO>;
}

/**
 * POST /api/v1/usuarios/asignar-admin-torneo
 * ------------------------------------------
 * Asignar admin a torneos específicos.
 * 
 * @access SuperAdmin
 * @body AsignarAdminTorneoRequestDTO
 */
export interface AsignarAdminTorneoEndpoint {
  method: 'POST';
  path: '/api/v1/usuarios/asignar-admin-torneo';
  request: AsignarAdminTorneoRequestDTO;
  response: ApiResponse<UsuarioResponseDTO>;
}

/**
 * DELETE /api/v1/usuarios/:id/torneos/:id_torneo
 * ----------------------------------------------
 * Quitar acceso de admin a un torneo.
 * 
 * @access SuperAdmin
 * @param id ID del usuario admin
 * @param id_torneo ID del torneo
 */
export interface RemoverAdminTorneoEndpoint {
  method: 'DELETE';
  path: '/api/v1/usuarios/:id/torneos/:id_torneo';
  params: { id: number; id_torneo: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// PERFIL DE USUARIO
// ============================================

/**
 * GET /api/v1/usuarios/perfil
 * ---------------------------
 * Obtener perfil del usuario autenticado.
 * 
 * @access Authenticated
 */
export interface GetMiPerfilEndpoint {
  method: 'GET';
  path: '/api/v1/usuarios/perfil';
  response: ApiResponse<UsuarioPerfilDTO>;
}

/**
 * PUT /api/v1/usuarios/perfil
 * ---------------------------
 * Actualizar perfil del usuario autenticado.
 * 
 * @access Authenticated
 * @body Partial<UpdateUsuarioRequestDTO>
 */
export interface UpdateMiPerfilEndpoint {
  method: 'PUT';
  path: '/api/v1/usuarios/perfil';
  request: Partial<UpdateUsuarioRequestDTO>;
  response: ApiResponse<UsuarioPerfilDTO>;
}

/**
 * POST /api/v1/usuarios/perfil/avatar
 * -----------------------------------
 * Subir/actualizar avatar del usuario.
 * 
 * @access Authenticated
 * @body multipart/form-data { avatar: File }
 */
export interface UploadAvatarEndpoint {
  method: 'POST';
  path: '/api/v1/usuarios/perfil/avatar';
  request: FormData; // { avatar: File }
  response: ApiResponse<{ avatar_url: string }>;
}

/**
 * DELETE /api/v1/usuarios/perfil/avatar
 * -------------------------------------
 * Eliminar avatar del usuario.
 * 
 * @access Authenticated
 */
export interface DeleteAvatarEndpoint {
  method: 'DELETE';
  path: '/api/v1/usuarios/perfil/avatar';
  response: ApiResponse<{ message: string }>;
}

// ============================================
// ADMINS DE TORNEOS
// ============================================

/**
 * GET /api/v1/usuarios/admins
 * ---------------------------
 * Listar todos los administradores.
 * 
 * @access SuperAdmin
 * @query id_torneo - Filtrar por torneo asignado
 */
export interface ListAdminsEndpoint {
  method: 'GET';
  path: '/api/v1/usuarios/admins';
  query: {
    id_torneo?: number;
  };
  response: ApiResponse<UsuarioListItemDTO[]>;
}

/**
 * GET /api/v1/torneos/:id_torneo/admins
 * -------------------------------------
 * Listar admins de un torneo específico.
 * 
 * @access SuperAdmin
 * @param id_torneo ID del torneo
 */
export interface ListAdminsTorneoEndpoint {
  method: 'GET';
  path: '/api/v1/torneos/:id_torneo/admins';
  params: { id_torneo: number };
  response: ApiResponse<UsuarioListItemDTO[]>;
}
