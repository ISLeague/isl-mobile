/**
 * Fotos Entity
 * ============
 * Fotos de equipos/partidos.
 */

export interface Fotos {
  id_fotos: number;
  id_equipo: number;
  id_partido: number | null; // Opcional, puede ser de un partido específico
  
  // URLs
  link_fotos_totales: string; // Link a galería completa (requiere pago)
  link_preview: string; // Imagen de preview gratuita
  
  titulo: string | null;
  descripcion: string | null;
  cantidad_fotos: number;
  
  // Precios
  precio: number; // En la moneda local
  moneda: string; // "PEN", "ARS", "USD"
  
  // Estado
  activo: boolean;
  fecha_subida: Date;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_equipo
 * - INDEX en id_partido
 * - INDEX en activo
 */
