/**
 * Banner Entity
 * =============
 * Banners promocionales para la app.
 */

export interface Banner {
  id_banner: number;
  titulo: string | null;
  imagen: string; // URL de la imagen
  link: string | null; // URL o deep link
  
  // Segmentación
  id_pais: number | null;     // null = todos los países
  id_torneo: number | null;   // null = todos los torneos
  
  // Programación
  fecha_inicio: Date;
  fecha_fin: Date;
  
  // Orden y estado
  orden: number;
  activo: boolean;
  
  // Métricas
  clicks: number;
  impresiones: number;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en activo
 * - INDEX en fecha_inicio
 * - INDEX en fecha_fin
 * - INDEX en id_pais
 * - INDEX en id_torneo
 */
