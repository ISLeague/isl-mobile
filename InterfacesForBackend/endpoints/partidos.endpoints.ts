/**
 * Partidos Endpoints
 * ==================
 * Contratos de API para gestión de partidos y eventos.
 * 
 * Base URL: /api/v1/partidos
 */

import {
  CreatePartidoRequestDTO,
  UpdatePartidoRequestDTO,
  CargarResultadoRequestDTO,
  CreateEventoPartidoDTO,
  PartidoResponseDTO
} from '../dtos/partido.dto';
import { ApiResponse, PaginatedResponse, PaginationParams, DateRangeParams } from '../responses/api.responses';

// ============================================
// CRUD DE PARTIDOS
// ============================================

/**
 * GET /api/v1/partidos
 * --------------------
 * Listar partidos con filtros.
 * 
 * @access Public
 * @query page, limit, sort_by, sort_order
 * @query id_ronda, id_fase, id_edicion_categoria
 * @query estado - Filtrar por estado
 * @query fecha_desde, fecha_hasta - Rango de fechas
 */
export interface ListPartidosEndpoint {
  method: 'GET';
  path: '/api/v1/partidos';
  query: PaginationParams & DateRangeParams & {
    id_ronda?: number;
    id_fase?: number;
    id_edicion_categoria?: number;
    estado?: 'Pendiente' | 'En curso' | 'Finalizado' | 'Suspendido' | 'Aplazado' | 'Cancelado';
  };
  response: PaginatedResponse<PartidoResponseDTO>;
}

/**
 * GET /api/v1/rondas/:id_ronda/partidos
 * -------------------------------------
 * Listar partidos de una ronda.
 * 
 * @access Public
 * @param id_ronda ID de la ronda
 */
export interface ListPartidosByRondaEndpoint {
  method: 'GET';
  path: '/api/v1/rondas/:id_ronda/partidos';
  params: { id_ronda: number };
  response: ApiResponse<PartidoResponseDTO[]>;
}

/**
 * GET /api/v1/partidos/:id
 * ------------------------
 * Obtener partido por ID.
 * 
 * @access Public
 * @param id ID del partido
 */
export interface GetPartidoEndpoint {
  method: 'GET';
  path: '/api/v1/partidos/:id';
  params: { id: number };
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * GET /api/v1/partidos/:id/detalle
 * --------------------------------
 * Obtener partido con todos los detalles.
 * 
 * @access Public
 * @param id ID del partido
 */
export interface GetPartidoDetalleEndpoint {
  method: 'GET';
  path: '/api/v1/partidos/:id/detalle';
  params: { id: number };
  response: ApiResponse<{
    partido: PartidoResponseDTO;
    alineacion_local?: {
      titulares: any[];
      suplentes: any[];
    };
    alineacion_visitante?: {
      titulares: any[];
      suplentes: any[];
    };
    eventos: {
      minuto: number;
      tipo: string;
      jugador: string;
      equipo: string;
      descripcion?: string;
    }[];
    estadisticas?: {
      posesion_local?: number;
      posesion_visitante?: number;
      tiros_local?: number;
      tiros_visitante?: number;
    };
  }>;
}

/**
 * POST /api/v1/partidos
 * ---------------------
 * Crear nuevo partido.
 * 
 * @access Admin (del torneo)
 * @body CreatePartidoRequestDTO
 */
export interface CreatePartidoEndpoint {
  method: 'POST';
  path: '/api/v1/partidos';
  request: CreatePartidoRequestDTO;
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * PUT /api/v1/partidos/:id
 * ------------------------
 * Actualizar partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body UpdatePartidoRequestDTO
 */
export interface UpdatePartidoEndpoint {
  method: 'PUT';
  path: '/api/v1/partidos/:id';
  params: { id: number };
  request: UpdatePartidoRequestDTO;
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * DELETE /api/v1/partidos/:id
 * ---------------------------
 * Eliminar partido.
 * Solo si no está finalizado.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 */
export interface DeletePartidoEndpoint {
  method: 'DELETE';
  path: '/api/v1/partidos/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// PROGRAMACIÓN DE PARTIDOS
// ============================================

/**
 * PUT /api/v1/partidos/:id/programar
 * ----------------------------------
 * Programar fecha, hora y cancha del partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body { fecha, hora, id_cancha }
 */
export interface ProgramarPartidoEndpoint {
  method: 'PUT';
  path: '/api/v1/partidos/:id/programar';
  params: { id: number };
  request: {
    fecha?: Date;
    hora?: string;
    id_cancha?: number;
  };
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * PUT /api/v1/partidos/:id/aplazar
 * --------------------------------
 * Aplazar partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body { motivo, nueva_fecha?, nueva_hora? }
 */
export interface AplazarPartidoEndpoint {
  method: 'PUT';
  path: '/api/v1/partidos/:id/aplazar';
  params: { id: number };
  request: {
    motivo: string;
    nueva_fecha?: Date;
    nueva_hora?: string;
  };
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * PUT /api/v1/partidos/:id/suspender
 * ----------------------------------
 * Suspender partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body { motivo }
 */
export interface SuspenderPartidoEndpoint {
  method: 'PUT';
  path: '/api/v1/partidos/:id/suspender';
  params: { id: number };
  request: { motivo: string };
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * PUT /api/v1/partidos/:id/cancelar
 * ---------------------------------
 * Cancelar partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body { motivo }
 */
export interface CancelarPartidoEndpoint {
  method: 'PUT';
  path: '/api/v1/partidos/:id/cancelar';
  params: { id: number };
  request: { motivo: string };
  response: ApiResponse<PartidoResponseDTO>;
}

// ============================================
// RESULTADO Y EVENTOS
// ============================================

/**
 * POST /api/v1/partidos/:id/iniciar
 * ---------------------------------
 * Iniciar partido (cambiar estado a "En curso").
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 */
export interface IniciarPartidoEndpoint {
  method: 'POST';
  path: '/api/v1/partidos/:id/iniciar';
  params: { id: number };
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * POST /api/v1/partidos/:id/resultado
 * -----------------------------------
 * Cargar resultado del partido.
 * Automáticamente cambia estado a "Finalizado".
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body CargarResultadoRequestDTO
 */
export interface CargarResultadoEndpoint {
  method: 'POST';
  path: '/api/v1/partidos/:id/resultado';
  params: { id: number };
  request: CargarResultadoRequestDTO;
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * PUT /api/v1/partidos/:id/resultado
 * ----------------------------------
 * Modificar resultado de partido finalizado.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body CargarResultadoRequestDTO
 */
export interface ModificarResultadoEndpoint {
  method: 'PUT';
  path: '/api/v1/partidos/:id/resultado';
  params: { id: number };
  request: CargarResultadoRequestDTO;
  response: ApiResponse<PartidoResponseDTO>;
}

/**
 * POST /api/v1/partidos/:id/walk-over
 * -----------------------------------
 * Registrar Walk Over (victoria sin jugar).
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body { id_equipo_ganador, motivo }
 */
export interface RegistrarWalkOverEndpoint {
  method: 'POST';
  path: '/api/v1/partidos/:id/walk-over';
  params: { id: number };
  request: {
    id_equipo_ganador: number;
    motivo: string;
  };
  response: ApiResponse<PartidoResponseDTO>;
}

// ============================================
// EVENTOS DEL PARTIDO
// ============================================

/**
 * GET /api/v1/partidos/:id/eventos
 * --------------------------------
 * Obtener eventos del partido.
 * 
 * @access Public
 * @param id ID del partido
 */
export interface GetEventosPartidoEndpoint {
  method: 'GET';
  path: '/api/v1/partidos/:id/eventos';
  params: { id: number };
  response: ApiResponse<{
    id_evento: number;
    tipo: string;
    minuto: number;
    tiempo_extra: boolean;
    jugador: {
      id_jugador: number;
      nombre: string;
      numero: number | null;
    };
    equipo: {
      id_equipo: number;
      nombre: string;
    };
    jugador_relacionado?: {
      id_jugador: number;
      nombre: string;
    };
    descripcion?: string;
  }[]>;
}

/**
 * POST /api/v1/partidos/:id/eventos
 * ---------------------------------
 * Agregar evento al partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body CreateEventoPartidoDTO
 */
export interface CreateEventoPartidoEndpoint {
  method: 'POST';
  path: '/api/v1/partidos/:id/eventos';
  params: { id: number };
  request: CreateEventoPartidoDTO;
  response: ApiResponse<{ id_evento: number; message: string }>;
}

/**
 * DELETE /api/v1/partidos/:id/eventos/:id_evento
 * -----------------------------------------------
 * Eliminar evento del partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @param id_evento ID del evento
 */
export interface DeleteEventoPartidoEndpoint {
  method: 'DELETE';
  path: '/api/v1/partidos/:id/eventos/:id_evento';
  params: { id: number; id_evento: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/partidos/:id/mvp
 * -----------------------------
 * Asignar MVP del partido.
 * 
 * @access Admin (del torneo)
 * @param id ID del partido
 * @body { id_jugador: number }
 */
export interface AsignarMVPEndpoint {
  method: 'POST';
  path: '/api/v1/partidos/:id/mvp';
  params: { id: number };
  request: { id_jugador: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// CONSULTAS ESPECIALES
// ============================================

/**
 * GET /api/v1/partidos/proximos
 * -----------------------------
 * Obtener próximos partidos.
 * 
 * @access Public
 * @query id_edicion_categoria - Filtrar por categoría
 * @query id_equipo - Filtrar por equipo
 * @query limit - Máximo resultados
 */
export interface GetProximosPartidosEndpoint {
  method: 'GET';
  path: '/api/v1/partidos/proximos';
  query: {
    id_edicion_categoria?: number;
    id_equipo?: number;
    limit?: number;
  };
  response: ApiResponse<PartidoResponseDTO[]>;
}

/**
 * GET /api/v1/partidos/hoy
 * ------------------------
 * Obtener partidos de hoy.
 * 
 * @access Public
 * @query id_edicion_categoria - Filtrar por categoría
 */
export interface GetPartidosHoyEndpoint {
  method: 'GET';
  path: '/api/v1/partidos/hoy';
  query: {
    id_edicion_categoria?: number;
  };
  response: ApiResponse<PartidoResponseDTO[]>;
}

/**
 * GET /api/v1/partidos/en-vivo
 * ----------------------------
 * Obtener partidos en curso.
 * 
 * @access Public
 */
export interface GetPartidosEnVivoEndpoint {
  method: 'GET';
  path: '/api/v1/partidos/en-vivo';
  response: ApiResponse<PartidoResponseDTO[]>;
}

/**
 * GET /api/v1/partidos/ultimos-resultados
 * ---------------------------------------
 * Obtener últimos resultados.
 * 
 * @access Public
 * @query id_edicion_categoria - Filtrar por categoría
 * @query limit - Máximo resultados
 */
export interface GetUltimosResultadosEndpoint {
  method: 'GET';
  path: '/api/v1/partidos/ultimos-resultados';
  query: {
    id_edicion_categoria?: number;
    limit?: number;
  };
  response: ApiResponse<PartidoResponseDTO[]>;
}

/**
 * GET /api/v1/equipos/:id_equipo/enfrentamientos/:id_rival
 * --------------------------------------------------------
 * Obtener historial de enfrentamientos entre dos equipos.
 * 
 * @access Public
 * @param id_equipo ID del primer equipo
 * @param id_rival ID del segundo equipo
 */
export interface GetEnfrentamientosEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id_equipo/enfrentamientos/:id_rival';
  params: { id_equipo: number; id_rival: number };
  response: ApiResponse<{
    equipo1: { id: number; nombre: string; victorias: number };
    equipo2: { id: number; nombre: string; victorias: number };
    empates: number;
    partidos: PartidoResponseDTO[];
  }>;
}
