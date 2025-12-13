/**
 * Notificacion Entity
 * ===================
 * Notificaciones push para usuarios.
 */

export type TipoNotificacion = 
  | 'partido_proximo'      // Recordatorio de partido
  | 'resultado'            // Resultado de partido
  | 'gol'                  // Gol en tiempo real
  | 'tarjeta'              // Tarjeta en tiempo real
  | 'cambio_horario'       // Cambio de fecha/hora
  | 'suspension'           // Partido suspendido
  | 'general'              // Notificación general del torneo
  | 'promocion'            // Promociones/ofertas
  | 'sistema';             // Notificaciones del sistema

export interface Notificacion {
  id_notificacion: number;
  titulo: string;
  descripcion: string;
  tipo: TipoNotificacion;
  
  // Destino
  id_usuario: number | null;  // null = broadcast a todos
  id_equipo: number | null;   // Para enviar a seguidores de un equipo
  id_torneo: number | null;   // Para enviar a todos del torneo
  
  // Referencias
  id_partido: number | null;  // Si está relacionada con un partido
  url: string | null;         // Deep link o URL
  
  // Prioridad
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  
  // Estado
  enviada: boolean;
  fecha_envio: Date | null;
  leida: boolean;
  fecha_lectura: Date | null;
  
  // Push notification
  push_enviado: boolean;
  push_token_usado: string | null;
  
  // Expiración
  fecha_expiracion: Date | null;
  
  created_at: Date;
}

/**
 * Índices recomendados:
 * - INDEX en id_usuario
 * - INDEX en id_equipo
 * - INDEX en id_torneo
 * - INDEX en tipo
 * - INDEX en enviada
 * - INDEX en leida
 * - INDEX en created_at
 */
