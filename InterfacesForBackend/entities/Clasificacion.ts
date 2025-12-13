/**
 * Clasificacion Entity
 * ====================
 * Tabla de posiciones de un grupo.
 */

export interface Clasificacion {
  id_clasificacion: number;
  id_equipo: number;
  id_grupo: number;
  
  // Estadísticas
  pj: number; // Partidos jugados
  pg: number; // Partidos ganados
  pe: number; // Partidos empatados
  pp: number; // Partidos perdidos
  gf: number; // Goles a favor
  gc: number; // Goles en contra
  dif: number; // Diferencia de goles (gf - gc)
  puntos: number; // (pg * 3) + pe
  
  // Posición calculada
  posicion: number;
  
  // Criterios de desempate
  goles_head_to_head: number; // Goles en enfrentamientos directos
  puntos_head_to_head: number; // Puntos en enfrentamientos directos
  
  // Bonificaciones/Penalizaciones
  puntos_bonus: number; // Puntos agregados por fair play, etc.
  puntos_penalizacion: number; // Puntos restados por sanciones
  motivo_penalizacion: string | null;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - UNIQUE INDEX en (id_equipo, id_grupo)
 * - INDEX en id_grupo
 * - INDEX en posicion
 * - INDEX en puntos (para ordenar)
 */

/**
 * Criterios de desempate (en orden):
 * 1. Puntos
 * 2. Diferencia de goles
 * 3. Goles a favor
 * 4. Puntos en enfrentamientos directos
 * 5. Goles en enfrentamientos directos
 * 6. Sorteo
 */
