// ============================================
// 🤝 SPONSORS TYPES
// ============================================

export interface Sponsor {
  id_sponsor: number;
  nombre: string;
  logo: string;
  link: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSponsorRequest {
  nombre: string;
  logo: string;
  link: string;
}

export interface UpdateSponsorRequest {
  id_sponsor: number;
  nombre?: string;
  logo?: string;
  link?: string;
}

// Response types
export interface SponsorResponse {
  success: boolean;
  data: Sponsor;
  timestamp: string;
}

export interface SponsorsListResponse {
  success: boolean;
  data: Sponsor[];
  timestamp: string;
}
