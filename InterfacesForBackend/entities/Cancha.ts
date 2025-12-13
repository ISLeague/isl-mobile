/**
 * Cancha Entity
 * =============
 * Canchas individuales dentro de un local.
 */

export type TipoSuperficie = 'cesped_natural' | 'cesped_sintetico' | 'tierra' | 'cemento';

export interface Cancha {
  id_cancha: number;
  nombre: string; // "Cancha 1", "Cancha Principal", etc.
  id_local: number;
  
  // Características
  tipo_superficie: TipoSuperficie | null;
  dimensiones: string | null; // "100x60m"
  capacidad_espectadores: number | null;
  tiene_iluminacion: boolean;
  tiene_gradas: boolean;
  
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_local
 * - INDEX en activo
 * - UNIQUE INDEX en (id_local, nombre)
 */
