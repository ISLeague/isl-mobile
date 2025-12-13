/**
 * Partido Entity
 * ==============
 * Partidos de fútbol.
 */

export type EstadoPartido = 'Pendiente' | 'En curso' | 'Finalizado' | 'Suspendido' | 'Aplazado' | 'Cancelado';

export interface Partido {
  id_partido: number;
  
  // Equipos
  id_equipo_local: number;
  id_equipo_visitante: number;
  
  // Relaciones
  id_ronda: number;
  id_fase: number;
  id_cancha: number | null;
  
  // Programación
  fecha: Date | null;
  hora: string | null; // "15:00", "17:30"
  
  // Estado y resultado
  estado_partido: EstadoPartido;
  marcador_local: number | null;
  marcador_visitante: number | null;
  
  // Para eliminatorias con empate
  penales_local: number | null;
  penales_visitante: number | null;
  fue_a_penales: boolean;
  
  // Walk Over (partido ganado sin jugar)
  wo: boolean;
  wo_equipo_ganador: number | null; // ID del equipo que gana por WO
  wo_motivo: string | null;
  
  // Datos adicionales
  arbitro_principal: string | null;
  observaciones: string | null;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_ronda
 * - INDEX en id_fase
 * - INDEX en id_equipo_local
 * - INDEX en id_equipo_visitante
 * - INDEX en estado_partido
 * - INDEX en fecha
 * - INDEX en (id_equipo_local, id_equipo_visitante) para búsquedas de enfrentamientos
 */
