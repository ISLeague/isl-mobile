/**
 * Ronda Entity
 * ============
 * Rondas/Jornadas de partidos.
 */

export type TipoRonda = 'fase_grupos' | 'eliminatorias' | 'amistosa';
export type SubtipoEliminatoria = 'oro' | 'plata' | 'bronce';

export interface Ronda {
  id_ronda: number;
  nombre: string; // "Jornada 1", "Octavos de Final", "Amistoso 1"
  id_fase: number;
  
  tipo: TipoRonda;
  subtipo_eliminatoria: SubtipoEliminatoria | null; // Solo para eliminatorias
  es_amistosa: boolean;
  
  // Fechas
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  
  // Configuración
  aplicar_fecha_automatica: boolean; // Si los partidos heredan la fecha de la ronda
  orden: number; // Para ordenar las rondas
  
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_fase
 * - INDEX en tipo
 * - INDEX en orden
 * - INDEX en fecha_inicio
 */
