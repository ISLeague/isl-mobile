/**
 * Clasificacion Endpoints
 * =======================
 * Contratos de API adicionales para clasificación.
 * 
 * Base URL: /api/v1/clasificacion
 */

import { ClasificacionDTO } from '../dtos/partido.dto';
import { ApiResponse } from '../responses/api.responses';

// ============================================
// CLASIFICACIÓN GENERAL
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/clasificacion-general
 * --------------------------------------------------------
 * Obtener clasificación general de la categoría (todos los equipos).
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface GetClasificacionGeneralEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/clasificacion-general';
  params: { id: number };
  response: ApiResponse<{
    id_edicion_categoria: number;
    categoria: string;
    edicion: number;
    clasificacion: (ClasificacionDTO & {
      grupo_nombre: string;
    })[];
  }>;
}

/**
 * GET /api/v1/fases/:id_fase/clasificados
 * ---------------------------------------
 * Obtener equipos clasificados de una fase.
 * 
 * @access Public
 * @param id_fase ID de la fase
 */
export interface GetClasificadosFaseEndpoint {
  method: 'GET';
  path: '/api/v1/fases/:id_fase/clasificados';
  params: { id_fase: number };
  response: ApiResponse<{
    id_fase: number;
    nombre_fase: string;
    clasificados: {
      copa_oro: {
        id_equipo: number;
        nombre: string;
        logo: string | null;
        grupo_origen: string;
        posicion_grupo: number;
      }[];
      copa_plata: {
        id_equipo: number;
        nombre: string;
        logo: string | null;
        grupo_origen: string;
        posicion_grupo: number;
      }[];
      copa_bronce: {
        id_equipo: number;
        nombre: string;
        logo: string | null;
        grupo_origen: string;
        posicion_grupo: number;
      }[];
    };
  }>;
}

// ============================================
// BRACKET DE ELIMINATORIAS
// ============================================

/**
 * GET /api/v1/fases/:id_fase/bracket
 * ----------------------------------
 * Obtener bracket de eliminatorias.
 * 
 * @access Public
 * @param id_fase ID de la fase de eliminatorias
 */
export interface GetBracketEliminatoriasEndpoint {
  method: 'GET';
  path: '/api/v1/fases/:id_fase/bracket';
  params: { id_fase: number };
  response: ApiResponse<{
    id_fase: number;
    nombre: string;
    copa: string | null;
    rondas: {
      id_ronda: number;
      nombre: string;
      partidos: {
        id_partido: number;
        posicion_bracket: number;
        equipo_local: {
          id_equipo: number | null;
          nombre: string | null;
          logo: string | null;
        } | null;
        equipo_visitante: {
          id_equipo: number | null;
          nombre: string | null;
          logo: string | null;
        } | null;
        marcador_local: number | null;
        marcador_visitante: number | null;
        ganador_id: number | null;
        estado: string;
      }[];
    }[];
  }>;
}

/**
 * POST /api/v1/fases/:id_fase/generar-bracket
 * -------------------------------------------
 * Generar bracket de eliminatorias basado en clasificación de grupos.
 * 
 * @access Admin (del torneo)
 * @param id_fase ID de la fase de eliminatorias destino
 * @body { id_fase_grupos: number, cruzados?: boolean }
 */
export interface GenerarBracketEndpoint {
  method: 'POST';
  path: '/api/v1/fases/:id_fase/generar-bracket';
  params: { id_fase: number };
  request: {
    id_fase_grupos: number;
    cruzados?: boolean; // 1A vs 2B, 1B vs 2A, etc.
  };
  response: ApiResponse<{
    partidos_generados: number;
    bracket: {
      id_partido: number;
      local: string;
      visitante: string;
    }[];
  }>;
}

/**
 * POST /api/v1/fases/:id_fase/avanzar-ganadores
 * ---------------------------------------------
 * Avanzar ganadores a la siguiente ronda del bracket.
 * 
 * @access Admin (del torneo)
 * @param id_fase ID de la fase
 */
export interface AvanzarGanadoresEndpoint {
  method: 'POST';
  path: '/api/v1/fases/:id_fase/avanzar-ganadores';
  params: { id_fase: number };
  response: ApiResponse<{
    partidos_actualizados: number;
    mensaje: string;
  }>;
}

// ============================================
// MEJORES TERCEROS
// ============================================

/**
 * GET /api/v1/fases/:id_fase/mejores-terceros
 * -------------------------------------------
 * Obtener ranking de mejores terceros de una fase de grupos.
 * 
 * @access Public
 * @param id_fase ID de la fase de grupos
 */
export interface GetMejoresTercerosEndpoint {
  method: 'GET';
  path: '/api/v1/fases/:id_fase/mejores-terceros';
  params: { id_fase: number };
  response: ApiResponse<{
    mejores_terceros: (ClasificacionDTO & {
      grupo_nombre: string;
      ranking_terceros: number;
    })[];
  }>;
}

// ============================================
// DESEMPATES
// ============================================

/**
 * POST /api/v1/grupos/:id/resolver-empate
 * ---------------------------------------
 * Resolver empate en puntos entre equipos.
 * 
 * @access Admin (del torneo)
 * @param id ID del grupo
 * @body { equipos: number[], criterio: string, ganador: number }
 */
export interface ResolverEmpateEndpoint {
  method: 'POST';
  path: '/api/v1/grupos/:id/resolver-empate';
  params: { id: number };
  request: {
    equipos: number[]; // IDs de equipos empatados
    criterio: 'head_to_head' | 'diferencia_goles' | 'sorteo';
    ganador?: number; // ID del equipo ganador (requerido si criterio es 'sorteo')
  };
  response: ApiResponse<ClasificacionDTO[]>;
}
