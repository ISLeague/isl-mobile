/**
 * Auth Endpoints
 * ==============
 * Contratos de API para autenticación.
 * 
 * Base URL: /api/v1/auth
 */

import {
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
  RefreshTokenRequestDTO,
  AuthTokensDTO,
  UsuarioAuthDTO
} from '../dtos/auth.dto';
import { ApiResponse } from '../responses/api.responses';

// ============================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================

/**
 * POST /api/v1/auth/login
 * -----------------------
 * Iniciar sesión con email y contraseña.
 * 
 * @access Public
 * @body LoginRequestDTO
 * @returns LoginResponseDTO
 */
export interface LoginEndpoint {
  method: 'POST';
  path: '/api/v1/auth/login';
  request: LoginRequestDTO;
  response: ApiResponse<LoginResponseDTO>;
}

/**
 * POST /api/v1/auth/register
 * --------------------------
 * Registrar nuevo usuario (solo jugador o fan).
 * 
 * @access Public
 * @body RegisterRequestDTO
 * @returns RegisterResponseDTO
 */
export interface RegisterEndpoint {
  method: 'POST';
  path: '/api/v1/auth/register';
  request: RegisterRequestDTO;
  response: ApiResponse<RegisterResponseDTO>;
}

/**
 * POST /api/v1/auth/logout
 * ------------------------
 * Cerrar sesión (invalidar tokens).
 * 
 * @access Authenticated
 * @headers Authorization: Bearer {token}
 */
export interface LogoutEndpoint {
  method: 'POST';
  path: '/api/v1/auth/logout';
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/auth/refresh
 * -------------------------
 * Refrescar access token usando refresh token.
 * 
 * @access Public (pero requiere refresh_token válido)
 * @body RefreshTokenRequestDTO
 * @returns AuthTokensDTO
 */
export interface RefreshTokenEndpoint {
  method: 'POST';
  path: '/api/v1/auth/refresh';
  request: RefreshTokenRequestDTO;
  response: ApiResponse<AuthTokensDTO>;
}

/**
 * POST /api/v1/auth/change-password
 * ---------------------------------
 * Cambiar contraseña del usuario autenticado.
 * 
 * @access Authenticated
 * @headers Authorization: Bearer {token}
 * @body ChangePasswordRequestDTO
 */
export interface ChangePasswordEndpoint {
  method: 'POST';
  path: '/api/v1/auth/change-password';
  request: ChangePasswordRequestDTO;
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/auth/forgot-password
 * ---------------------------------
 * Solicitar email de recuperación de contraseña.
 * 
 * @access Public
 * @body ForgotPasswordRequestDTO
 */
export interface ForgotPasswordEndpoint {
  method: 'POST';
  path: '/api/v1/auth/forgot-password';
  request: ForgotPasswordRequestDTO;
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/auth/reset-password
 * --------------------------------
 * Resetear contraseña con token de recuperación.
 * 
 * @access Public
 * @body ResetPasswordRequestDTO
 */
export interface ResetPasswordEndpoint {
  method: 'POST';
  path: '/api/v1/auth/reset-password';
  request: ResetPasswordRequestDTO;
  response: ApiResponse<{ message: string }>;
}

/**
 * GET /api/v1/auth/me
 * -------------------
 * Obtener información del usuario autenticado.
 * 
 * @access Authenticated
 * @headers Authorization: Bearer {token}
 * @returns UsuarioAuthDTO
 */
export interface GetCurrentUserEndpoint {
  method: 'GET';
  path: '/api/v1/auth/me';
  response: ApiResponse<UsuarioAuthDTO>;
}

/**
 * POST /api/v1/auth/verify-email
 * ------------------------------
 * Verificar email con token enviado por correo.
 * 
 * @access Public
 * @body { token: string }
 */
export interface VerifyEmailEndpoint {
  method: 'POST';
  path: '/api/v1/auth/verify-email';
  request: { token: string };
  response: ApiResponse<{ message: string }>;
}

/**
 * POST /api/v1/auth/resend-verification
 * -------------------------------------
 * Reenviar email de verificación.
 * 
 * @access Authenticated
 * @headers Authorization: Bearer {token}
 */
export interface ResendVerificationEndpoint {
  method: 'POST';
  path: '/api/v1/auth/resend-verification';
  response: ApiResponse<{ message: string }>;
}

// ============================================
// SUPLANTACIÓN (ADMIN FEATURE)
// ============================================

/**
 * POST /api/v1/auth/impersonate/:id_usuario
 * -----------------------------------------
 * Suplantar a otro usuario (solo superadmin/admin).
 * 
 * @access SuperAdmin, Admin
 * @param id_usuario ID del usuario a suplantar
 * @returns Tokens del usuario suplantado
 */
export interface ImpersonateUserEndpoint {
  method: 'POST';
  path: '/api/v1/auth/impersonate/:id_usuario';
  params: { id_usuario: number };
  response: ApiResponse<LoginResponseDTO>;
}

/**
 * POST /api/v1/auth/stop-impersonation
 * ------------------------------------
 * Dejar de suplantar y volver a cuenta original.
 * 
 * @access Authenticated (usuario suplantado)
 * @returns Tokens del usuario original
 */
export interface StopImpersonationEndpoint {
  method: 'POST';
  path: '/api/v1/auth/stop-impersonation';
  response: ApiResponse<LoginResponseDTO>;
}

// ============================================
// PUSH NOTIFICATIONS TOKEN
// ============================================

/**
 * POST /api/v1/auth/device-token
 * ------------------------------
 * Registrar token de dispositivo para push notifications.
 * 
 * @access Authenticated
 * @body { device_token: string, platform: 'ios' | 'android' }
 */
export interface RegisterDeviceTokenEndpoint {
  method: 'POST';
  path: '/api/v1/auth/device-token';
  request: {
    device_token: string;
    platform: 'ios' | 'android';
  };
  response: ApiResponse<{ message: string }>;
}

/**
 * DELETE /api/v1/auth/device-token
 * --------------------------------
 * Eliminar token de dispositivo.
 * 
 * @access Authenticated
 */
export interface DeleteDeviceTokenEndpoint {
  method: 'DELETE';
  path: '/api/v1/auth/device-token';
  response: ApiResponse<{ message: string }>;
}
