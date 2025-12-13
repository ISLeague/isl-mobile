/**
 * Categoria Entity
 * ================
 * Categorías de competición (SUB16, SUB18, Libre, Veteranos, etc.)
 */

export interface Categoria {
  id_categoria: number;
  nombre: string; // SUB16, SUB18, Libre, Veteranos, etc.
  descripcion: string | null;
  tiene_restriccion_edad: boolean;
  edad_minima: number | null;
  edad_maxima: number | null;
  permite_refuerzos: boolean;
  max_refuerzos: number | null; // Máximo de refuerzos por equipo
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en activo
 * - UNIQUE INDEX en nombre
 */
