// Request types
export interface AdminTorneoRegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
}

export interface AdminTorneoAsignarRequest {
  id_usuario: number;
  id_torneo: number;
}

export interface AdminTorneoDeleteRequest {
  id_admin_torneo: number;
}

export interface AdminTorneoListParams {
  id_torneo?: number;
  id_usuario?: number;
}

// Response types
export interface AdminTorneoUsuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

export interface CredencialesTemporales {
  email: string;
  password: string;
  nota: string;
}

export interface AdminTorneoRegisterResponse {
  success: boolean;
  data: {
    usuario: AdminTorneoUsuario;
    mensaje: string;
    email_enviado: boolean;
    email_nota: string;
    credenciales_temporales: CredencialesTemporales;
  };
  timestamp: string;
}

export interface UsuarioInfo {
  id_usuario: number;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  activo: boolean;
  created_at: string;
  auth_user_id: string;
}

export interface TorneoInfo {
  id_torneo: number;
  nombre: string;
  temporada: string;
  activo: boolean;
}

export interface EstadisticasTorneo {
  torneos_activos: number;
  torneos_inactivos: number;
  total_torneos: number;
}

export interface AdminTorneoAsignacion {
  id: number;
  usuario: UsuarioInfo;
  torneo: TorneoInfo;
  asignado_el: string;
  estadisticas?: EstadisticasTorneo;
}

export interface AdminTorneoListResponse {
  success: boolean;
  data: {
    data: AdminTorneoAsignacion[];
    total: number;
    filters?: {
      id_torneo?: number;
      id_usuario?: number;
    };
  };
  timestamp: string;
}

export interface AdminTorneoAsignarResponse {
  success: boolean;
  data: {
    asignacion: {
      id: number;
      usuario: {
        id_usuario: number;
        nombre: string;
        apellido: string;
        nombre_completo: string;
      };
      torneo: {
        id_torneo: number;
        nombre: string;
        temporada: string;
      };
      asignado_el: string;
    };
    mensaje: string;
    email_enviado: boolean;
  };
  timestamp: string;
}

export interface AdminTorneoDeleteResponse {
  success: boolean;
  data: {
    mensaje: string;
  };
  timestamp: string;
}

export interface AdminTorneoDisponible extends UsuarioInfo {
  estadisticas: EstadisticasTorneo;
}

export interface AdminTorneoDisponiblesResponse {
  success: boolean;
  data: {
    data: AdminTorneoDisponible[];
    total: number;
    id_torneo: number;
  };
  timestamp: string;
}
