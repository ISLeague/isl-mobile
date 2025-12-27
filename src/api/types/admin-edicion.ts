import {
  CredencialesTemporales,
  UsuarioInfo,
  AdminTorneoUsuario
} from "./admin-torneos";

// Request types
export interface AdminEdicionRegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
}

export interface AdminEdicionAsignarRequest {
  id_usuario: number;
  id_edicion: number;
}

export interface AdminEdicionDeleteRequest {
    id_admin_edicion: number;
}

export interface AdminEdicionListParams {
  id_edicion?: number;
  id_usuario?: number;
}

// Response types
export interface AdminEdicionRegisterResponse {
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

export interface EdicionInfo {
  id_edicion: number;
  nombre: string;
  numero: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface EstadisticasEdicion {
  ediciones_activos: number;
  ediciones_inactivos: number;
  total_ediciones: number;
}

export interface AdminEdicionAsignacion {
  id: number;
  usuario: UsuarioInfo;
  edicion: EdicionInfo;
  asignado_el: string;
  estadisticas?: EstadisticasEdicion;
}

export interface AdminEdicionListResponse {
  success: boolean;
  data: {
    data: AdminEdicionAsignacion[];
    total: number;
    filters?: {
      id_Edicion?: number;
      id_usuario?: number;
    };
  };
  timestamp: string;
}

export interface AdminEdicionAsignarResponse {
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
      edicion: {
        id_edicion: number;
        nombre: string;
        torneo: {
          id_torneo: number;
          nombre: string;
          temporada: string;
        };
      };
      asignado_el: string;
    };
    mensaje: string;
    email_enviado: boolean;
  };
  timestamp: string;
}

export interface AdminEdicionDeleteResponse {
  success: boolean;
  data: {
    mensaje: string;
  };
  timestamp: string;
}

export interface AdminEdicionDisponible extends UsuarioInfo {
  estadisticas: EstadisticasEdicion;
}

export interface AdminEdicionDisponiblesResponse {
  success: boolean;
  data: {
    data: AdminEdicionDisponible[];
    total: number;
    id_edicion: number;
  };
  timestamp: string;
}
