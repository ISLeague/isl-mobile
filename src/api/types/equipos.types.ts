// ============================================
// ⚽ EQUIPOS TYPES
// ============================================
/*  "nombre": "Athletic Club",
                "nombre_corto": "Athletic",
                "logo": "https://logoeps.com/wp-content/uploads/2013/03/athletic-bilbao-vector-logo.png",
                "color_primario": "#EE2523",
                "color_secundario": "#FFFFFF",
                "id_edicion_categoria": 1,
                "nombre_delegado": "Pedro Sanchez",
                "telefono_delegado": "+34944556677",
                "email_delegado": "pedro.sanchez@athletic-club.eus",
                "activo": true,
                "created_at": "2025-12-23T03:11:26.054158",
                "updated_at": "2025-12-23T03:11:26.054158" */
export interface Equipo {
  id_equipo: number;
  nombre: string;
  nombre_corto?: string;
  logo?: string;
  color_primario?: string;
  color_secundario?: string;
  id_edicion_categoria: number;
  nombre_delegado?: string;
  telefono_delegado?: string;
  email_delegado?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEquipoRequest {
  nombre: string;
  nombre_corto?: string;
  logo?: string;
  id_edicion_categoria: number;
  color_primario?: string;
  color_secundario?: string;
  nombre_delegado?: string;
  telefono_delegado?: string;
  email_delegado?: string;
}

// Tipos de respuesta de la API
export interface EquiposListResponse {
  success: boolean;
  data: Equipo[];
  timestamp: string;
}

export interface CreateEquipoResponse {
  success: boolean;
  data: Equipo;
  timestamp: string;
}

export interface BulkCreateResponse {
  success: boolean;
  data: {
    total_processed: number;
    successful: number;
    failed: number;
    errors: string[];
    created_equipos: Equipo[];
  };
  timestamp: string;
}

export interface EstadisticasDetalleEquipo {
  partidos_jugados: number;
  partidos_ganados: number;
  partidos_empatados: number;
  partidos_perdidos: number;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  puntos: number;
  posicion: number;
  tarjetas_amarillas: number;
  tarjetas_rojas: number;
}

export interface ImagenEquipo {
  id_imagen: number;
  id_equipo: number;
  url: string;
  url_thumbnail?: string;
  descripcion?: string;
  fecha_subida: string;
  created_at?: string;
}

export interface ImagenesEquipoResponse {
  success: boolean;
  data: ImagenEquipo[];
  timestamp: string;
}
