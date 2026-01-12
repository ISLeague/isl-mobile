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
export { eliminatoriasService } from './services/eliminatorias.service';
export { gruposService } from './services/grupos.service';
export { jugadoresService } from './services/jugadores.service';
export { localesService, canchasService } from './services/locales.service';
export { notificacionesService } from './services/notificaciones.service';
export { paisesService } from './services/paises.service';
export { partidosService } from './services/partidos.service';
export { rondasService } from './services/rondas.service';
export { torneosService } from './services/torneos.service';
export { usuariosService } from './services/usuarios.service';
export { healthService } from './services/health.service';
export { adminTorneoService } from './services/admin-torneo.service';
export { adminCategoriaService } from './services/admin-categoria.service';
export { adminEdicionService } from './services/admin-edicion.service';
export { edicionCategoriasService } from './services/edicion-categorias.service';
export { reglasClasificacionService } from './services/reglas-clasificacion.service';
export { sponsorsService } from './services/sponsors.service';
export { minigamesService } from './services/minigames.service';

// ============================================
// 🔧 API CONSOLIDADA (Para compatibilidad)
// ============================================

import { authService } from './services/auth.service';
import { categoriasService } from './services/categorias.service';
import { edicionesService } from './services/ediciones.service';
import { equiposService } from './services/equipos.service';
import { estadisticasService } from './services/estadisticas.service';
import { fasesService } from './services/fases.service';
import { eliminatoriasService } from './services/eliminatorias.service';
import { gruposService } from './services/grupos.service';
import { jugadoresService } from './services/jugadores.service';
import { localesService, canchasService } from './services/locales.service';
import { notificacionesService } from './services/notificaciones.service';
import { paisesService } from './services/paises.service';
import { partidosService } from './services/partidos.service';
import { rondasService } from './services/rondas.service';
import { torneosService } from './services/torneos.service';
import { usuariosService } from './services/usuarios.service';
import { healthService } from './services/health.service';
import { adminTorneoService } from './services/admin-torneo.service';
import { adminCategoriaService } from './services/admin-categoria.service';
import { adminEdicionService } from './services/admin-edicion.service';
import { edicionCategoriasService } from './services/edicion-categorias.service';
import { reglasClasificacionService } from './services/reglas-clasificacion.service';
import { sponsorsService } from './services/sponsors.service';
import { minigamesService } from './services/minigames.service';

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
  eliminatorias: eliminatoriasService,
  grupos: gruposService,
  jugadores: jugadoresService,
  locales: localesService,
  canchas: canchasService,
  notificaciones: notificacionesService,
  paises: paisesService,
  partidos: partidosService,
  rondas: rondasService,
  torneos: torneosService,
  usuarios: usuariosService,
  health: healthService,
  adminTorneo: adminTorneoService,
  adminCategoria: adminCategoriaService,
  adminEdicion: adminEdicionService,
  edicionCategorias: edicionCategoriasService,
  reglasClasificacion: reglasClasificacionService,
  sponsors: sponsorsService,
  minigames: minigamesService,
};

export default api;

// También exportar mockApi para testing
