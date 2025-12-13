/**
 * Jugadores Endpoints
 * ===================
 * Contratos de API para gestión de jugadores y plantillas.
 * 
 * Base URL: /api/v1/jugadores
 */

import {
  CreateJugadorRequestDTO,
  UpdateJugadorRequestDTO,
  AgregarJugadorPlantillaRequestDTO,
  ActualizarPlantillaRequestDTO,
  JugadorResponseDTO,
  JugadorDetalleDTO,
  JugadorListItemDTO,
  JugadorEstadisticasDTO,
  JugadorPlantillaDTO
} from '../dtos/jugador.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// CRUD DE JUGADORES
// ============================================

/**
 * GET /api/v1/jugadores
 * ---------------------
 * Listar jugadores con paginación y filtros.
 * 
 * @access Admin (del torneo)
 * @query page, limit, sort_by, sort_order
 * @query estado - Filtrar por estado
 * @query posicion - Filtrar por posición
 * @query q - Búsqueda por nombre o DNI
 */
export interface ListJugadoresEndpoint {
  method: 'GET';
  path: '/api/v1/jugadores';
  query: PaginationParams & {
    estado?: 'activo' | 'inactivo' | 'suspendido' | 'lesionado';
    posicion?: string;
    q?: string;
  };
  response: PaginatedResponse<JugadorListItemDTO>;
}

/**
 * GET /api/v1/jugadores/:id
 * -------------------------
 * Obtener jugador por ID.
 * 
 * @access Public
 * @param id ID del jugador
 */
export interface GetJugadorEndpoint {
  method: 'GET';
  path: '/api/v1/jugadores/:id';
  params: { id: number };
  response: ApiResponse<JugadorResponseDTO>;
}

/**
 * GET /api/v1/jugadores/:id/detalle
 * ---------------------------------
 * Obtener jugador con detalles completos.
 * 
 * @access Public
 * @param id ID del jugador
 */
export interface GetJugadorDetalleEndpoint {
  method: 'GET';
  path: '/api/v1/jugadores/:id/detalle';
  params: { id: number };
  response: ApiResponse<JugadorDetalleDTO>;
}

/**
 * GET /api/v1/jugadores/dni/:dni
 * ------------------------------
 * Buscar jugador por DNI.
 * 
 * @access Admin (del torneo)
 * @param dni DNI del jugador
 */
export interface GetJugadorByDNIEndpoint {
  method: 'GET';
  path: '/api/v1/jugadores/dni/:dni';
  params: { dni: string };
  response: ApiResponse<JugadorResponseDTO>;
}

/**
 * POST /api/v1/jugadores
 * ----------------------
 * Crear nuevo jugador.
 * 
 * @access Admin (del torneo)
 * @body CreateJugadorRequestDTO
 */
export interface CreateJugadorEndpoint {
  method: 'POST';
  path: '/api/v1/jugadores';
  request: CreateJugadorRequestDTO;
  response: ApiResponse<JugadorResponseDTO>;
}

/**
 * PUT /api/v1/jugadores/:id
 * -------------------------
 * Actualizar jugador.
 * 
 * @access Admin (del torneo)
 * @param id ID del jugador
 * @body UpdateJugadorRequestDTO
 */
export interface UpdateJugadorEndpoint {
  method: 'PUT';
  path: '/api/v1/jugadores/:id';
  params: { id: number };
  request: UpdateJugadorRequestDTO;
  response: ApiResponse<JugadorResponseDTO>;
}

/**
 * DELETE /api/v1/jugadores/:id
 * ----------------------------
 * Eliminar jugador (soft delete).
 * 
 * @access Admin (del torneo)
 * @param id ID del jugador
 */
export interface DeleteJugadorEndpoint {
  method: 'DELETE';
  path: '/api/v1/jugadores/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// FOTO DEL JUGADOR
// ============================================

/**
 * POST /api/v1/jugadores/:id/foto
 * -------------------------------
 * Subir/actualizar foto del jugador.
 * 
 * @access Admin (del torneo)
 * @param id ID del jugador
 * @body multipart/form-data { foto: File }
 */
export interface UploadJugadorFotoEndpoint {
  method: 'POST';
  path: '/api/v1/jugadores/:id/foto';
  params: { id: number };
  request: FormData; // { foto: File }
  response: ApiResponse<{ foto_url: string }>;
}

/**
 * DELETE /api/v1/jugadores/:id/foto
 * ---------------------------------
 * Eliminar foto del jugador.
 * 
 * @access Admin (del torneo)
 * @param id ID del jugador
 */
export interface DeleteJugadorFotoEndpoint {
  method: 'DELETE';
  path: '/api/v1/jugadores/:id/foto';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// PLANTILLA DE EQUIPOS
// ============================================

/**
 * GET /api/v1/equipos/:id_equipo/plantilla
 * ----------------------------------------
 * Obtener plantilla de un equipo.
 * 
 * @access Public
 * @param id_equipo ID del equipo
 * @query activos_solo - Solo jugadores activos (default: true)
 */
export interface GetPlantillaEquipoEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id_equipo/plantilla';
  params: { id_equipo: number };
  query: {
    activos_solo?: boolean;
  };
  response: ApiResponse<JugadorPlantillaDTO[]>;
}

/**
 * POST /api/v1/equipos/:id_equipo/plantilla
 * -----------------------------------------
 * Agregar jugador a la plantilla del equipo.
 * 
 * @access Admin (del torneo)
 * @param id_equipo ID del equipo
 * @body AgregarJugadorPlantillaRequestDTO
 */
export interface AgregarJugadorPlantillaEndpoint {
  method: 'POST';
  path: '/api/v1/equipos/:id_equipo/plantilla';
  params: { id_equipo: number };
  request: AgregarJugadorPlantillaRequestDTO;
  response: ApiResponse<{ message: string }>;
}

/**
 * PUT /api/v1/equipos/:id_equipo/plantilla/:id_jugador
 * ----------------------------------------------------
 * Actualizar jugador en la plantilla.
 * 
 * @access Admin (del torneo)
 * @param id_equipo ID del equipo
 * @param id_jugador ID del jugador
 * @body ActualizarPlantillaRequestDTO
 */
export interface UpdateJugadorPlantillaEndpoint {
  method: 'PUT';
  path: '/api/v1/equipos/:id_equipo/plantilla/:id_jugador';
  params: { id_equipo: number; id_jugador: number };
  request: ActualizarPlantillaRequestDTO;
  response: ApiResponse<{ message: string }>;
}

/**
 * DELETE /api/v1/equipos/:id_equipo/plantilla/:id_jugador
 * -------------------------------------------------------
 * Dar de baja jugador de la plantilla.
 * 
 * @access Admin (del torneo)
 * @param id_equipo ID del equipo
 * @param id_jugador ID del jugador
 * @body { motivo_baja?: string }
 */
export interface BajaJugadorPlantillaEndpoint {
  method: 'DELETE';
  path: '/api/v1/equipos/:id_equipo/plantilla/:id_jugador';
  params: { id_equipo: number; id_jugador: number };
  request: { motivo_baja?: string };
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/equipos/:id_equipo/capitan
 * ---------------------------------------
 * Asignar capitán del equipo.
 * 
 * @access Admin (del torneo)
 * @param id_equipo ID del equipo
 * @body { id_jugador: number }
 */
export interface AsignarCapitanEndpoint {
  method: 'POST';
  path: '/api/v1/equipos/:id_equipo/capitan';
  params: { id_equipo: number };
  request: { id_jugador: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// ESTADÍSTICAS DE JUGADORES
// ============================================

/**
 * GET /api/v1/jugadores/:id/estadisticas
 * --------------------------------------
 * Obtener estadísticas del jugador en la edición actual.
 * 
 * @access Public
 * @param id ID del jugador
 */
export interface GetJugadorEstadisticasEndpoint {
  method: 'GET';
  path: '/api/v1/jugadores/:id/estadisticas';
  params: { id: number };
  response: ApiResponse<JugadorEstadisticasDTO>;
}

/**
 * GET /api/v1/jugadores/:id/historial
 * -----------------------------------
 * Obtener historial del jugador en ediciones anteriores.
 * 
 * @access Public
 * @param id ID del jugador
 */
export interface GetJugadorHistorialEndpoint {
  method: 'GET';
  path: '/api/v1/jugadores/:id/historial';
  params: { id: number };
  response: ApiResponse<{
    id_jugador: number;
    nombre: string;
    ediciones: {
      id_edicion: number;
      numero: number;
      torneo: string;
      equipo: string;
      partidos: number;
      goles: number;
      asistencias: number;
      amarillas: number;
      rojas: number;
    }[];
  }>;
}

// ============================================
// BÚSQUEDA DE JUGADORES
// ============================================

/**
 * GET /api/v1/jugadores/buscar
 * ----------------------------
 * Buscar jugadores por nombre o DNI.
 * 
 * @access Admin (del torneo)
 * @query q - Término de búsqueda
 * @query sin_equipo - Solo jugadores sin equipo actual
 * @query limit - Máximo resultados (default: 10)
 */
export interface BuscarJugadoresEndpoint {
  method: 'GET';
  path: '/api/v1/jugadores/buscar';
  query: {
    q: string;
    sin_equipo?: boolean;
    limit?: number;
  };
  response: ApiResponse<JugadorListItemDTO[]>;
}

// ============================================
// VALIDACIONES
// ============================================

/**
 * POST /api/v1/jugadores/validar-dni
 * ----------------------------------
 * Validar si un DNI ya está registrado.
 * 
 * @access Admin (del torneo)
 * @body { dni: string }
 */
export interface ValidarDNIEndpoint {
  method: 'POST';
  path: '/api/v1/jugadores/validar-dni';
  request: { dni: string };
  response: ApiResponse<{
    existe: boolean;
    jugador?: JugadorResponseDTO;
  }>;
}

/**
 * POST /api/v1/jugadores/:id/validar-edad
 * ---------------------------------------
 * Validar si jugador cumple restricción de edad para una categoría.
 * 
 * @access Admin (del torneo)
 * @param id ID del jugador
 * @body { id_categoria: number }
 */
export interface ValidarEdadJugadorEndpoint {
  method: 'POST';
  path: '/api/v1/jugadores/:id/validar-edad';
  params: { id: number };
  request: { id_categoria: number };
  response: ApiResponse<{
    cumple_requisito: boolean;
    edad_jugador: number;
    edad_minima: number | null;
    edad_maxima: number | null;
    mensaje?: string;
  }>;
}
