// ============================================
// 📍 LOCALES Y CANCHAS TYPES
// ============================================

// ============================================
// LOCALES
// ============================================

export interface Local {
  id_local: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono?: string;
  email?: string;
  capacidad_total?: number;
  tiene_estacionamiento?: boolean;
  tiene_vestuarios?: boolean;
  tiene_iluminacion?: boolean;
  foto_principal?: string;
  id_edicion_categoria: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  // Para list response
  canchas_count?: number;
  // Para detail response
  canchas?: Cancha[];
}

export interface CreateLocalRequest {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono?: string;
  email?: string;
  capacidad_total?: number;
  tiene_estacionamiento?: boolean;
  tiene_vestuarios?: boolean;
  tiene_iluminacion?: boolean;
  foto_principal?: string;
  id_edicion_categoria: number;
}

export interface UpdateLocalRequest {
  id_local: number;
  nombre?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  email?: string;
  capacidad_total?: number;
  tiene_estacionamiento?: boolean;
  tiene_vestuarios?: boolean;
  tiene_iluminacion?: boolean;
  foto_principal?: string;
  activo?: boolean;
}

// ============================================
// CANCHAS
// ============================================

export type TipoSuperficie = 'cesped_natural' | 'cesped_sintetico' | 'tierra' | 'concreto';

export interface Cancha {
  id_cancha: number;
  nombre: string;
  id_local: number;
  tipo_superficie: TipoSuperficie;
  dimensiones?: string;
  capacidad_espectadores?: number;
  tiene_iluminacion?: boolean;
  tiene_gradas?: boolean;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCanchaRequest {
  nombre: string;
  id_local: number;
  tipo_superficie: TipoSuperficie;
  dimensiones?: string;
  capacidad_espectadores?: number;
  tiene_iluminacion?: boolean;
  tiene_gradas?: boolean;
}

export interface UpdateCanchaRequest {
  id_cancha: number;
  nombre?: string;
  tipo_superficie?: TipoSuperficie;
  dimensiones?: string;
  capacidad_espectadores?: number;
  tiene_iluminacion?: boolean;
  tiene_gradas?: boolean;
  activo?: boolean;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface LocalResponse {
  success: boolean;
  data: Local;
  timestamp: string;
}

export interface LocalesListResponse {
  success: boolean;
  data: {
    locales: Local[];
    total: number;
  };
  timestamp: string;
}

export interface CanchaResponse {
  success: boolean;
  data: Cancha;
  timestamp: string;
}

export interface CanchasListResponse {
  success: boolean;
  data: {
    canchas: Cancha[];
    total: number;
  };
  timestamp: string;
}
