// ============================================
// 👥 USUARIOS TYPES
// ============================================

export interface CreateUsuarioRequest {
  email: string;
  nombre: string;
}

export interface UpdateUsuarioRequest {
  id: number;
  nombre?: string;
}
