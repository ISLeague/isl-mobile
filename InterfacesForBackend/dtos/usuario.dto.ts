/**
 * Usuario DTOs
 * ============
 * Data Transfer Objects para gestión de usuarios.
 */

// ============ REQUEST DTOs ============

export interface CreateUsuarioRequestDTO {
  email: string;
  password: string;
  nombre_completo: string;
  rol: 'admin' | 'fan';
  id_pais: number;
  id_torneos?: number[]; // Para admin
  id_ediciones?: number[]; // Para admin
  avatar?: string;
}

export interface UpdateUsuarioRequestDTO {
  nombre_completo?: string;
  avatar?: string;
  id_pais?: number;
  activo?: boolean;
}

export interface UpdateUsuarioRolRequestDTO {
  rol: 'admin' | 'fan';
  id_torneos?: number[];
  id_ediciones?: number[];
}

export interface AsignarAdminTorneoRequestDTO {
  id_usuario: number;
  id_torneos: number[];
  id_ediciones?: number[];
}

// ============ RESPONSE DTOs ============

export interface UsuarioResponseDTO {
  id_usuario: number;
  email: string;
  nombre_completo: string;
  rol: 'superadmin' | 'admin' | 'fan' | 'invitado';
  id_pais: number;
  nombre_pais: string;
  avatar: string | null;
  activo: boolean;
  debe_cambiar_password: boolean;
  id_torneos: number[];
  id_ediciones: number[];
  created_at: Date;
}

export interface UsuarioListItemDTO {
  id_usuario: number;
  email: string;
  nombre_completo: string;
  rol: string;
  nombre_pais: string;
  activo: boolean;
  created_at: Date;
}

export interface UsuarioPerfilDTO {
  id_usuario: number;
  email: string;
  nombre_completo: string;
  avatar: string | null;
  rol: 'superadmin' | 'admin' | 'fan' | 'invitado';
  pais: {
    id_pais: number;
    nombre: string;
    emoji: string;
  };
  // Si es fan
  equipo_seguido?: {
    id_equipo: number;
    nombre: string;
    logo: string | null;
  };
  created_at: Date;
}
