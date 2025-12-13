/**
 * Sponsors Endpoints
 * ==================
 * Contratos de API para gestión de sponsors y banners.
 * 
 * Base URL: /api/v1/sponsors
 */

import {
  CreateSponsorRequestDTO,
  UpdateSponsorRequestDTO,
  SponsorResponseDTO,
  SponsorListItemDTO,
  CreateBannerRequestDTO,
  UpdateBannerRequestDTO,
  BannerResponseDTO
} from '../dtos/sponsor.dto';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../responses/api.responses';

// ============================================
// CRUD DE SPONSORS
// ============================================

/**
 * GET /api/v1/sponsors
 * --------------------
 * Listar sponsors con filtros.
 * 
 * @access Public
 * @query id_edicion_categoria - Filtrar por categoría
 * @query tipo - Filtrar por tipo
 * @query activo - Filtrar por estado
 */
export interface ListSponsorsEndpoint {
  method: 'GET';
  path: '/api/v1/sponsors';
  query: {
    id_edicion_categoria?: number;
    tipo?: 'principal' | 'oficial' | 'colaborador';
    activo?: boolean;
  };
  response: ApiResponse<SponsorListItemDTO[]>;
}

/**
 * GET /api/v1/edicion-categorias/:id/sponsors
 * -------------------------------------------
 * Obtener sponsors de una categoría.
 * 
 * @access Public
 * @param id ID de la edición-categoría
 */
export interface GetSponsorsCategoriaEndpoint {
  method: 'GET';
  path: '/api/v1/edicion-categorias/:id/sponsors';
  params: { id: number };
  response: ApiResponse<SponsorListItemDTO[]>;
}

/**
 * GET /api/v1/sponsors/:id
 * ------------------------
 * Obtener sponsor por ID.
 * 
 * @access Public
 * @param id ID del sponsor
 */
export interface GetSponsorEndpoint {
  method: 'GET';
  path: '/api/v1/sponsors/:id';
  params: { id: number };
  response: ApiResponse<SponsorResponseDTO>;
}

/**
 * POST /api/v1/sponsors
 * ---------------------
 * Crear nuevo sponsor.
 * 
 * @access Admin (del torneo)
 * @body CreateSponsorRequestDTO
 */
export interface CreateSponsorEndpoint {
  method: 'POST';
  path: '/api/v1/sponsors';
  request: CreateSponsorRequestDTO;
  response: ApiResponse<SponsorResponseDTO>;
}

/**
 * PUT /api/v1/sponsors/:id
 * ------------------------
 * Actualizar sponsor.
 * 
 * @access Admin (del torneo)
 * @param id ID del sponsor
 * @body UpdateSponsorRequestDTO
 */
export interface UpdateSponsorEndpoint {
  method: 'PUT';
  path: '/api/v1/sponsors/:id';
  params: { id: number };
  request: UpdateSponsorRequestDTO;
  response: ApiResponse<SponsorResponseDTO>;
}

/**
 * DELETE /api/v1/sponsors/:id
 * ---------------------------
 * Eliminar sponsor.
 * 
 * @access Admin (del torneo)
 * @param id ID del sponsor
 */
export interface DeleteSponsorEndpoint {
  method: 'DELETE';
  path: '/api/v1/sponsors/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// LOGO DE SPONSOR
// ============================================

/**
 * POST /api/v1/sponsors/:id/logo
 * ------------------------------
 * Subir/actualizar logo del sponsor.
 * 
 * @access Admin (del torneo)
 * @param id ID del sponsor
 * @body multipart/form-data { logo: File }
 */
export interface UploadSponsorLogoEndpoint {
  method: 'POST';
  path: '/api/v1/sponsors/:id/logo';
  params: { id: number };
  request: FormData; // { logo: File }
  response: ApiResponse<{ logo_url: string }>;
}

// ============================================
// ORDENAMIENTO DE SPONSORS
// ============================================

/**
 * PUT /api/v1/sponsors/orden
 * --------------------------
 * Reordenar sponsors.
 * 
 * @access Admin (del torneo)
 * @body { orden: { id_sponsor: number, orden: number }[] }
 */
export interface ReordenarSponsorsEndpoint {
  method: 'PUT';
  path: '/api/v1/sponsors/orden';
  request: {
    orden: { id_sponsor: number; orden: number }[];
  };
  response: ApiResponse<{ message: string }>;
}

// ============================================
// BANNERS
// ============================================

/**
 * GET /api/v1/banners
 * -------------------
 * Listar banners activos.
 * 
 * @access Public
 * @query id_pais - Filtrar por país
 * @query id_torneo - Filtrar por torneo
 */
export interface ListBannersEndpoint {
  method: 'GET';
  path: '/api/v1/banners';
  query: {
    id_pais?: number;
    id_torneo?: number;
  };
  response: ApiResponse<BannerResponseDTO[]>;
}

/**
 * GET /api/v1/banners/activos
 * ---------------------------
 * Obtener banners activos para mostrar al usuario.
 * Filtra automáticamente por vigencia y ubicación.
 * 
 * @access Public
 * @query id_pais - País del usuario
 * @query id_torneo - Torneo actual
 */
export interface GetBannersActivosEndpoint {
  method: 'GET';
  path: '/api/v1/banners/activos';
  query: {
    id_pais?: number;
    id_torneo?: number;
  };
  response: ApiResponse<BannerResponseDTO[]>;
}

/**
 * GET /api/v1/banners/:id
 * -----------------------
 * Obtener banner por ID.
 * 
 * @access Admin
 * @param id ID del banner
 */
export interface GetBannerEndpoint {
  method: 'GET';
  path: '/api/v1/banners/:id';
  params: { id: number };
  response: ApiResponse<BannerResponseDTO>;
}

/**
 * POST /api/v1/banners
 * --------------------
 * Crear nuevo banner.
 * 
 * @access SuperAdmin, Admin
 * @body CreateBannerRequestDTO
 */
export interface CreateBannerEndpoint {
  method: 'POST';
  path: '/api/v1/banners';
  request: CreateBannerRequestDTO;
  response: ApiResponse<BannerResponseDTO>;
}

/**
 * PUT /api/v1/banners/:id
 * -----------------------
 * Actualizar banner.
 * 
 * @access SuperAdmin, Admin
 * @param id ID del banner
 * @body UpdateBannerRequestDTO
 */
export interface UpdateBannerEndpoint {
  method: 'PUT';
  path: '/api/v1/banners/:id';
  params: { id: number };
  request: UpdateBannerRequestDTO;
  response: ApiResponse<BannerResponseDTO>;
}

/**
 * DELETE /api/v1/banners/:id
 * --------------------------
 * Eliminar banner.
 * 
 * @access SuperAdmin, Admin
 * @param id ID del banner
 */
export interface DeleteBannerEndpoint {
  method: 'DELETE';
  path: '/api/v1/banners/:id';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/banners/:id/imagen
 * -------------------------------
 * Subir imagen del banner.
 * 
 * @access SuperAdmin, Admin
 * @param id ID del banner
 * @body multipart/form-data { imagen: File }
 */
export interface UploadBannerImagenEndpoint {
  method: 'POST';
  path: '/api/v1/banners/:id/imagen';
  params: { id: number };
  request: FormData; // { imagen: File }
  response: ApiResponse<{ imagen_url: string }>;
}

// ============================================
// MÉTRICAS DE BANNERS
// ============================================

/**
 * POST /api/v1/banners/:id/click
 * ------------------------------
 * Registrar click en banner.
 * 
 * @access Public
 * @param id ID del banner
 */
export interface RegistrarClickBannerEndpoint {
  method: 'POST';
  path: '/api/v1/banners/:id/click';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/banners/:id/impresion
 * ----------------------------------
 * Registrar impresión de banner.
 * 
 * @access Public
 * @param id ID del banner
 */
export interface RegistrarImpresionBannerEndpoint {
  method: 'POST';
  path: '/api/v1/banners/:id/impresion';
  params: { id: number };
  response: ApiResponse<{ message: string }>;
}

/**
 * GET /api/v1/banners/:id/metricas
 * --------------------------------
 * Obtener métricas del banner.
 * 
 * @access Admin
 * @param id ID del banner
 */
export interface GetMetricasBannerEndpoint {
  method: 'GET';
  path: '/api/v1/banners/:id/metricas';
  params: { id: number };
  response: ApiResponse<{
    id_banner: number;
    impresiones: number;
    clicks: number;
    ctr: number; // Click-through rate
    periodo: {
      desde: Date;
      hasta: Date;
    };
  }>;
}
