import {
  CredencialesTemporales,
  UsuarioInfo,
  AdminTorneoUsuario
} from "./admin-torneos";

// Request types
export interface AdminCategoriaRegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
}

export interface AdminCategoriaAsignarRequest {
  id_usuario: number;
  id_categoria: number;
}

export interface AdminCategoriaDeleteRequest {
    id_admin_categoria: number;
}

export interface AdminCategoriaListParams {
  id_categoria?: number;
  id_usuario?: number;
}

// Response types
export interface AdminCategoriaRegisterResponse {
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

export interface CategoriaInfo {
  id_categoria: number;
  nombre: string;
  temporada: string;
  activo: boolean;
}

export interface EstadisticasCategoria {
  categorias_activos: number;
  categorias_inactivos: number;
  total_categorias: number;
}

export interface AdminCategoriaAsignacion {
  id: number;
  usuario: UsuarioInfo;
  categoria: CategoriaInfo;
  asignado_el: string;
  estadisticas?: EstadisticasCategoria;
}

export interface AdminCategoriaListResponse {
  success: boolean;
  data: {
    data: AdminCategoriaAsignacion[];
    total: number;
    filters?: {
      id_categoria?: number;
      id_usuario?: number;
    };
  };
  timestamp: string;
}

export interface AdminCategoriaAsignarResponse {
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
      categoria: {
        id_Categoria: number;
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

export interface AdminCategoriaDeleteResponse {
  success: boolean;
  data: {
    mensaje: string;
  };
  timestamp: string;
}
