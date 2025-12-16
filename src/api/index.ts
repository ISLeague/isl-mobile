// ============================================
// 📦 EXPORTACIONES PRINCIPALES
// ============================================

// Client & Helpers
export * from './client/axiosClient';
export * from './client/authHelpers';

// Types (modularizados - exporta desde index)
export * from './types';

// Services
export { authService } from './services/auth.service';
export { categoriasService } from './services/categorias.service';
export { edicionesService } from './services/ediciones.service';
export { equiposService } from './services/equipos.service';
export { estadisticasService } from './services/estadisticas.service';
export { fasesService } from './services/fases.service';
export { gruposService } from './services/grupos.service';
export { jugadoresService } from './services/jugadores.service';
export { localesService } from './services/locales.service';
export { notificacionesService } from './services/notificaciones.service';
export { paisesService } from './services/paises.service';
export { partidosService } from './services/partidos.service';
export { rondasService } from './services/rondas.service';
export { torneosService } from './services/torneos.service';
export { usuariosService } from './services/usuarios.service';
export { healthService } from './services/health.service';

// ============================================
// 🔧 API CONSOLIDADA (Para compatibilidad)
// ============================================

import { authService } from './services/auth.service';
import { categoriasService } from './services/categorias.service';
import { edicionesService } from './services/ediciones.service';
import { equiposService } from './services/equipos.service';
import { estadisticasService } from './services/estadisticas.service';
import { fasesService } from './services/fases.service';
import { gruposService } from './services/grupos.service';
import { jugadoresService } from './services/jugadores.service';
import { localesService } from './services/locales.service';
import { notificacionesService } from './services/notificaciones.service';
import { paisesService } from './services/paises.service';
import { partidosService } from './services/partidos.service';
import { rondasService } from './services/rondas.service';
import { torneosService } from './services/torneos.service';
import { usuariosService } from './services/usuarios.service';
import { healthService } from './services/health.service';

/**
 * API consolidada - Exportación default para compatibilidad
 *
 * Puedes usarla de dos formas:
 *
 * 1. Import consolidado:
 *    import api from './api';
 *    api.auth.login(...)
 *
 * 2. Import específico:
 *    import { authService } from './api';
 *    authService.login(...)
 */
export const api = {
  auth: authService,
  categorias: categoriasService,
  ediciones: edicionesService,
  equipos: equiposService,
  estadisticas: estadisticasService,
  fases: fasesService,
  grupos: gruposService,
  jugadores: jugadoresService,
  locales: localesService,
  notificaciones: notificacionesService,
  paises: paisesService,
  partidos: partidosService,
  rondas: rondasService,
  torneos: torneosService,
  usuarios: usuariosService,
  health: healthService,
};

export default api;

// También exportar mockApi para testing
export { mockApi } from './mockApi';
