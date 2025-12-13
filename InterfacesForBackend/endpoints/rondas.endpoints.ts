/**
 * Rondas Endpoints
 * ================
 * Contratos de API para gestión de rondas/jornadas.
 * 
 * Base URL: /api/v1/rondas
 */

import {
  CreateRondaRequestDTO,
  UpdateRondaRequestDTO,
  RondaResponseDTO
} from '../dtos/partido.dto';
import { ApiResponse } from '../responses/api.responses';

// ============================================
// CRUD DE RONDAS
// ============================================

/**
 * GET /api/v1/fases/:id_fase/rondas
 * ---------------------------------
 * Listar rondas de una fase.
 * 
 * @access Public
 * @param id_fase ID de la fase
 */
export interface ListRondasEndpoint {
  method: 'GET';
  path: '/api/v1/fases/:id_fase/rondas';
  params: { id_fase: number };
  response: ApiResponse<RondaResponseDTO[]>;
}

/**
 * GET /api/v1/rondas/:id
 * ----------------------
 * Obtener ronda por ID.
 * 
 * @access Public
 * @param id ID de la ronda
 */
export interface GetRondaEndpoint {
  method: 'GET';
  path: '/api/v1/rondas/:id';
  params: { id: number };
  response: ApiResponse<RondaResponseDTO>;
}

/**
 * POST /api/v1/fases/:id_fase/rondas
 * ----------------------------------
 * Crear nueva ronda.
 * 
 * @access Admin (del torneo)
 * @param id_fase ID de la fase
 * @body CreateRondaRequestDTO
 */
export interface CreateRondaEndpoint {
  method: 'POST';
  path: '/api/v1/fases/:id_fase/rondas';
  params: { id_fase: number };
  request: CreateRondaRequestDTO;
  response: ApiResponse<RondaResponseDTO>;
}

/**
 * PUT /api/v1/rondas/:id
 * ----------------------
 * Actualizar ronda.
 * 
 * @access Admin (del torneo)
 * @param id ID de la ronda
 * @body UpdateRondaRequestDTO
 */
export interface UpdateRondaEndpoint {
  method: 'PUT';
  path: '/api/v1/rondas/:id';
  params: { id: number };
  request: UpdateRondaRequestDTO;
  response: ApiResponse<RondaResponseDTO>;
}

/**
 * DELETE /api/v1/rondas/:id
 * -------------------------
 * Eliminar ronda.
 * Solo si no tiene partidos jugados.
 * 
 * @access Admin (del torneo)
 * @param id ID de la ronda
 */
export interface DeleteRondaEndpoint {
  method: 'DELETE';
  path: '/api/v1/rondas/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// GENERACIÓN DE FIXTURE
// ============================================

/**
 * POST /api/v1/rondas/:id/generar-partidos
 * ----------------------------------------
 * Generar partidos para una ronda de fase de grupos.
 * Usa algoritmo round-robin.
 * 
 * @access Admin (del torneo)
 * @param id ID de la ronda
 * @body { id_grupos?: number[] } // Si no se pasan, genera para todos los grupos
 */
export interface GenerarPartidosRondaEndpoint {
  method: 'POST';
  path: '/api/v1/rondas/:id/generar-partidos';
  params: { id: number };
  request: {
    id_grupos?: number[];
  };
  response: ApiResponse<{
    partidos_creados: number;
    partidos: {
      id_partido: number;
      local: string;
      visitante: string;
    }[];
  }>;
}

/**
 * POST /api/v1/fases/:id_fase/generar-fixture
 * -------------------------------------------
 * Generar fixture completo para la fase de grupos.
 * Crea rondas y partidos automáticamente.
 * 
 * @access Admin (del torneo)
 * @param id_fase ID de la fase
 * @body Configuración de generación
 */
export interface GenerarFixtureCompletoEndpoint {
  method: 'POST';
  path: '/api/v1/fases/:id_fase/generar-fixture';
  params: { id_fase: number };
  request: {
    ida_y_vuelta?: boolean;
    fecha_inicio?: Date;
    intervalo_dias?: number;
  };
  response: ApiResponse<{
    rondas_creadas: number;
    partidos_creados: number;
    fixture: {
      id_ronda: number;
      nombre: string;
      fecha: Date | null;
      partidos: {
        id_partido: number;
        local: string;
        visitante: string;
      }[];
    }[];
  }>;
}

// ============================================
// RONDAS AMISTOSAS
// ============================================

/**
 * POST /api/v1/edicion-categorias/:id/rondas-amistosas
 * ----------------------------------------------------
 * Crear ronda de partidos amistosos.
 * 
 * @access Admin (del torneo)
 * @param id ID de la edición-categoría
 * @body { nombre: string, fecha_inicio?: Date, fecha_fin?: Date }
 */
export interface CreateRondaAmistosaEndpoint {
  method: 'POST';
  path: '/api/v1/edicion-categorias/:id/rondas-amistosas';
  params: { id: number };
  request: {
    nombre: string;
    fecha_inicio?: Date;
    fecha_fin?: Date;
  };
  response: ApiResponse<RondaResponseDTO>;
}

/**
 * GET /api/v1/edicion-categorias/:id/rondas-amistosas
 * ---------------------------------------------------
 * Listar rondas amistosas de una categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface ListRondasAmistosasEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/rondas-amistosas';
  params: { id: number };
  response: ApiResponse<RondaResponseDTO[]>;
}

// ============================================
// FECHAS DE RONDAS
// ============================================

/**
 * PUT /api/v1/rondas/:id/fechas
 * -----------------------------
 * Actualizar fechas de la ronda y opcionalmente de sus partidos.
 * 
 * @access Admin (del torneo)
 * @param id ID de la ronda
 * @body { fecha_inicio, fecha_fin, aplicar_a_partidos }
 */
export interface UpdateFechasRondaEndpoint {
  method: 'PUT';
  path: '/api/v1/rondas/:id/fechas';
  params: { id: number };
  request: {
    fecha_inicio?: Date;
    fecha_fin?: Date;
    aplicar_a_partidos?: boolean;
  };
  response: ApiResponse<RondaResponseDTO>;
}

// ============================================
// ORDENAMIENTO
// ============================================

/**
 * PUT /api/v1/fases/:id_fase/rondas/orden
 * ---------------------------------------
 * Reordenar rondas de una fase.
 * 
 * @access Admin (del torneo)
 * @param id_fase ID de la fase
 * @body { orden: { id_ronda: number, orden: number }[] }
 */
export interface ReordenarRondasEndpoint {
  method: 'PUT';
  path: '/api/v1/fases/:id_fase/rondas/orden';
  params: { id_fase: number };
  request: {
    orden: { id_ronda: number; orden: number }[];
  };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// ESTADO DE RONDAS
// ============================================

/**
 * GET /api/v1/rondas/:id/estado
 * -----------------------------
 * Obtener estado detallado de la ronda.
 * 
 * @access Public
 * @param id ID de la ronda
 */
export interface GetEstadoRondaEndpoint {
  method: 'GET';
  path: '/api/v1/rondas/:id/estado';
  params: { id: number };
  response: ApiResponse<{
    id_ronda: number;
    nombre: string;
    partidos_totales: number;
    partidos_pendientes: number;
    partidos_en_curso: number;
    partidos_finalizados: number;
    proximo_partido?: {
      id_partido: number;
      local: string;
      visitante: string;
      fecha: Date | null;
      hora: string | null;
    };
    completada: boolean;
  }>;
}
