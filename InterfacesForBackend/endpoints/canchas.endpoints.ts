/**
 * Canchas Endpoints
 * =================
 * Contratos de API para gestión de canchas.
 * 
 * Base URL: /api/v1/canchas
 */

import {
  CreateCanchaRequestDTO,
  UpdateCanchaRequestDTO,
  CanchaResponseDTO,
  CanchaResumenDTO
} from '../dtos/local.dto';
import { ApiResponse } from '../responses/api.responses';

// ============================================
// CRUD DE CANCHAS
// ============================================

/**
 * GET /api/v1/locales/:id_local/canchas
 * -------------------------------------
 * Listar canchas de un local.
 * 
 * @access Public
 * @param id_local ID del local
 * @query activo - Filtrar por estado
 */
export interface ListCanchasEndpoint {
  method: 'GET';
  path: '/api/v1/locales/:id_local/canchas';
  params: { id_local: number };
  query: {
    activo?: boolean;
  };
  response: ApiResponse<CanchaResumenDTO[]>;
}

/**
 * GET /api/v1/canchas/:id
 * -----------------------
 * Obtener cancha por ID.
 * 
 * @access Public
 * @param id ID de la cancha
 */
export interface GetCanchaEndpoint {
  method: 'GET';
  path: '/api/v1/canchas/:id';
  params: { id: number };
  response: ApiResponse<CanchaResponseDTO>;
}

/**
 * POST /api/v1/locales/:id_local/canchas
 * --------------------------------------
 * Crear nueva cancha en un local.
 * 
 * @access Admin (del torneo)
 * @param id_local ID del local
 * @body CreateCanchaRequestDTO
 */
export interface CreateCanchaEndpoint {
  method: 'POST';
  path: '/api/v1/locales/:id_local/canchas';
  params: { id_local: number };
  request: CreateCanchaRequestDTO;
  response: ApiResponse<CanchaResponseDTO>;
}

/**
 * PUT /api/v1/canchas/:id
 * -----------------------
 * Actualizar cancha.
 * 
 * @access Admin (del torneo)
 * @param id ID de la cancha
 * @body UpdateCanchaRequestDTO
 */
export interface UpdateCanchaEndpoint {
  method: 'PUT';
  path: '/api/v1/canchas/:id';
  params: { id: number };
  request: UpdateCanchaRequestDTO;
  response: ApiResponse<CanchaResponseDTO>;
}

/**
 * DELETE /api/v1/canchas/:id
 * --------------------------
 * Eliminar cancha (soft delete).
 * Solo si no tiene partidos programados.
 * 
 * @access Admin (del torneo)
 * @param id ID de la cancha
 */
export interface DeleteCanchaEndpoint {
  method: 'DELETE';
  path: '/api/v1/canchas/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// DISPONIBILIDAD DE CANCHAS
// ============================================

/**
 * GET /api/v1/canchas/:id/disponibilidad
 * --------------------------------------
 * Obtener disponibilidad de una cancha específica.
 * 
 * @access Admin (del torneo)
 * @param id ID de la cancha
 * @query fecha - Fecha a consultar
 */
export interface GetDisponibilidadCanchaEndpoint {
  method: 'GET';
  path: '/api/v1/canchas/:id/disponibilidad';
  params: { id: number };
  query: {
    fecha: Date;
  };
  response: ApiResponse<{
    id_cancha: number;
    nombre: string;
    fecha: Date;
    horarios_ocupados: {
      hora_inicio: string;
      hora_fin: string;
      partido: {
        id_partido: number;
        equipos: string;
      };
    }[];
    horarios_disponibles: string[];
  }>;
}

/**
 * GET /api/v1/canchas/disponibles
 * -------------------------------
 * Obtener canchas disponibles en una fecha y hora.
 * 
 * @access Admin (del torneo)
 * @query fecha - Fecha a consultar
 * @query hora - Hora a consultar
 * @query id_edicion_categoria - Filtrar por categoría
 */
export interface GetCanchasDisponiblesEndpoint {
  method: 'GET';
  path: '/api/v1/canchas/disponibles';
  query: {
    fecha: Date;
    hora: string;
    id_edicion_categoria?: number;
  };
  response: ApiResponse<{
    id_cancha: number;
    nombre: string;
    local: {
      id_local: number;
      nombre: string;
      direccion: string | null;
    };
    tipo_superficie: string | null;
  }[]>;
}

// ============================================
// PARTIDOS EN CANCHA
// ============================================

/**
 * GET /api/v1/canchas/:id/partidos
 * --------------------------------
 * Obtener partidos programados en una cancha.
 * 
 * @access Public
 * @param id ID de la cancha
 * @query fecha_desde, fecha_hasta - Rango de fechas
 */
export interface GetPartidosCanchaEndpoint {
  method: 'GET';
  path: '/api/v1/canchas/:id/partidos';
  params: { id: number };
  query: {
    fecha_desde?: Date;
    fecha_hasta?: Date;
  };
  response: ApiResponse<{
    id_partido: number;
    fecha: Date | null;
    hora: string | null;
    local: string;
    visitante: string;
    estado: string;
  }[]>;
}
