/**
 * Fase Entity
 * ===========
 * Fases de competición (Fase de Grupos, Octavos, Cuartos, etc.)
 */

export type TipoFase = 'grupo' | 'knockout';
export type TipoCopa = 'general' | 'oro' | 'plata' | 'bronce';

export interface Fase {
  id_fase: number;
  nombre: string; // "Fase de Grupos", "Octavos de Final", "Semifinal", "Final"
  tipo: TipoFase;
  copa: TipoCopa | null; // null para fase de grupos
  orden: number; // Para ordenar las fases cronológicamente
  id_edicion_categoria: number;
  
  // Configuración de la fase
  partidos_ida_vuelta: boolean;
  permite_empate: boolean; // false para eliminatorias
  permite_penales: boolean; // true para eliminatorias
  
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_edicion_categoria
 * - INDEX en tipo
 * - INDEX en copa
 * - INDEX en orden
 */
