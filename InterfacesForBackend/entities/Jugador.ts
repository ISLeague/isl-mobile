/**
 * Jugador Entity
 * ==============
 * Jugadores de fútbol.
 */

export type EstadoJugador = 'activo' | 'inactivo' | 'suspendido' | 'lesionado';

export interface Jugador {
  id_jugador: number;
  nombre_completo: string;
  dni: string; // Documento de identidad
  fecha_nacimiento: Date;
  numero_camiseta: number | null;
  posicion: string | null; // Portero, Defensa, Mediocampista, Delantero
  pie_dominante: 'izquierdo' | 'derecho' | 'ambidiestro' | null;
  foto: string | null; // URL de la foto
  estado: EstadoJugador;
  
  // Datos adicionales opcionales
  altura_cm: number | null;
  peso_kg: number | null;
  nacionalidad: string | null;
  
  // Relación con usuario (si el jugador tiene cuenta)
  id_usuario: number | null;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - UNIQUE INDEX en dni
 * - INDEX en estado
 * - INDEX en id_usuario
 * - INDEX en nombre_completo (para búsquedas)
 */
