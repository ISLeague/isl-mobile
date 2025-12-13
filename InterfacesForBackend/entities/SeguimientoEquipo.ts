/**
 * SeguimientoEquipo Entity
 * ========================
 * Relación entre usuarios y equipos que siguen.
 */

export interface SeguimientoEquipo {
  id_seguimiento: number;
  id_usuario: number;
  id_equipo: number;
  
  // Preferencias de notificaciones
  notificar_partidos: boolean;
  notificar_resultados: boolean;
  notificar_goles: boolean;
  notificar_tarjetas: boolean;
  
  // Compras
  pago_fotos: boolean; // Si ha pagado por las fotos del equipo
  fecha_pago_fotos: Date | null;
  
  fecha_seguimiento: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Índices recomendados:
 * - UNIQUE INDEX en (id_usuario, id_equipo) - un usuario solo puede seguir un equipo
 * - INDEX en id_usuario
 * - INDEX en id_equipo
 */

/**
 * Regla de negocio:
 * - Un fan solo puede seguir UN equipo a la vez
 * - Para cambiar de equipo, debe dejar de seguir el actual primero
 */
