/**
 * HistorialEquipoEdicion Entity
 * =============================
 * Historial de rendimiento de equipos por edición.
 */

export interface HistorialEquipoEdicion {
  id_historial: number;
  id_equipo: number;
  id_edicion: number;
  
  // Resultado final
  fase_final: string; // "Campeón", "Subcampeón", "Semifinalista", "Cuartos", etc.
  posicion_final: number | null; // 1, 2, 3, 4...
  copa: string | null; // "oro", "plata", "bronce"
  
  // Estadísticas de la edición
  partidos_jugados: number;
  partidos_ganados: number;
  partidos_empatados: number;
  partidos_perdidos: number;
  goles_favor: number;
  goles_contra: number;
  puntos_totales: number;
  
  // Premios
  es_campeon: boolean;
  es_subcampeon: boolean;
  premio_fair_play: boolean;
  
  created_at: Date;
}

/**
 * Índices recomendados:
 * - UNIQUE INDEX en (id_equipo, id_edicion)
 * - INDEX en id_equipo
 * - INDEX en id_edicion
 * - INDEX en es_campeon
 */
