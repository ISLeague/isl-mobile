/**
 * Torneo Entity
 * =============
 * Torneos de fútbol amateur.
 */

export interface Torneo {
  id_torneo: number;
  nombre: string;
  descripcion: string | null;
  logo: string | null; // URL del logo del torneo
  id_pais: number;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_pais
 * - INDEX en activo
 */
