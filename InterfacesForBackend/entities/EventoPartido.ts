/**
 * EventoPartido Entity
 * ====================
 * Eventos ocurridos durante un partido (goles, tarjetas, cambios, etc.)
 */

export type TipoEvento = 
  | 'gol' 
  | 'gol_penal' 
  | 'autogol' 
  | 'asistencia' 
  | 'amarilla' 
  | 'roja' 
  | 'doble_amarilla' // Segunda amarilla = roja
  | 'cambio_entrada' 
  | 'cambio_salida'
  | 'penal_fallado'
  | 'penal_atajado'
  | 'mvp'; // Jugador del partido

export interface EventoPartido {
  id_evento: number;
  id_partido: number;
  id_jugador: number;
  id_equipo: number; // Para saber a qué equipo pertenece el evento
  
  tipo_evento: TipoEvento;
  minuto: number; // 0-90+ (puede ser mayor a 90 por tiempo agregado)
  tiempo_extra: boolean; // Si ocurrió en tiempo extra
  
  // Para cambios: jugador relacionado
  id_jugador_relacionado: number | null; // El que entra cuando otro sale
  
  // Datos adicionales
  descripcion: string | null;
  
  created_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_partido
 * - INDEX en id_jugador
 * - INDEX en id_equipo
 * - INDEX en tipo_evento
 * - INDEX en minuto
 */

/**
 * Reglas de negocio:
 * - Máximo 2 amarillas por jugador por partido (la segunda es roja automática)
 * - Máximo 1 roja directa por jugador por partido
 * - Los eventos de cambio deben tener id_jugador_relacionado
 * - El MVP es único por partido
 */
