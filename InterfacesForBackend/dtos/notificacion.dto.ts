/**
 * Notificacion DTOs
 * =================
 * Data Transfer Objects para notificaciones.
 */

// ============ REQUEST DTOs ============

export interface CreateNotificacionRequestDTO {
  titulo: string;
  descripcion: string;
  tipo: 'partido_proximo' | 'resultado' | 'gol' | 'tarjeta' | 'cambio_horario' | 'suspension' | 'general' | 'promocion' | 'sistema';
  id_usuario?: number;    // null = broadcast
  id_equipo?: number;     // Para seguidores del equipo
  id_torneo?: number;     // Para todos del torneo
  id_partido?: number;
  url?: string;
  prioridad?: 'baja' | 'normal' | 'alta' | 'urgente';
  fecha_expiracion?: Date;
}

export interface EnviarNotificacionMasivaRequestDTO {
  titulo: string;
  descripcion: string;
  tipo: 'general' | 'promocion';
  filtros: {
    id_pais?: number;
    id_torneo?: number;
    id_edicion?: number;
    roles?: ('fan')[];
  };
  url?: string;
  prioridad?: 'baja' | 'normal' | 'alta' | 'urgente';
  programar_para?: Date; // Si se quiere programar
}

export interface MarcarLeidaRequestDTO {
  id_notificaciones: number[];
}

// ============ RESPONSE DTOs ============

export interface NotificacionResponseDTO {
  id_notificacion: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: string;
  url: string | null;
  partido?: {
    id_partido: number;
    equipos: string;
  };
  leida: boolean;
  fecha_lectura: Date | null;
  created_at: Date;
}

export interface NotificacionListResponseDTO {
  notificaciones: NotificacionResponseDTO[];
  total: number;
  no_leidas: number;
  pagina: number;
  total_paginas: number;
}

export interface NotificacionEnviadaResponseDTO {
  id_notificacion: number;
  titulo: string;
  tipo: string;
  destinatarios_count: number;
  enviada: boolean;
  fecha_envio: Date | null;
}

// ============ CONFIG DTOs ============

export interface ConfigNotificacionesUsuarioDTO {
  notificar_partidos_equipo: boolean;
  notificar_resultados: boolean;
  notificar_goles: boolean;
  notificar_tarjetas: boolean;
  notificar_cambios_horario: boolean;
  notificar_promociones: boolean;
  notificar_generales: boolean;
}

export interface UpdateConfigNotificacionesDTO {
  notificar_partidos_equipo?: boolean;
  notificar_resultados?: boolean;
  notificar_goles?: boolean;
  notificar_tarjetas?: boolean;
  notificar_cambios_horario?: boolean;
  notificar_promociones?: boolean;
  notificar_generales?: boolean;
}

// ============ PUSH TOKEN DTOs ============

export interface RegisterPushTokenRequestDTO {
  device_token: string;
  platform: 'ios' | 'android' | 'web';
  device_name?: string;
}

export interface PushTokenResponseDTO {
  id_token: number;
  device_token: string;
  platform: string;
  activo: boolean;
  created_at: Date;
}
