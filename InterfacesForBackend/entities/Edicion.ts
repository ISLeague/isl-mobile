/**
 * Edicion Entity
 * ==============
 * Ediciones de un torneo (años/temporadas).
 */

export type EstadoEdicion = 'abierto' | 'cerrado' | 'en juego';

export interface Edicion {
  id_edicion: number;
  numero: number; // Año o número de edición (ej: 2024, 2025)
  nombre: string | null; // Nombre opcional (ej: "Torneo Verano")
  estado: EstadoEdicion;
  id_torneo: number;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_torneo
 * - INDEX en estado
 * - UNIQUE INDEX en (id_torneo, numero)
 */

/**
 * Estados:
 * - abierto: Inscripciones abiertas
 * - en juego: Torneo en curso
 * - cerrado: Torneo finalizado
 */
