/**
 * Equipo Entity
 * =============
 * Equipos participantes en torneos.
 */

export interface Equipo {
  id_equipo: number;
  nombre: string;
  nombre_corto: string | null; // Para mostrar en tablas (ej: "FCB" para FC Barcelona)
  logo: string | null; // URL del logo
  color_primario: string | null; // Hex color
  color_secundario: string | null; // Hex color
  id_edicion_categoria: number;
  
  // Contacto del equipo
  nombre_delegado: string | null;
  telefono_delegado: string | null;
  email_delegado: string | null;
  
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_edicion_categoria
 * - INDEX en activo
 * - INDEX en nombre (para búsquedas)
 */
