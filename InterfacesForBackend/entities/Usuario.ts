/**
 * Usuario Entity
 * ==============
 * Modelo de base de datos para usuarios del sistema.
 * Soporta múltiples roles: superadmin, admin, fan, invitado.
 */

export type RolUsuario = 'superadmin' | 'admin' | 'fan' | 'invitado';

export interface Usuario {
  id_usuario: number;
  email: string;
  password_hash: string;
  rol: RolUsuario;
  
  // Relaciones
  id_pais: number | null; // null para superadmin global
  
  // Para admins de torneo - pueden tener múltiples torneos asignados
  id_torneos: number[]; // Array de IDs de torneos asignados
  id_ediciones: number[]; // Array de IDs de ediciones correspondientes
  
  // Términos y privacidad
  acepto_terminos: boolean;
  acepto_privacidad: boolean;
  fecha_aceptacion_terminos: Date | null;
  
  // Estado de la cuenta
  activo: boolean;
  debe_cambiar_password: boolean;
  email_verificado: boolean;
  
  // Suplantación (para admins que están viendo como fan)
  id_admin_suplantando: number | null; // ID del admin que está suplantando
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
  
  // Tokens
  refresh_token: string | null;
  refresh_token_expires: Date | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  email_verification_token: string | null;
}

/**
 * Índices recomendados para la tabla usuarios:
 * - UNIQUE INDEX en email
 * - INDEX en rol
 * - INDEX en id_pais
 * - INDEX en activo
 * - INDEX en refresh_token
 */

/**
 * Permisos por rol:
 * 
 * SUPERADMIN:
 * - CRUD países
 * - CRUD torneos (todos)
 * - Asignar admins a torneos
 * - Suplantar cualquier usuario
 * - Ver estadísticas globales
 * 
 * ADMIN (de torneo):
 * - CRUD categorías (solo torneos asignados)
 * - CRUD equipos (solo torneos asignados)
 * - CRUD jugadores (solo torneos asignados)
 * - CRUD fixture y resultados (solo torneos asignados)
 * - CRUD sponsors (solo torneos asignados)
 * - Enviar notificaciones (solo su torneo)
 * 
 * FAN:
 * - Ver torneos/partidos
 * - Seguir un equipo
 * - Comprar fotos del equipo que sigue
 * 
 * INVITADO:
 * - Solo lectura
 * - No puede seguir equipos
 * - No puede comprar fotos
 */
