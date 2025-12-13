/**
 * Fotos DTOs
 * ==========
 * Data Transfer Objects para fotos y galería.
 */

// ============ REQUEST DTOs ============

export interface CreateFotosRequestDTO {
  id_equipo: number;
  id_partido?: number;
  link_fotos_totales: string;
  link_preview: string;
  titulo?: string;
  descripcion?: string;
  cantidad_fotos: number;
  precio: number;
  moneda: string;
}

export interface UpdateFotosRequestDTO {
  link_fotos_totales?: string;
  link_preview?: string;
  titulo?: string;
  descripcion?: string;
  cantidad_fotos?: number;
  precio?: number;
  moneda?: string;
  activo?: boolean;
}

export interface ComprarFotosRequestDTO {
  id_fotos: number;
  metodo_pago: 'tarjeta' | 'yape' | 'plin' | 'transferencia' | 'efectivo';
  comprobante_pago?: string; // URL o referencia del comprobante
}

// ============ RESPONSE DTOs ============

export interface FotosResponseDTO {
  id_fotos: number;
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  partido?: {
    id_partido: number;
    fecha: Date | null;
    rival: string;
    resultado: string;
  };
  link_preview: string;
  titulo: string | null;
  descripcion: string | null;
  cantidad_fotos: number;
  precio: number;
  moneda: string;
  fecha_subida: Date;
}

export interface FotosCompradasResponseDTO extends FotosResponseDTO {
  link_fotos_totales: string;
  fecha_compra: Date;
}

export interface FotosListItemDTO {
  id_fotos: number;
  equipo_nombre: string;
  equipo_logo: string | null;
  link_preview: string;
  titulo: string | null;
  cantidad_fotos: number;
  precio: number;
  moneda: string;
  comprada: boolean;
}

export interface GaleriaEquipoDTO {
  equipo: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  galerias: FotosListItemDTO[];
  total: number;
}

// ============ ADMIN RESPONSE DTOs ============

export interface FotosAdminResponseDTO {
  id_fotos: number;
  equipo: {
    id_equipo: number;
    nombre: string;
  };
  partido?: {
    id_partido: number;
    descripcion: string;
  };
  link_fotos_totales: string;
  link_preview: string;
  titulo: string | null;
  cantidad_fotos: number;
  precio: number;
  moneda: string;
  activo: boolean;
  ventas_count: number;
  ingresos_totales: number;
  fecha_subida: Date;
}
