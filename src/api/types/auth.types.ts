// ============================================
// 🔐 AUTH TYPES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
  device_token?: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: string;
  acepto_terminos: boolean;
  acepto_privacidad: boolean;
}

export interface AuthResponse {
  token: string;
  usuario: any;
}
