/**
 * Fotos Endpoints
 * ===============
 * Contratos de API para gestión de fotos y galería.
 * 
 * Base URL: /api/v1/fotos
 */

import {
  CreateFotosRequestDTO,
  UpdateFotosRequestDTO,
  ComprarFotosRequestDTO,
  FotosResponseDTO,
  FotosCompradasResponseDTO,
  FotosListItemDTO,
  GaleriaEquipoDTO,
  FotosAdminResponseDTO
} from '../dtos/fotos.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// GALERÍAS PÚBLICAS
// ============================================

/**
 * GET /api/v1/equipos/:id_equipo/fotos
 * ------------------------------------
 * Obtener galerías de fotos de un equipo.
 * 
 * @access Public (preview) / Fan (compradas)
 * @param id_equipo ID del equipo
 */
export interface GetFotosEquipoEndpoint {
  method: 'GET';
  path: '/api/v1/equipos/:id_equipo/fotos';
  params: { id_equipo: number };
  response: ApiResponse<GaleriaEquipoDTO>;
}

/**
 * GET /api/v1/fotos/:id
 * ---------------------
 * Obtener detalle de una galería.
 * 
 * @access Public
 * @param id ID de la galería
 */
export interface GetFotosDetalleEndpoint {
  method: 'GET';
  path: '/api/v1/fotos/:id';
  params: { id: number };
  response: ApiResponse<FotosResponseDTO>;
}

/**
 * GET /api/v1/partidos/:id_partido/fotos
 * --------------------------------------
 * Obtener fotos de un partido.
 * 
 * @access Public
 * @param id_partido ID del partido
 */
export interface GetFotosPartidoEndpoint {
  method: 'GET';
  path: '/api/v1/partidos/:id_partido/fotos';
  params: { id_partido: number };
  response: ApiResponse<FotosListItemDTO[]>;
}

// ============================================
// COMPRA DE FOTOS
// ============================================

/**
 * POST /api/v1/fotos/:id/comprar
 * ------------------------------
 * Iniciar proceso de compra de fotos.
 * 
 * @access Fan (autenticado)
 * @param id ID de la galería
 * @body ComprarFotosRequestDTO
 */
export interface ComprarFotosEndpoint {
  method: 'POST';
  path: '/api/v1/fotos/:id/comprar';
  params: { id: number };
  request: ComprarFotosRequestDTO;
  response: ApiResponse<{
    id_compra: number;
    estado: 'pendiente' | 'procesando' | 'completada' | 'fallida';
    mensaje: string;
    url_pago?: string; // Si requiere redirección a pasarela
  }>;
}

/**
 * GET /api/v1/fotos/mis-compras
 * -----------------------------
 * Obtener fotos compradas por el usuario.
 * 
 * @access Fan (autenticado)
 */
export interface GetMisComprasEndpoint {
  method: 'GET';
  path: '/api/v1/fotos/mis-compras';
  response: ApiResponse<FotosCompradasResponseDTO[]>;
}

/**
 * GET /api/v1/fotos/:id/descargar
 * -------------------------------
 * Obtener link de descarga de fotos compradas.
 * 
 * @access Fan (autenticado, debe haber comprado)
 * @param id ID de la galería
 */
export interface DescargarFotosEndpoint {
  method: 'GET';
  path: '/api/v1/fotos/:id/descargar';
  params: { id: number };
  response: ApiResponse<{
    link_descarga: string;
    expira_en: Date;
  }>;
}

// ============================================
// GESTIÓN DE FOTOS (ADMIN)
// ============================================

/**
 * GET /api/v1/fotos
 * -----------------
 * Listar todas las galerías (admin).
 * 
 * @access Admin (del torneo)
 * @query page, limit
 * @query id_equipo - Filtrar por equipo
 * @query activo - Filtrar por estado
 */
export interface ListFotosAdminEndpoint {
  method: 'GET';
  path: '/api/v1/fotos';
  query: PaginationParams & {
    id_equipo?: number;
    activo?: boolean;
  };
  response: PaginatedResponse<FotosAdminResponseDTO>;
}

/**
 * POST /api/v1/fotos
 * ------------------
 * Crear nueva galería de fotos.
 * 
 * @access Admin (del torneo)
 * @body CreateFotosRequestDTO
 */
export interface CreateFotosEndpoint {
  method: 'POST';
  path: '/api/v1/fotos';
  request: CreateFotosRequestDTO;
  response: ApiResponse<FotosResponseDTO>;
}

/**
 * PUT /api/v1/fotos/:id
 * ---------------------
 * Actualizar galería de fotos.
 * 
 * @access Admin (del torneo)
 * @param id ID de la galería
 * @body UpdateFotosRequestDTO
 */
export interface UpdateFotosEndpoint {
  method: 'PUT';
  path: '/api/v1/fotos/:id';
  params: { id: number };
  request: UpdateFotosRequestDTO;
  response: ApiResponse<FotosResponseDTO>;
}

/**
 * DELETE /api/v1/fotos/:id
 * ------------------------
 * Eliminar galería de fotos.
 * 
 * @access Admin (del torneo)
 * @param id ID de la galería
 */
export interface DeleteFotosEndpoint {
  method: 'DELETE';
  path: '/api/v1/fotos/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/fotos/:id/preview
 * ------------------------------
 * Subir imagen de preview.
 * 
 * @access Admin (del torneo)
 * @param id ID de la galería
 * @body multipart/form-data { preview: File }
 */
export interface UploadPreviewFotosEndpoint {
  method: 'POST';
  path: '/api/v1/fotos/:id/preview';
  params: { id: number };
  request: FormData; // { preview: File }
  response: ApiResponse<{ preview_url: string }>;
}

// ============================================
// REPORTES DE VENTAS (ADMIN)
// ============================================

/**
 * GET /api/v1/fotos/ventas
 * ------------------------
 * Obtener reporte de ventas de fotos.
 * 
 * @access Admin (del torneo)
 * @query fecha_desde, fecha_hasta - Rango de fechas
 * @query id_equipo - Filtrar por equipo
 */
export interface GetVentasFotosEndpoint {
  method: 'GET';
  path: '/api/v1/fotos/ventas';
  query: {
    fecha_desde?: Date;
    fecha_hasta?: Date;
    id_equipo?: number;
  };
  response: ApiResponse<{
    total_ventas: number;
    monto_total: number;
    moneda: string;
    ventas_por_equipo: {
      id_equipo: number;
      nombre: string;
      cantidad: number;
      monto: number;
    }[];
    ventas_recientes: {
      id_compra: number;
      equipo: string;
      fecha: Date;
      monto: number;
    }[];
  }>;
}
