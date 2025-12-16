// ============================================
// ⚽ PARTIDOS TYPES
// ============================================

export interface CreatePartidoRequest {
  equipo_local_id: number;
  equipo_visitante_id: number;
  fecha: string;
  local_id: number;
}

export interface UpdatePartidoRequest {
  id: number;
  fecha?: string;
}

export interface PartidoResultadoRequest {
  partido_id: number;
  goles_local: number;
  goles_visitante: number;
}
