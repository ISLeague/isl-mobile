// 🏷️ Usuarios y Países
export interface Usuario {
  id_usuario: number;
  email: string;
  rol: 'superadmin' | 'admin' | 'jugador' | 'fan' | 'invitado';
  id_pais: number;
  id_torneos?: number[]; // Array de torneos asignados para admins de torneo
  id_ediciones?: number[]; // Array de ediciones correspondientes a los torneos
  id_admin_suplantando?: number;
  pais?: Pais;
  torneos?: Torneo[]; // Array de torneos populados
  ediciones?: Edicion[]; // Array de ediciones populadas
  acepto_terminos?: boolean; // Aceptación de términos y condiciones
  acepto_privacidad?: boolean; // Aceptación de política de privacidad
  fecha_aceptacion_terminos?: string; // Fecha de aceptación (ISO 8601)
  debe_cambiar_password?: boolean; // Indica si debe cambiar la contraseña en el primer login
}

export interface Pais {
  id_pais: number;
  nombre: string;
  emoji?: string;
}

// 🏟️ Local y Cancha
export interface Local {
  id_local: number;
  nombre: string;
  latitud: number;
  longitud: number;
}

export interface Cancha {
  id_cancha: number;
  nombre: string;
  id_local: number;
  local?: Local;
}

// 💼 Sponsor
export interface Sponsor {
  id_sponsor: number;
  nombre: string;
  logo: string;
  link: string;
  id_edicion_categoria?: number;
}

// 🏆 Torneos, Ediciones y Categorías
export interface Torneo {
  id_torneo: number;
  nombre: string;
  id_pais: number;
  pais?: Pais;
}

export interface Edicion {
  id_edicion: number;
  numero: number;
  estado: 'abierto' | 'cerrado' | 'en juego';
  id_torneo: number;
  torneo?: Torneo;
}

export interface Categoria {
  id_categoria: number;
  nombre: string; // SUB16, SUB18, Libre, etc.
  tiene_restriccion_edad?: boolean;
  edad_maxima?: number;
  permite_refuerzos?: boolean;
  max_refuerzos?: number;
}

export interface EdicionCategoria {
  id_edicion_categoria: number;
  id_edicion: number;
  id_categoria: number;
  edicion?: Edicion;
  categoria?: Categoria;
}

// ⚽ Equipos y Jugadores
export interface Equipo {
  id_equipo: number;
  nombre: string;
  logo?: string;
  id_edicion_categoria: number;
  edicion_categoria?: EdicionCategoria;
}

export interface Jugador {
  id_jugador: number;
  nombre_completo: string;
  dni: string;
  numero_camiseta?: number;
  fecha_nacimiento: string;
  estado: 'activo' | 'inactivo';
  foto?: string;
  // Estadísticas agregadas
  estadisticas?: {
    goles: number;
    asistencias: number;
    amarillas: number;
    rojas: number;
    partidos_jugados: number;
  };
}

export interface PlantillaEquipo {
  id_plantilla: number;
  id_equipo: number;
  id_jugador: number;
  activo_en_equipo: boolean;
  es_refuerzo: boolean; // Indica si el jugador es refuerzo
  fecha_registro: string;
  fecha_baja?: string;
  jugador?: Jugador;
  equipo?: Equipo;
}

// 📊 Fases, Grupos y Clasificación
export interface Fase {
  id_fase: number;
  nombre: string; // Jornada 1, Octavos, Semifinal, etc.
  tipo: 'grupo' | 'knockout';
  copa?: 'general' | 'oro' | 'plata' | 'bronce';
  id_edicion_categoria: number;
}

export interface Grupo {
  id_grupo: number;
  nombre: string; // Grupo A, Grupo B, etc.
  id_fase: number;
  tipo_clasificacion?: 'pasa_copa_general' | 'pasa_copa_oro' | 'pasa_copa_plata' | 'pasa_copa_bronce' | 'eliminado';
  cantidad_equipos?: number;
  equipos_pasan_oro?: number; // Cantidad de equipos que clasifican a Copa de Oro
  equipos_pasan_plata?: number; // Cantidad de equipos que clasifican a Copa de Plata
  fase?: Fase;
}

export interface Clasificacion {
  id_clasificacion: number;
  id_equipo: number;
  id_grupo: number;
  pj: number; // Partidos jugados
  gf: number; // Goles a favor
  gc: number; // Goles en contra
  dif: number; // Diferencia de goles
  puntos: number;
  posicion: number;
  equipo?: Equipo;
}

// 🚀 Avance entre Fases
export interface ReglaAvance {
  id_regla: number;
  id_fase_origen: number;
  id_fase_destino: number;
  pos_inicial: number;
  pos_final: number;
  cupos: number;
}

export interface AvanceFase {
  id_avance: number;
  id_equipo: number;
  id_fase_origen: number;
  id_fase_destino: number;
  ascenso: boolean;
}

// 🏟️ Partidos y Eventos
export interface Ronda {
  id_ronda: number;
  nombre: string; // "Ronda 1", "Ronda 2", etc.
  fecha_inicio: string;
  fecha_fin?: string;
  id_fase: number;
  es_amistosa: boolean; // Si es ronda amistosa o no
  tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa'; // Tipo de ronda
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce'; // Subcategoría para eliminatorias
  aplicar_fecha_automatica?: boolean; // Si los partidos heredan la fecha de la ronda
  orden: number; // Para ordenar las rondas
  partidos?: Partido[];
}

export interface Partido {
  id_partido: number;
  fecha: string;
  hora?: string;
  estado_partido: 'Pendiente' | 'En curso' | 'Finalizado' | 'Suspendido';
  marcador_local?: number;
  marcador_visitante?: number;
  penales_local?: number; // Resultado de penales equipo local
  penales_visitante?: number; // Resultado de penales equipo visitante
  wo?: boolean; // Walk Over
  id_equipo_local: number;
  id_equipo_visitante: number;
  id_ronda?: number; // Relacionado con la ronda
  id_fase: number;
  id_cancha?: number;
  equipo_local?: Equipo;
  equipo_visitante?: Equipo;
  ronda?: Ronda;
  fase?: Fase;
  cancha?: Cancha;
  eventos?: EventoPartido[];
}

export interface EventoPartido {
  id_evento: number;
  minuto: number;
  tipo_evento: 'gol' | 'asistencia' | 'amarilla' | 'roja' | 'cambio';
  id_partido: number;
  id_jugador: number;
  jugador?: Jugador;
}

// 🏅 Historial y Estadísticas
export interface HistorialEquipoEdicion {
  id_historial: number;
  id_equipo: number;
  id_edicion: number;
  fase_final: string; // campeón, semifinal, etc.
  posicion_final: number;
}

export interface HistorialJugadorEdicion {
  id_historial_jugador: number;
  id_jugador: number;
  id_edicion: number;
  goles_totales: number;
  asistencias_totales: number;
  amarillas_totales: number;
  rojas_totales: number;
  posicion_final?: number;
}

// 📢 Notificaciones y Publicidad
export interface Notificacion {
  id_notificacion: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  url?: string;
  id_usuario?: number;
}

export interface Banner {
  id_banner: number;
  imagen: string;
  link?: string;
  activo: boolean;
}

// 📷 Fotos y Seguimiento
export interface Fotos {
  id_fotos: number;
  link_fotos_totales: string;
  link_preview: string;
  id_equipo: number;
}

export interface SeguimientoEquipo {
  id_seguimiento: number;
  id_usuario: number;
  id_equipo: number;
  pago_fotos: boolean;
}

// 📊 Estadísticas (Para "The Best")
export interface TopScorer {
  id_jugador: number;
  nombre: string;
  equipo: string;
  goles: number;
  foto?: string;
}

export interface TopAssist {
  id_jugador: number;
  nombre: string;
  equipo: string;
  asistencias: number;
  foto?: string;
}

export interface LeastConceded {
  id_equipo: number;
  nombre: string;
  goles_en_contra: number;
  logo?: string;
}

// 🔐 Knockout Bracket
export interface KnockoutMatch {
  id_partido: number;
  ronda: string; // Octavos, Cuartos, Semifinal, Final
  equipo_local?: Equipo;
  equipo_visitante?: Equipo;
  marcador_local?: number;
  marcador_visitante?: number;
  ganador?: number; // id_equipo ganador
}

// 📅 Próximo Partido (para PlayerDetailScreen y MyTeamScreen)
export interface ProximoPartido {
  id_partido: number;
  fecha: string;
  hora: string;
  rival: {
    nombre: string;
    logo?: string;
  };
  cancha: {
    nombre: string;
    direccion?: string;
  };
  local: boolean; // true si es local, false si es visitante
}