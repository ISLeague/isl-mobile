import { Usuario } from './index';

// 🔐 Requests de Autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  id_pais: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// 🔐 Responses de Autenticación
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface ProfileUpdateRequest {
  nombre?: string;
  id_pais?: number;
  password?: string;
  current_password?: string; // Para cambiar password
}

export interface CreateTournamentAdminRequest {
  email: string;
  password: string;
  nombre: string;
  id_pais: number;
  id_torneo: number;
  id_edicion: number;
}

// 🔐 Estado de Autenticación (para tu store)
export interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}