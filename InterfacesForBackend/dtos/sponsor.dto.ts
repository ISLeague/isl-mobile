/**
 * Sponsor DTOs
 * ============
 * Data Transfer Objects para sponsors y banners.
 */

// ============ SPONSOR DTOs ============

export interface CreateSponsorRequestDTO {
  nombre: string;
  logo: string;
  link?: string;
  tipo: 'principal' | 'oficial' | 'colaborador';
  descripcion?: string;
  id_edicion_categoria?: number;
  orden?: number;
  fecha_inicio?: Date;
  fecha_fin?: Date;
}

export interface UpdateSponsorRequestDTO {
  nombre?: string;
  logo?: string;
  link?: string;
  tipo?: 'principal' | 'oficial' | 'colaborador';
  descripcion?: string;
  orden?: number;
  fecha_inicio?: Date | null;
  fecha_fin?: Date | null;
  activo?: boolean;
}

export interface SponsorResponseDTO {
  id_sponsor: number;
  nombre: string;
  logo: string;
  link: string | null;
  tipo: string;
  descripcion: string | null;
  edicion_categoria?: {
    id_edicion_categoria: number;
    categoria_nombre: string;
    edicion_numero: number;
  };
  orden: number;
  activo: boolean;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
}

export interface SponsorListItemDTO {
  id_sponsor: number;
  nombre: string;
  logo: string;
  link: string | null;
  tipo: string;
}

// ============ BANNER DTOs ============

export interface CreateBannerRequestDTO {
  titulo?: string;
  imagen: string;
  link?: string;
  id_pais?: number;
  id_torneo?: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  orden?: number;
}

export interface UpdateBannerRequestDTO {
  titulo?: string;
  imagen?: string;
  link?: string;
  id_pais?: number | null;
  id_torneo?: number | null;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  orden?: number;
  activo?: boolean;
}

export interface BannerResponseDTO {
  id_banner: number;
  titulo: string | null;
  imagen: string;
  link: string | null;
  pais?: {
    id_pais: number;
    nombre: string;
  };
  torneo?: {
    id_torneo: number;
    nombre: string;
  };
  fecha_inicio: Date;
  fecha_fin: Date;
  orden: number;
  activo: boolean;
  clicks: number;
  impresiones: number;
}

export interface BannerPublicoDTO {
  id_banner: number;
  titulo: string | null;
  imagen: string;
  link: string | null;
}
