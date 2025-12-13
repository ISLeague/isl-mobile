/**
 * Pais Entity
 * ===========
 * Países donde se realizan torneos.
 */

export interface Pais {
  id_pais: number;
  nombre: string;
  codigo_iso: string; // Ej: "PE", "AR", "BR"
  emoji: string; // Ej: "🇵🇪", "🇦🇷"
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - UNIQUE INDEX en codigo_iso
 * - INDEX en activo
 */
