
export interface Pais {
  id_pais: number;
  nombre: string;
  codigo_iso: string;
  emoji: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaisRequest {
  nombre: string;
  codigo_iso: string;
  emoji: string;
  activo?: boolean;
}

export type UpdatePaisRequest = Partial<CreatePaisRequest>;
