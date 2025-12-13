/**
 * Pais DTOs
 * =========
 * Data Transfer Objects para países.
 */

// ============ REQUEST DTOs ============

export interface CreatePaisRequestDTO {
  nombre: string;
  codigo_iso: string;
  emoji: string;
}

export interface UpdatePaisRequestDTO {
  nombre?: string;
  codigo_iso?: string;
  emoji?: string;
  activo?: boolean;
}

// ============ RESPONSE DTOs ============

export interface PaisResponseDTO {
  id_pais: number;
  nombre: string;
  codigo_iso: string;
  emoji: string;
  activo: boolean;
  torneos_count?: number;
}

export interface PaisListItemDTO {
  id_pais: number;
  nombre: string;
  emoji: string;
}

export interface PaisConTorneosDTO {
  id_pais: number;
  nombre: string;
  codigo_iso: string;
  emoji: string;
  torneos: {
    id_torneo: number;
    nombre: string;
    logo: string | null;
    edicion_actual?: number;
  }[];
}
