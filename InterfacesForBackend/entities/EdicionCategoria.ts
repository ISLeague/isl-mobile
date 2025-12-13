/**
 * EdicionCategoria Entity
 * =======================
 * Relación N:N entre Ediciones y Categorías.
 * Representa una categoría específica en una edición de torneo.
 */

export interface EdicionCategoria {
  id_edicion_categoria: number;
  id_edicion: number;
  id_categoria: number;
  
  // Configuración específica para esta edición-categoría
  max_equipos: number | null; // Máximo de equipos permitidos
  max_jugadores_por_equipo: number | null;
  min_jugadores_por_equipo: number | null;
  
  // Sobrescribir restricciones de la categoría
  permite_refuerzos_override: boolean | null;
  max_refuerzos_override: number | null;
  
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - UNIQUE INDEX en (id_edicion, id_categoria)
 * - INDEX en id_edicion
 * - INDEX en id_categoria
 */
