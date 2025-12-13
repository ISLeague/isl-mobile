/**
 * Grupo Entity
 * ============
 * Grupos de la fase de grupos.
 */

export type TipoClasificacion = 
  | 'pasa_copa_general' 
  | 'pasa_copa_oro' 
  | 'pasa_copa_plata' 
  | 'pasa_copa_bronce' 
  | 'eliminado';

export interface Grupo {
  id_grupo: number;
  nombre: string; // "Grupo A", "Grupo B", etc.
  id_fase: number;
  
  // Configuración de clasificación
  tipo_clasificacion: TipoClasificacion;
  cantidad_equipos: number | null;
  equipos_pasan_oro: number; // Cuántos clasifican a Copa de Oro
  equipos_pasan_plata: number; // Cuántos clasifican a Copa de Plata
  equipos_pasan_bronce: number; // Cuántos clasifican a Copa de Bronce
  
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_fase
 * - UNIQUE INDEX en (id_fase, nombre)
 */
