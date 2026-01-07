// ============================================
// 🤝 SPONSORS TYPES
// ============================================

export type TipoSponsor = 'principal' | 'oficial' | 'colaborador';

export interface Sponsor {
  id_sponsor: number;
  nombre: string;
  logo: string;
  link: string;
  tipo: TipoSponsor;
  descripcion?: string;
  id_edicion_categoria: number;
  orden: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSponsorRequest {
  nombre: string;
  logo: string;
  link: string;
  tipo: TipoSponsor;
  descripcion?: string;
  id_edicion_categoria: number;
  orden: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface UpdateSponsorRequest {
  id_sponsor: number;
  nombre?: string;
  logo?: string;
  link?: string;
  tipo?: TipoSponsor;
  descripcion?: string;
  orden?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface SponsorsPorTipo {
  principal: Sponsor[];
  oficial: Sponsor[];
  colaborador: Sponsor[];
}

export interface SponsorsListData {
  total: number;
  sponsors: Sponsor[];
  por_tipo: SponsorsPorTipo;
}

// Response types
export interface SponsorResponse {
  success: boolean;
  data: Sponsor;
  timestamp: string;
}

export interface SponsorsListResponse {
  success: boolean;
  data: SponsorsListData;
  timestamp: string;
}
