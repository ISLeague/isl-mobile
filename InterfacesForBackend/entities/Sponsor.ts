/**
 * Sponsor Entity
 * ==============
 * Patrocinadores de torneos/categorías.
 */

export type TipoSponsor = 'principal' | 'oficial' | 'colaborador';

export interface Sponsor {
  id_sponsor: number;
  nombre: string;
  logo: string; // URL del logo
  link: string | null; // URL del sitio web
  
  tipo: TipoSponsor;
  descripcion: string | null;
  
  // Puede estar asociado a una edición-categoría específica o ser global
  id_edicion_categoria: number | null;
  
  // Orden de aparición
  orden: number;
  
  activo: boolean;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_edicion_categoria
 * - INDEX en activo
 * - INDEX en tipo
 * - INDEX en orden
 */
