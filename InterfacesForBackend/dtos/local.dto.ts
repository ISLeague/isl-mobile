/**
 * Local DTOs
 * ==========
 * Data Transfer Objects para locales y canchas.
 */

// ============ LOCAL DTOs ============

export interface CreateLocalRequestDTO {
  nombre: string;
  direccion?: string;
  latitud: number;
  longitud: number;
  telefono?: string;
  email?: string;
  capacidad_total?: number;
  tiene_estacionamiento?: boolean;
  tiene_vestuarios?: boolean;
  tiene_iluminacion?: boolean;
  foto_principal?: string;
  id_edicion_categoria?: number;
}

export interface UpdateLocalRequestDTO {
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

export interface LocalResponseDTO {
  id_local: number;
  nombre: string;
  direccion: string | null;
  latitud: number;
  longitud: number;
  telefono: string | null;
  email: string | null;
  capacidad_total: number | null;
  tiene_estacionamiento: boolean;
  tiene_vestuarios: boolean;
  tiene_iluminacion: boolean;
  foto_principal: string | null;
  canchas: CanchaResumenDTO[];
  activo: boolean;
}

export interface LocalListItemDTO {
  id_local: number;
  nombre: string;
  direccion: string | null;
  foto_principal: string | null;
  canchas_count: number;
  distancia_km?: number; // Si se calcula desde ubicación del usuario
}

export interface LocalMapDTO {
  id_local: number;
  nombre: string;
  latitud: number;
  longitud: number;
  direccion: string | null;
}

// ============ CANCHA DTOs ============

export interface CreateCanchaRequestDTO {
  nombre: string;
  id_local: number;
  tipo_superficie?: 'cesped_natural' | 'cesped_sintetico' | 'tierra' | 'cemento';
  dimensiones?: string;
  capacidad_espectadores?: number;
  tiene_iluminacion?: boolean;
  tiene_gradas?: boolean;
}

export interface UpdateCanchaRequestDTO {
  nombre?: string;
  tipo_superficie?: 'cesped_natural' | 'cesped_sintetico' | 'tierra' | 'cemento' | null;
  dimensiones?: string | null;
  capacidad_espectadores?: number | null;
  tiene_iluminacion?: boolean;
  tiene_gradas?: boolean;
  activo?: boolean;
}

export interface CanchaResponseDTO {
  id_cancha: number;
  nombre: string;
  local: {
    id_local: number;
    nombre: string;
    direccion: string | null;
  };
  tipo_superficie: string | null;
  dimensiones: string | null;
  capacidad_espectadores: number | null;
  tiene_iluminacion: boolean;
  tiene_gradas: boolean;
  activo: boolean;
}

export interface CanchaResumenDTO {
  id_cancha: number;
  nombre: string;
  tipo_superficie: string | null;
  tiene_iluminacion: boolean;
}

export interface CanchaDisponibilidadDTO {
  id_cancha: number;
  nombre: string;
  local_nombre: string;
  horarios_ocupados: HorarioOcupadoDTO[];
}

export interface HorarioOcupadoDTO {
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  partido?: {
    id_partido: number;
    equipos: string;
  };
}
