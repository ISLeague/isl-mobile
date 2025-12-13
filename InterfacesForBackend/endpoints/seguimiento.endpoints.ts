/**
 * Seguimiento Endpoints
 * =====================
 * Contratos de API para seguimiento de equipos.
 * 
 * Base URL: /api/v1/seguimiento
 */

import {
  SeguirEquipoRequestDTO,
  UpdateSeguimientoRequestDTO,
  SeguimientoResponseDTO,
  MiEquipoResponseDTO
} from '../dtos/seguimiento.dto';
import { ApiResponse } from '../responses/api.responses';

// ============================================
// SEGUIR EQUIPO
// ============================================

/**
 * GET /api/v1/seguimiento/mi-equipo
 * ---------------------------------
 * Obtener el equipo que sigue el usuario.
 * 
 * @access Fan (autenticado)
 */
export interface GetMiEquipoEndpoint {
  method: 'GET';
  path: '/api/v1/seguimiento/mi-equipo';
  response: ApiResponse<MiEquipoResponseDTO | null>;
}

/**
 * GET /api/v1/seguimiento
 * -----------------------
 * Obtener información de seguimiento del usuario.
 * 
 * @access Fan (autenticado)
 */
export interface GetSeguimientoEndpoint {
  method: 'GET';
  path: '/api/v1/seguimiento';
  response: ApiResponse<SeguimientoResponseDTO | null>;
}

/**
 * POST /api/v1/seguimiento/seguir
 * -------------------------------
 * Seguir a un equipo.
 * Un fan solo puede seguir un equipo a la vez.
 * 
 * @access Fan (autenticado)
 * @body SeguirEquipoRequestDTO
 */
export interface SeguirEquipoEndpoint {
  method: 'POST';
  path: '/api/v1/seguimiento/seguir';
  request: SeguirEquipoRequestDTO;
  response: ApiResponse<SeguimientoResponseDTO>;
}

/**
 * PUT /api/v1/seguimiento
 * -----------------------
 * Actualizar preferencias de seguimiento.
 * 
 * @access Fan (autenticado)
 * @body UpdateSeguimientoRequestDTO
 */
export interface UpdateSeguimientoEndpoint {
  method: 'PUT';
  path: '/api/v1/seguimiento';
  request: UpdateSeguimientoRequestDTO;
  response: ApiResponse<SeguimientoResponseDTO>;
}

/**
 * DELETE /api/v1/seguimiento/dejar
 * --------------------------------
 * Dejar de seguir al equipo actual.
 * 
 * @access Fan (autenticado)
 */
export interface DejarDeSeguirEndpoint {
  method: 'DELETE';
  path: '/api/v1/seguimiento/dejar';
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/seguimiento/cambiar-equipo
 * ---------------------------------------
 * Cambiar el equipo que se sigue.
 * Equivale a dejar de seguir y seguir nuevo.
 * 
 * @access Fan (autenticado)
 * @body SeguirEquipoRequestDTO
 */
export interface CambiarEquipoEndpoint {
  method: 'POST';
  path: '/api/v1/seguimiento/cambiar-equipo';
  request: SeguirEquipoRequestDTO;
  response: ApiResponse<SeguimientoResponseDTO>;
}

// ============================================
// INFORMACIÓN DEL EQUIPO SEGUIDO
// ============================================

/**
 * GET /api/v1/seguimiento/mi-equipo/partidos
 * ------------------------------------------
 * Obtener próximos partidos del equipo seguido.
 * 
 * @access Fan (autenticado)
 * @query limit - Máximo partidos a retornar
 */
export interface GetPartidosMiEquipoEndpoint {
  method: 'GET';
  path: '/api/v1/seguimiento/mi-equipo/partidos';
  query: {
    limit?: number;
  };
  response: ApiResponse<{
    proximos: {
      id_partido: number;
      rival: { id_equipo: number; nombre: string; logo: string | null };
      es_local: boolean;
      fecha: Date | null;
      hora: string | null;
      cancha: string | null;
    }[];
    recientes: {
      id_partido: number;
      rival: { id_equipo: number; nombre: string; logo: string | null };
      es_local: boolean;
      marcador_favor: number;
      marcador_contra: number;
      fecha: Date;
    }[];
  }>;
}

/**
 * GET /api/v1/seguimiento/mi-equipo/plantilla
 * -------------------------------------------
 * Obtener plantilla del equipo seguido.
 * 
 * @access Fan (autenticado)
 */
export interface GetPlantillaMiEquipoEndpoint {
  method: 'GET';
  path: '/api/v1/seguimiento/mi-equipo/plantilla';
  response: ApiResponse<{
    id_equipo: number;
    nombre: string;
    jugadores: {
      id_jugador: number;
      nombre: string;
      numero: number | null;
      posicion: string | null;
      foto: string | null;
      es_capitan: boolean;
    }[];
  }>;
}

/**
 * GET /api/v1/seguimiento/mi-equipo/estadisticas
 * ----------------------------------------------
 * Obtener estadísticas del equipo seguido.
 * 
 * @access Fan (autenticado)
 */
export interface GetEstadisticasMiEquipoEndpoint {
  method: 'GET';
  path: '/api/v1/seguimiento/mi-equipo/estadisticas';
  response: ApiResponse<{
    equipo: {
      id_equipo: number;
      nombre: string;
      logo: string | null;
    };
    estadisticas: {
      posicion_grupo: number | null;
      grupo: string | null;
      puntos: number;
      pj: number;
      pg: number;
      pe: number;
      pp: number;
      gf: number;
      gc: number;
      dif: number;
    };
    goleador: {
      id_jugador: number;
      nombre: string;
      goles: number;
    } | null;
  }>;
}

// ============================================
// ESTADÍSTICAS DE SEGUIDORES (ADMIN)
// ============================================

/**
 * GET /api/v1/equipos/:id/seguidores/count
 * ----------------------------------------
 * Obtener cantidad de seguidores de un equipo.
 * 
 * @access Admin (del torneo)
 * @param id ID del equipo
 */
export interface GetSeguidoresCountEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id/seguidores/count';
  params: { id: number };
  response: ApiResponse<{
    id_equipo: number;
    nombre: string;
    seguidores: number;
    con_pago_fotos: number;
  }>;
}

/**
 * GET /api/v1/edicion-categorias/:id/ranking-seguidores
 * -----------------------------------------------------
 * Obtener ranking de equipos por cantidad de seguidores.
 * 
 * @access Admin (del torneo)
 * @param id ID de la edición-categoría
 */
export interface GetRankingSeguidoresEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/ranking-seguidores';
  params: { id: number };
  response: ApiResponse<{
    ranking: {
      posicion: number;
      equipo: {
        id_equipo: number;
        nombre: string;
        logo: string | null;
      };
      seguidores: number;
    }[];
  }>;
}
