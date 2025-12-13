/**
 * ReglaAvance Entity
 * ==================
 * Reglas para avance entre fases (ej: de grupos a octavos).
 */

export interface ReglaAvance {
  id_regla: number;
  id_fase_origen: number;
  id_fase_destino: number;
  
  // Qué posiciones avanzan
  posicion_inicial: number; // Desde qué posición (ej: 1)
  posicion_final: number;   // Hasta qué posición (ej: 2)
  cupos: number;            // Cuántos equipos pasan
  
  // Criterios adicionales
  mejor_tercero: boolean;   // Si aplica para mejores terceros
  
  descripcion: string | null;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Ejemplo:
 * - Posiciones 1-2 de cada grupo → Octavos Copa de Oro
 * - Posición 3 de cada grupo → Octavos Copa de Plata
 * - Posición 4 de cada grupo → Copa de Bronce
 */

/**
 * Índices recomendados:
 * - INDEX en id_fase_origen
 * - INDEX en id_fase_destino
 */
