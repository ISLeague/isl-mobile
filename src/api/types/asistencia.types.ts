// Types for asistencia-partido endpoint

export interface JugadorAsistencia {
  id_plantilla: number;
  nombre_completo: string;
  numero_camiseta: number | null;
  es_capitan: boolean;
  es_refuerzo: boolean;
  dni: string | null;
  fecha_nacimiento: string | null;
  id_equipo: number;
  presente: boolean | null;
  valido_para_jugar: boolean;
  asistencia: {
    id_asistencia: number;
    hora_registro: string;
  } | null;
}

export interface EquipoAsistencia {
  id_equipo: number;
  nombre: string;
  jugadores: JugadorAsistencia[];
  presentes: number;
  total: number;
}

export interface AsistenciaListResponse {
  partido: {
    id_partido: number;
    estado_partido: string;
    equipo_local: { id_equipo: number; nombre: string; nombre_corto: string };
    equipo_visitante: { id_equipo: number; nombre: string; nombre_corto: string };
  };
  restricciones: {
    tiene_restriccion_edad: boolean;
    edad_minima: number | null;
    edad_maxima: number | null;
    max_refuerzos: number | null;
  };
  tiene_asistencia_registrada: boolean;
  equipo_local: EquipoAsistencia;
  equipo_visitante: EquipoAsistencia;
}

export interface AsistenciaRegistro {
  id_plantilla: number;
  id_equipo: number;
  presente: boolean;
  valido_para_jugar?: boolean;
}

export interface RegistrarAsistenciaRequest {
  id_partido: number;
  asistencias: AsistenciaRegistro[];
}

export interface RegistrarAsistenciaResponse {
  message: string;
  id_partido: number;
  presentes: number;
  total: number;
  registros_actualizados: number;
}

export interface JugadorPresente {
  id_plantilla: number;
  id_equipo: number;
  nombre_completo: string;
  numero_camiseta: number;
  es_capitan: boolean;
}

export interface PresentesResponse {
  id_partido: number;
  total_presentes: number;
  presentes_por_equipo: Record<number, JugadorPresente[]>;
}
