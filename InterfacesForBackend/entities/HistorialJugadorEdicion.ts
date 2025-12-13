/**
 * HistorialJugadorEdicion Entity
 * ==============================
 * Historial de rendimiento de jugadores por edición.
 */

export interface HistorialJugadorEdicion {
  id_historial_jugador: number;
  id_jugador: number;
  id_edicion: number;
  id_equipo: number; // Equipo con el que jugó esa edición
  
  // Estadísticas
  partidos_jugados: number;
  minutos_jugados: number;
  goles_totales: number;
  asistencias_totales: number;
  amarillas_totales: number;
  rojas_totales: number;
  dobles_amarillas: number;
  autogoles: number;
  penales_convertidos: number;
  penales_fallados: number;
  
  // Reconocimientos
  mvp_partidos: number; // Veces que fue MVP
  es_goleador: boolean; // Máximo goleador de la edición
  es_mejor_jugador: boolean; // MVP de la edición
  
  // Resultado con su equipo
  posicion_final_equipo: number | null;
  
  created_at: Date;
}

/**
 * Índices recomendados:
 * - UNIQUE INDEX en (id_jugador, id_edicion, id_equipo)
 * - INDEX en id_jugador
 * - INDEX en id_edicion
 * - INDEX en id_equipo
 * - INDEX en goles_totales (para rankings)
 */
