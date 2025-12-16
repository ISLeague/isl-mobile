// ============================================
// 📍 LOCALES TYPES
// ============================================

export interface CreateLocalRequest {
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}

export interface UpdateLocalRequest {
  id: number;
  nombre?: string;
}
