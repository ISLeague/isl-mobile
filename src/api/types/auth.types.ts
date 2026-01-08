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

export interface RegisterResponse {
  success: boolean;
  data: {
    usuario: {
      id: string;
      email: string;
      created_at: string;
    };
    session: any | null;
    mensaje: string;
  };
  timestamp: string;
}

export interface AuthResponse {
  token: string | null;
  usuario: any;
  mensaje?: string;
}
