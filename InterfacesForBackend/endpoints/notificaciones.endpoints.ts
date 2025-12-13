/**
 * Notificaciones Endpoints
 * ========================
 * Contratos de API para gestión de notificaciones.
 * 
 * Base URL: /api/v1/notificaciones
 */

import {
  CreateNotificacionRequestDTO,
  EnviarNotificacionMasivaRequestDTO,
  MarcarLeidaRequestDTO,
  NotificacionResponseDTO,
  NotificacionListResponseDTO,
  NotificacionEnviadaResponseDTO,
  ConfigNotificacionesUsuarioDTO,
  UpdateConfigNotificacionesDTO
} from '../dtos/notificacion.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// NOTIFICACIONES DEL USUARIO
// ============================================

/**
 * GET /api/v1/notificaciones
 * --------------------------
 * Obtener notificaciones del usuario autenticado.
 * 
 * @access Authenticated
 * @query page, limit
 * @query leidas - Filtrar por estado de lectura
 * @query tipo - Filtrar por tipo
 */
export interface GetMisNotificacionesEndpoint {
  method: 'GET';
  path: '/api/v1/notificaciones';
  query: PaginationParams & {
    leidas?: boolean;
    tipo?: string;
  };
  response: ApiResponse<NotificacionListResponseDTO>;
}

/**
 * GET /api/v1/notificaciones/no-leidas/count
 * ------------------------------------------
 * Obtener cantidad de notificaciones no leídas.
 * 
 * @access Authenticated
 */
export interface GetNotificacionesNoLeidasCountEndpoint {
  method: 'GET';
  path: '/api/v1/notificaciones/no-leidas/count';
  response: ApiResponse<{ count: number }>;
}

/**
 * GET /api/v1/notificaciones/:id
 * ------------------------------
 * Obtener notificación por ID.
 * 
 * @access Authenticated
 * @param id ID de la notificación
 */
export interface GetNotificacionEndpoint {
  method: 'GET';
  path: '/api/v1/notificaciones/:id';
  params: { id: number };
  response: ApiResponse<NotificacionResponseDTO>;
}

/**
 * PUT /api/v1/notificaciones/:id/leer
 * -----------------------------------
 * Marcar notificación como leída.
 * 
 * @access Authenticated
 * @param id ID de la notificación
 */
export interface MarcarNotificacionLeidaEndpoint {
  method: 'PUT';
  path: '/api/v1/notificaciones/:id/leer';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * PUT /api/v1/notificaciones/leer-todas
 * -------------------------------------
 * Marcar todas las notificaciones como leídas.
 * 
 * @access Authenticated
 */
export interface MarcarTodasLeidasEndpoint {
  method: 'PUT';
  path: '/api/v1/notificaciones/leer-todas';
  response: ApiResponse<{ message: string; marcadas: number }>;
}

/**
 * PUT /api/v1/notificaciones/leer-multiple
 * ----------------------------------------
 * Marcar múltiples notificaciones como leídas.
 * 
 * @access Authenticated
 * @body MarcarLeidaRequestDTO
 */
export interface MarcarMultiplesLeidasEndpoint {
  method: 'PUT';
  path: '/api/v1/notificaciones/leer-multiple';
  request: MarcarLeidaRequestDTO;
  response: ApiResponse<{ message: string; marcadas: number }>;
}

/**
 * DELETE /api/v1/notificaciones/:id
 * ---------------------------------
 * Eliminar notificación.
 * 
 * @access Authenticated
 * @param id ID de la notificación
 */
export interface DeleteNotificacionEndpoint {
  method: 'DELETE';
  path: '/api/v1/notificaciones/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * DELETE /api/v1/notificaciones/limpiar
 * -------------------------------------
 * Eliminar todas las notificaciones leídas.
 * 
 * @access Authenticated
 */
export interface LimpiarNotificacionesEndpoint {
  method: 'DELETE';
  path: '/api/v1/notificaciones/limpiar';
  response: ApiResponse<{ message: string; eliminadas: number }>;
}

// ============================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================

/**
 * GET /api/v1/notificaciones/config
 * ---------------------------------
 * Obtener configuración de notificaciones del usuario.
 * 
 * @access Authenticated
 */
export interface GetConfigNotificacionesEndpoint {
  method: 'GET';
  path: '/api/v1/notificaciones/config';
  response: ApiResponse<ConfigNotificacionesUsuarioDTO>;
}

/**
 * PUT /api/v1/notificaciones/config
 * ---------------------------------
 * Actualizar configuración de notificaciones.
 * 
 * @access Authenticated
 * @body UpdateConfigNotificacionesDTO
 */
export interface UpdateConfigNotificacionesEndpoint {
  method: 'PUT';
  path: '/api/v1/notificaciones/config';
  request: UpdateConfigNotificacionesDTO;
  response: ApiResponse<ConfigNotificacionesUsuarioDTO>;
}

// ============================================
// ENVÍO DE NOTIFICACIONES (ADMIN)
// ============================================

/**
 * POST /api/v1/notificaciones/enviar
 * ----------------------------------
 * Enviar notificación a usuario específico.
 * 
 * @access Admin (del torneo)
 * @body CreateNotificacionRequestDTO
 */
export interface EnviarNotificacionEndpoint {
  method: 'POST';
  path: '/api/v1/notificaciones/enviar';
  request: CreateNotificacionRequestDTO;
  response: ApiResponse<NotificacionEnviadaResponseDTO>;
}

/**
 * POST /api/v1/notificaciones/enviar-masiva
 * -----------------------------------------
 * Enviar notificación masiva.
 * 
 * @access Admin (del torneo), SuperAdmin
 * @body EnviarNotificacionMasivaRequestDTO
 */
export interface EnviarNotificacionMasivaEndpoint {
  method: 'POST';
  path: '/api/v1/notificaciones/enviar-masiva';
  request: EnviarNotificacionMasivaRequestDTO;
  response: ApiResponse<{
    id_notificacion: number;
    destinatarios_count: number;
    programada: boolean;
    fecha_envio: Date | null;
  }>;
}

/**
 * POST /api/v1/notificaciones/enviar-equipo/:id_equipo
 * ----------------------------------------------------
 * Enviar notificación a todos los seguidores de un equipo.
 * 
 * @access Admin (del torneo)
 * @param id_equipo ID del equipo
 * @body { titulo, descripcion, tipo?, url? }
 */
export interface EnviarNotificacionEquipoEndpoint {
  method: 'POST';
  path: '/api/v1/notificaciones/enviar-equipo/:id_equipo';
  params: { id_equipo: number };
  request: {
    titulo: string;
    descripcion: string;
    tipo?: string;
    url?: string;
  };
  response: ApiResponse<NotificacionEnviadaResponseDTO>;
}

// ============================================
// NOTIFICACIONES AUTOMÁTICAS
// ============================================

/**
 * POST /api/v1/partidos/:id/notificar-proximo
 * -------------------------------------------
 * Enviar notificación de partido próximo.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 */
export interface NotificarPartidoProximoEndpoint {
  method: 'POST';
  path: '/api/v1/partidos/:id/notificar-proximo';
  params: { id: number };
  response: ApiResponse<{ destinatarios: number }>;
}

/**
 * POST /api/v1/partidos/:id/notificar-resultado
 * ---------------------------------------------
 * Enviar notificación de resultado de partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 */
export interface NotificarResultadoPartidoEndpoint {
  method: 'POST';
  path: '/api/v1/partidos/:id/notificar-resultado';
  params: { id: number };
  response: ApiResponse<{ destinatarios: number }>;
}

// ============================================
// HISTORIAL DE ENVÍOS (ADMIN)
// ============================================

/**
 * GET /api/v1/notificaciones/historial-envios
 * -------------------------------------------
 * Obtener historial de notificaciones enviadas.
 * 
 * @access Admin (del torneo)
 * @query page, limit
 * @query tipo - Filtrar por tipo
 * @query fecha_desde, fecha_hasta - Rango de fechas
 */
export interface GetHistorialEnviosEndpoint {
  method: 'GET';
  path: '/api/v1/notificaciones/historial-envios';
  query: PaginationParams & {
    tipo?: string;
    fecha_desde?: Date;
    fecha_hasta?: Date;
  };
  response: PaginatedResponse<NotificacionEnviadaResponseDTO>;
}
