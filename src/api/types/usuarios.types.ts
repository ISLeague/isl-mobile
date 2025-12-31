// ============================================
// 👥 USUARIOS TYPES
// ============================================

export interface Usuario {
  id_usuario: number;
  email: string;
  rol: 'invitado' | 'superadmin' | 'admin' | 'fan';
  id_pais: number;
  id_torneos?: number[];
  id_admin_suplantando?: number;
  nombre_completo?: string;
  activo?: boolean;
  created_at?: string;
}

export interface CreateUsuarioRequest {
  email: string;
  password: string;
  nombre_completo: string;
  rol: 'admin' | 'fan';
  id_pais: number;
  id_torneos?: number[];
  id_ediciones?: number[];
}

export interface UpdateUsuarioRequest {
  id: number;
  nombre?: string;
}

export interface AsignarAdminTorneoRequest {
  id_usuario: number;
  id_torneos: number[];
  id_ediciones?: number[];
}

export interface UsuarioListItem {
  id_usuario: number;
  email: string;
  nombre_completo: string;
  rol: string;
  nombre_pais: string;
  activo: boolean;
  created_at: string;
}
