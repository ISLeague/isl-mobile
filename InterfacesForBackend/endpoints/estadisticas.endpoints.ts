/**
 * Estadisticas Endpoints
 * ======================
 * Contratos de API para estadísticas y rankings.
 * 
 * Base URL: /api/v1/estadisticas
 */

import {
  TablaGoleadoresResponseDTO,
  TablaAsistenciasResponseDTO,
  TablaTarjetasResponseDTO,
  TablaFairPlayResponseDTO,
  TablaMVPResponseDTO,
  EstadisticasEdicionDTO
} from '../dtos/estadisticas.dto';
import { ApiResponse } from '../responses/api.responses';

// ============================================
// GOLEADORES
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/goleadores
 * ---------------------------------------------
 * Obtener tabla de goleadores de una categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 * @query limit - Máximo resultados (default: 20)
 */
export interface GetGoleadoresEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/goleadores';
  params: { id: number };
  query: {
    limit?: number;
  };
  response: ApiResponse<TablaGoleadoresResponseDTO>;
}

/**
 * GET /api/v1/ediciones/:id/goleadores
 * ------------------------------------
 * Obtener goleadores de toda la edición (todas las categorías).
 * 
 * @access Public
 * @param id ID de la edición
 * @query limit - Máximo resultados
 */
export interface GetGoleadoresEdicionEndpoint {
  method: 'GET';
  path: '/api/v1/ediciones/:id/goleadores';
  params: { id: number };
  query: {
    limit?: number;
  };
  response: ApiResponse<TablaGoleadoresResponseDTO>;
}

// ============================================
// ASISTENCIAS
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/asistencias
 * ----------------------------------------------
 * Obtener tabla de asistencias de una categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 * @query limit - Máximo resultados
 */
export interface GetAsistenciasEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/asistencias';
  params: { id: number };
  query: {
    limit?: number;
  };
  response: ApiResponse<TablaAsistenciasResponseDTO>;
}

// ============================================
// TARJETAS
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/tarjetas
 * -------------------------------------------
 * Obtener tabla de tarjetas de una categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 * @query tipo - Filtrar por tipo de tarjeta
 * @query limit - Máximo resultados
 */
export interface GetTarjetasEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/tarjetas';
  params: { id: number };
  query: {
    tipo?: 'amarillas' | 'rojas' | 'todas';
    limit?: number;
  };
  response: ApiResponse<TablaTarjetasResponseDTO>;
}

// ============================================
// FAIR PLAY
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/fair-play
 * --------------------------------------------
 * Obtener ranking de fair play (equipos más limpios).
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface GetFairPlayEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/fair-play';
  params: { id: number };
  response: ApiResponse<TablaFairPlayResponseDTO>;
}

// ============================================
// MVP
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/mvp
 * --------------------------------------
 * Obtener ranking de MVPs de la categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 * @query limit - Máximo resultados
 */
export interface GetMVPRankingEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/mvp';
  params: { id: number };
  query: {
    limit?: number;
  };
  response: ApiResponse<TablaMVPResponseDTO>;
}

// ============================================
// ESTADÍSTICAS GENERALES
// ============================================

/**
 * GET /api/v1/ediciones/:id/estadisticas
 * --------------------------------------
 * Obtener estadísticas generales de la edición.
 * 
 * @access Public
 * @param id ID de la edición
 */
export interface GetEstadisticasEdicionEndpoint {
  method: 'GET';
  path: '/api/v1/ediciones/:id/estadisticas';
  params: { id: number };
  response: ApiResponse<EstadisticasEdicionDTO>;
}

/**
 * GET /api/v1/edicion-categorias/:id/estadisticas
 * -----------------------------------------------
 * Obtener estadísticas de una categoría específica.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface GetEstadisticasCategoriaEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/estadisticas';
  params: { id: number };
  response: ApiResponse<{
    id_edicion_categoria: number;
    categoria: string;
    equipos: number;
    jugadores: number;
    partidos_totales: number;
    partidos_jugados: number;
    goles_totales: number;
    promedio_goles_partido: number;
    tarjetas_amarillas: number;
    tarjetas_rojas: number;
    partido_mas_goles?: {
      id_partido: number;
      equipos: string;
      goles: number;
    };
    goleada_mayor?: {
      id_partido: number;
      equipos: string;
      resultado: string;
    };
  }>;
}

// ============================================
// RESUMEN VISUAL (PARA DASHBOARDS)
// ============================================

/**
 * GET /api/v1/edicion-categorias/:id/resumen-dashboard
 * ----------------------------------------------------
 * Obtener resumen para dashboard de una categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface GetResumenDashboardEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/resumen-dashboard';
  params: { id: number };
  response: ApiResponse<{
    categoria: string;
    edicion: number;
    torneo: string;
    estado_edicion: string;
    resumen: {
      equipos: number;
      partidos_jugados: number;
      partidos_pendientes: number;
      goles: number;
    };
    goleador: {
      jugador: string;
      equipo: string;
      goles: number;
      foto?: string;
    } | null;
    proximo_partido: {
      id_partido: number;
      local: string;
      visitante: string;
      fecha: Date | null;
      hora: string | null;
    } | null;
    ultimo_resultado: {
      id_partido: number;
      local: string;
      visitante: string;
      marcador: string;
    } | null;
    lideres_grupos: {
      grupo: string;
      equipo: string;
      logo: string | null;
      puntos: number;
    }[];
  }>;
}

// ============================================
// COMPARACIÓN DE EQUIPOS
// ============================================

/**
 * GET /api/v1/equipos/comparar
 * ----------------------------
 * Comparar estadísticas de dos equipos.
 * 
 * @access Public
 * @query id_equipo1 - ID del primer equipo
 * @query id_equipo2 - ID del segundo equipo
 */
export interface CompararEquiposEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/comparar';
  query: {
    id_equipo1: number;
    id_equipo2: number;
  };
  response: ApiResponse<{
    equipo1: {
      id_equipo: number;
      nombre: string;
      logo: string | null;
      estadisticas: {
        pj: number;
        pg: number;
        pe: number;
        pp: number;
        gf: number;
        gc: number;
        puntos: number;
      };
    };
    equipo2: {
      id_equipo: number;
      nombre: string;
      logo: string | null;
      estadisticas: {
        pj: number;
        pg: number;
        pe: number;
        pp: number;
        gf: number;
        gc: number;
        puntos: number;
      };
    };
    enfrentamientos: {
      total: number;
      victorias_equipo1: number;
      victorias_equipo2: number;
      empates: number;
    };
  }>;
}

// ============================================
// HISTORIAL
// ============================================

/**
 * GET /api/v1/torneos/:id/historial-campeones
 * -------------------------------------------
 * Obtener historial de campeones del torneo.
 * 
 * @access Public
 * @param id ID del torneo
 */
export interface GetHistorialCampeonesEndpoint {
  method: 'GET';
  path: '/api/v1/torneos/:id/historial-campeones';
  params: { id: number };
  response: ApiResponse<{
    id_torneo: number;
    nombre_torneo: string;
    ediciones: {
      numero: number;
      anio?: number;
      campeon: {
        id_equipo: number;
        nombre: string;
        logo: string | null;
      };
      subcampeon?: {
        id_equipo: number;
        nombre: string;
        logo: string | null;
      };
      goleador?: {
        id_jugador: number;
        nombre: string;
        goles: number;
      };
    }[];
  }>;
}
