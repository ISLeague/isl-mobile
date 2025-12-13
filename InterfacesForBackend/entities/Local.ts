/**
 * Local Entity
 * ============
 * Complejos deportivos donde se juegan los partidos.
 */

export interface Local {
  id_local: number;
  nombre: string;
  direccion: string | null;
  
  // Geolocalización
  latitud: number;
  longitud: number;
  
  // Información adicional
  telefono: string | null;
  email: string | null;
  capacidad_total: number | null;
  tiene_estacionamiento: boolean;
  tiene_vestuarios: boolean;
  tiene_iluminacion: boolean;
  
  // Imágenes
  foto_principal: string | null;
  
  // Relación con edición-categoría (opcional, puede ser global)
  id_edicion_categoria: number | null;
  
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_edicion_categoria
 * - INDEX en activo
 * - SPATIAL INDEX en (latitud, longitud) para búsquedas geográficas
 */
