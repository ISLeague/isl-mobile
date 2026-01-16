// ============================================
// 🔄 RONDAS TYPES
// ============================================

export interface Ronda {
  id_ronda: number;
  nombre: string;
  tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce';
  fecha_inicio: string;
  fecha_fin?: string;
  orden: number;
  id_fase?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRondaRequest {
  nombre: string;
  id_fase: number;
  tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce';
  es_amistosa?: boolean;
  fecha_inicio?: string;
  count_enfrentamientos?: number;
  fecha_fin?: string;
  orden: number;
  cantidad_enfrentamientos?: number;
}

export interface FixtureGenerateRequest {
  id_ronda: number;
  tipo_generacion: 'round_robin' | 'amistoso_aleatorio' | 'amistoso_intergrupos';
  ida_vuelta?: boolean;
  cantidad_partidos?: number; // Solo para amistosos
  jornada?: number;
}

export interface EnfrentamientoFixture {
  fixture_id: number;
  id_equipo_local: number;
  id_equipo_visitante: number;
  local: string;
  visitante: string;
  tipo_encuentro: 'unico' | 'ida' | 'vuelta';
  id_grupo?: number;
  nombre_grupo?: string;
}

export interface JornadaFixture {
  jornada: number;
  partidos: number;
  enfrentamientos: EnfrentamientoFixture[];
}

export interface FixtureGenerateResponse {
  success: boolean;
  data: {
    tipo: 'clasificacion' | 'eliminatoria' | 'amistosa';
    fixtures_generados: number;
    ida_vuelta: boolean;
    ronda: {
      id_ronda: number;
      nombre: string;
      tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa';
    };
    equipos_participantes: number;
    jornadas: JornadaFixture[];
  };
  timestamp: string;
}

export interface UpdateRondaRequest {
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  orden?: number;
  activo?: boolean;
  id_fase?: number;
  tipo?: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce';
  numero?: number;
}

// Response types
export interface RondaConPartidos extends Ronda {
  partidos_count: number;
  partidos_jugados: number;
}

export interface RondasListResponse {
  success: boolean;
  data: RondaConPartidos[];
  timestamp: string;
}

// ============================================
// 🎯 FIXTURES SIN PARTIDO
// ============================================

export interface FixtureSinPartido {
  id_fixture: number;
  id_equipo_local: number;
  id_equipo_visitante: number;
  local: string;
  visitante: string;
  tipo_encuentro: 'unico' | 'ida' | 'vuelta';
  orden_dentro_jornada: number;
  id_grupo?: number;
  nombre_grupo?: string;
  id_ronda: number;
  nombre_ronda: string;
  tipo_ronda: 'fase_grupos' | 'eliminatorias' | 'amistosa';
}

export interface JornadaConFixturesSinPartido {
  jornada: number;
  fixtures: FixtureSinPartido[];
}

export interface FixturesSinPartidoResponse {
  success: boolean;
  data: {
    total_fixtures_sin_partido: number;
    jornadas: JornadaConFixturesSinPartido[];
  };
  timestamp: string;
}

// ============================================
// 🆕 CREAR FIXTURE MANUALMENTE
// ============================================

export interface CreateFixtureRequest {
  id_ronda: number;
  id_grupo: number;
  id_equipo_local: number;
  id_equipo_visitante: number;
  jornada: number;
  tipo_encuentro: 'unico' | 'ida' | 'vuelta';
  orden_dentro_jornada: number;
  es_ida_vuelta: boolean;
}

export interface CreateFixtureResponse {
  success: boolean;
  data: {
    id_fixture: number;
    id_ronda: number;
    id_grupo: number;
    id_equipo_local: number;
    id_equipo_visitante: number;
    jornada: number;
    tipo_encuentro: 'unico' | 'ida' | 'vuelta';
    orden_dentro_jornada: number;
  };
  timestamp: string;
}
