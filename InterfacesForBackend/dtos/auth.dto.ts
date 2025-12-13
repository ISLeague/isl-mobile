/**
 * Auth DTOs
 * =========
 * Data Transfer Objects para autenticación.
 */

// ============ REQUEST DTOs ============

export interface LoginRequestDTO {
  email: string;
  password: string;
  device_token?: string; // Para notificaciones push
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  nombre_completo: string;
  id_pais: number;
  acepto_terminos: boolean;
  device_token?: string;
}

export interface ChangePasswordRequestDTO {
  password_actual: string;
  password_nueva: string;
  password_confirmacion: string;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordRequestDTO {
  token: string;
  password_nueva: string;
  password_confirmacion: string;
}

export interface RefreshTokenRequestDTO {
  refresh_token: string;
}

// ============ RESPONSE DTOs ============

export interface AuthTokensDTO {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Segundos hasta expiración
  token_type: 'Bearer';
}

export interface LoginResponseDTO {
  usuario: UsuarioAuthDTO;
  tokens: AuthTokensDTO;
}

export interface UsuarioAuthDTO {
  id_usuario: number;
  email: string;
  nombre_completo: string;
  rol: 'superadmin' | 'admin' | 'fan' | 'invitado';
  id_pais: number;
  nombre_pais?: string;
  avatar?: string;
  debe_cambiar_password: boolean;
  id_torneos?: number[]; // Para admin
  id_ediciones?: number[]; // Para admin
}

export interface RegisterResponseDTO {
  usuario: UsuarioAuthDTO;
  tokens: AuthTokensDTO;
  mensaje: string;
}
