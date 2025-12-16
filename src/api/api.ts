import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://htjksrcbpozlgjqpqguw.supabase.co/functions/v1';
const TOKEN_KEY = '@isl_access_token';

// Cliente Axios configurado
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

// Helpers para guardar/obtener token
export const setAuthToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export interface LoginRequest {
  email: string;
  password: string;
  device_token?: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: string;
  acepto_terminos: boolean;
  acepto_privacidad: boolean;
}

export interface AuthResponse {
  token: string;
  usuario: any;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth-login', data);

    // Transformar la respuesta del backend al formato esperado
    const backendData = response.data.data || response.data;
    const token = backendData.session?.access_token || backendData.token;
    const usuario = backendData.usuario || backendData.user;

    if (token) {
      await setAuthToken(token);
    }

    return {
      token,
      usuario,
    };
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth-register', data);

    // Transformar la respuesta del backend al formato esperado
    const backendData = response.data.data || response.data;
    const token = backendData.session?.access_token || backendData.token;
    const usuario = backendData.usuario || backendData.user;

    if (token) {
      await setAuthToken(token);
    }

    return {
      token,
      usuario,
    };
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth-logout');
    await clearAuthToken();
  },
};

// ============================================
// 📁 CATEGORIAS
// ============================================

export const categoriasApi = {
  list: async () => {
    const response = await apiClient.get('/categorias-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/categorias-get', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: { nombre: string }) => {
    const response = await apiClient.post('/categorias-create', data);
    return response.data;
  },

  update: async (data: { id: number; nombre: string }) => {
    const response = await apiClient.put('/categorias-update', data);
    return response.data;
  },
};

// ============================================
// 📅 EDICIONES
// ============================================

export const edicionesApi = {
  list: async () => {
    const response = await apiClient.get('/ediciones-list');
    return response.data;
  },

  create: async (data: { nombre: string; torneo_id: number }) => {
    const response = await apiClient.post('/ediciones-create', data);
    return response.data;
  },
};

// ============================================
// ⚽ EQUIPOS
// ============================================

export const equiposApi = {
  list: async () => {
    const response = await apiClient.get('/equipos-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/equipos-get', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: { nombre: string }) => {
    const response = await apiClient.post('/equipos-create', data);
    return response.data;
  },
};

// ============================================
// 📊 ESTADISTICAS
// ============================================

export const estadisticasApi = {
  goleadores: async () => {
    const response = await apiClient.get('/estadisticas-goleadores');
    return response.data;
  },

  goleadoresPorEdicion: async (edicion_id: number) => {
    const response = await apiClient.get('/estadisticas-goleadores-edicion', {
      params: { edicion_id },
    });
    return response.data;
  },

  asistencias: async () => {
    const response = await apiClient.get('/estadisticas-asistencias');
    return response.data;
  },
};

// ============================================
// 🎯 FASES
// ============================================

export const fasesApi = {
  list: async () => {
    const response = await apiClient.get('/fases-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/fases-get', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: { nombre: string; edicion_id: number }) => {
    const response = await apiClient.post('/fases-create', data);
    return response.data;
  },
};

// ============================================
// 🏆 GRUPOS
// ============================================

export const gruposApi = {
  clasificacion: async (grupo_id: number) => {
    const response = await apiClient.get('/grupos-clasificacion', {
      params: { grupo_id },
    });
    return response.data;
  },
};

// ============================================
// 👤 JUGADORES
// ============================================

export const jugadoresApi = {
  list: async () => {
    const response = await apiClient.get('/jugadores-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/jugadores-get', {
      params: { id },
    });
    return response.data;
  },

  getByDNI: async (dni: string) => {
    const response = await apiClient.get('/jugadores-dni', {
      params: { dni },
    });
    return response.data;
  },

  detalle: async (id: number) => {
    const response = await apiClient.get('/jugadores-detalle', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: { nombre: string; dni: string; equipo_id: number }) => {
    const response = await apiClient.post('/jugadores-create', data);
    return response.data;
  },
};

// ============================================
// 📍 LOCALES
// ============================================

export const localesApi = {
  list: async () => {
    const response = await apiClient.get('/locales-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/locales-get', {
      params: { id },
    });
    return response.data;
  },

  mapa: async () => {
    const response = await apiClient.get('/locales-mapa');
    return response.data;
  },

  cercanos: async (lat: number, lng: number, radio: number) => {
    const response = await apiClient.get('/locales-cercanos', {
      params: { lat, lng, radio },
    });
    return response.data;
  },

  create: async (data: {
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
  }) => {
    const response = await apiClient.post('/locales-create', data);
    return response.data;
  },

  update: async (data: { id: number; nombre?: string }) => {
    const response = await apiClient.put('/locales-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/locales-delete', {
      params: { id },
    });
    return response.data;
  },

  uploadFoto: async (formData: FormData) => {
    const response = await apiClient.post('/locales-foto-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteFoto: async (local_id: number, foto_url: string) => {
    const response = await apiClient.delete('/locales-foto-delete', {
      params: { local_id, foto_url },
    });
    return response.data;
  },
};

// ============================================
// 🔔 NOTIFICACIONES
// ============================================

export const notificacionesApi = {
  mis: async () => {
    const response = await apiClient.get('/notificaciones-mis');
    return response.data;
  },
};

// ============================================
// 🌍 PAISES
// ============================================

export const paisesApi = {
  list: async () => {
    const response = await apiClient.get('/paises-list');
    return response.data;
  },

  create: async (data: { nombre: string; codigo: string }) => {
    const response = await apiClient.post('/paises-create', data);
    return response.data;
  },
};

// ============================================
// ⚽ PARTIDOS
// ============================================

export const partidosApi = {
  list: async () => {
    const response = await apiClient.get('/partidos-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/partidos-get', {
      params: { id },
    });
    return response.data;
  },

  detalle: async (id: number) => {
    const response = await apiClient.get('/partidos-detalle', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: {
    equipo_local_id: number;
    equipo_visitante_id: number;
    fecha: string;
    local_id: number;
  }) => {
    const response = await apiClient.post('/partidos-create', data);
    return response.data;
  },

  update: async (data: { id: number; fecha?: string }) => {
    const response = await apiClient.put('/partidos-update', data);
    return response.data;
  },

  resultado: async (data: {
    partido_id: number;
    goles_local: number;
    goles_visitante: number;
  }) => {
    const response = await apiClient.post('/partidos-resultado', data);
    return response.data;
  },
};

// ============================================
// 🔄 RONDAS
// ============================================

export const rondasApi = {
  list: async () => {
    const response = await apiClient.get('/rondas-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/rondas-get', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: { numero: number; fase_id: number }) => {
    const response = await apiClient.post('/rondas-create', data);
    return response.data;
  },

  update: async (data: { id: number; numero?: number }) => {
    const response = await apiClient.put('/rondas-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/rondas-delete', {
      params: { id },
    });
    return response.data;
  },
};

// ============================================
// 🏆 TORNEOS
// ============================================

export const torneosApi = {
  list: async () => {
    const response = await apiClient.get('/torneos-list');
    return response.data;
  },

  create: async (data: { nombre: string; descripcion?: string }) => {
    const response = await apiClient.post('/torneos-create', data);
    return response.data;
  },
};

// ============================================
// 👥 USUARIOS
// ============================================

export const usuariosApi = {
  list: async () => {
    const response = await apiClient.get('/usuarios-list');
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get('/usuarios-get', {
      params: { id },
    });
    return response.data;
  },

  create: async (data: { email: string; nombre: string }) => {
    const response = await apiClient.post('/usuarios-create', data);
    return response.data;
  },

  update: async (data: { id: number; nombre?: string }) => {
    const response = await apiClient.put('/usuarios-update', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete('/usuarios-delete', {
      params: { id },
    });
    return response.data;
  },
};

// ============================================
// ❤️ HEALTH CHECK
// ============================================

export const healthApi = {
  check: async () => {
    const response = await axios.get(
      'https://htjksrcbpozlgjqpqguw.supabase.co/functions/v1/health-check'
    );
    return response.data;
  },
};

// ============================================
// 🔧 API CONSOLIDADA
// ============================================

export const api = {
  auth: authApi,
  categorias: categoriasApi,
  ediciones: edicionesApi,
  equipos: equiposApi,
  estadisticas: estadisticasApi,
  fases: fasesApi,
  grupos: gruposApi,
  jugadores: jugadoresApi,
  locales: localesApi,
  notificaciones: notificacionesApi,
  paises: paisesApi,
  partidos: partidosApi,
  rondas: rondasApi,
  torneos: torneosApi,
  usuarios: usuariosApi,
  health: healthApi,
};

export default api;
