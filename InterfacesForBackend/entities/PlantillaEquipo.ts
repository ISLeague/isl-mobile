/**
 * PlantillaEquipo Entity
 * ======================
 * Relación N:N entre Equipos y Jugadores.
 * Un jugador puede estar en múltiples equipos (en diferentes ediciones).
 */

export interface PlantillaEquipo {
  id_plantilla: number;
  id_equipo: number;
  id_jugador: number;
  
  numero_camiseta: number | null; // Puede ser diferente al del jugador base
  activo_en_equipo: boolean;
  es_refuerzo: boolean;
  es_capitan: boolean;
  
  // Fechas de permanencia
  fecha_registro: Date;
  fecha_baja: Date | null;
  motivo_baja: string | null; // "transferencia", "lesion", "baja voluntaria", etc.
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_equipo
 * - INDEX en id_jugador
 * - INDEX en activo_en_equipo
 * - UNIQUE INDEX en (id_equipo, id_jugador) para evitar duplicados
 */
