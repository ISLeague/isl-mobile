/**
 * ISL Backend Interfaces
 * ========================
 * 
 * Este módulo exporta todas las interfaces necesarias para implementar el backend de ISL.
 * Organizado por dominios para facilitar la implementación.
 * 
 * @author ISL Team
 * @version 1.0.0
 */

// ============================================
// ENTIDADES BASE (Modelos de Base de Datos)
// ============================================
export * from './entities/Usuario';
export * from './entities/Pais';
export * from './entities/Torneo';
export * from './entities/Edicion';
export * from './entities/Categoria';
export * from './entities/EdicionCategoria';
export * from './entities/Equipo';
export * from './entities/Jugador';
export * from './entities/PlantillaEquipo';
export * from './entities/Fase';
export * from './entities/Grupo';
export * from './entities/Ronda';
export * from './entities/Partido';
export * from './entities/EventoPartido';
export * from './entities/Clasificacion';
export * from './entities/Local';
export * from './entities/Cancha';
export * from './entities/Sponsor';
export * from './entities/Notificacion';
export * from './entities/Banner';
export * from './entities/Fotos';
export * from './entities/SeguimientoEquipo';
export * from './entities/HistorialEquipoEdicion';
export * from './entities/HistorialJugadorEdicion';
export * from './entities/ReglaAvance';

// ============================================
// DTOs (Data Transfer Objects)
// ============================================
export * from './dtos/auth.dto';
export * from './dtos/usuario.dto';
export * from './dtos/pais.dto';
export * from './dtos/torneo.dto';
export * from './dtos/equipo.dto';
export * from './dtos/jugador.dto';
export * from './dtos/partido.dto';
export * from './dtos/estadisticas.dto';
export * from './dtos/notificacion.dto';
export * from './dtos/sponsor.dto';
export * from './dtos/local.dto';
export * from './dtos/fotos.dto';
export * from './dtos/seguimiento.dto';

// ============================================
// API RESPONSES
// ============================================
export * from './responses/api.responses';

// ============================================
// ENDPOINTS (Contratos de API)
// ============================================
export * from './endpoints/auth.endpoints';
export * from './endpoints/usuarios.endpoints';
export * from './endpoints/paises.endpoints';
export * from './endpoints/torneos.endpoints';
export * from './endpoints/ediciones.endpoints';
export * from './endpoints/categorias.endpoints';
export * from './endpoints/equipos.endpoints';
export * from './endpoints/jugadores.endpoints';
export * from './endpoints/fases.endpoints';
export * from './endpoints/grupos.endpoints';
export * from './endpoints/rondas.endpoints';
export * from './endpoints/partidos.endpoints';
export * from './endpoints/clasificacion.endpoints';
export * from './endpoints/estadisticas.endpoints';
export * from './endpoints/locales.endpoints';
export * from './endpoints/canchas.endpoints';
export * from './endpoints/sponsors.endpoints';
export * from './endpoints/notificaciones.endpoints';
export * from './endpoints/fotos.endpoints';
export * from './endpoints/seguimiento.endpoints';
