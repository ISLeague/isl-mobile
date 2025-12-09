import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../types/auth.types';
import {
  Torneo,
  Edicion,
} from '../types';
import {
  mockUsuarios,
  mockPaises,
  mockTorneos,
  mockEdiciones,
  mockCategorias,
  mockEdicionCategorias,
  mockEquipos,
  mockJugadores,
  mockFases,
  mockGrupos,
  mockClasificacion,
  mockPartidos,
  mockEventos,
  mockBanners,
  mockNotificaciones,
  mockTopScorers,
  mockTopAssists,
  mockLeastConceded,
  mockKnockoutMatches,
  mockCanchas,
  mockLocales,
  getEquipoById,
  getJugadorById,
  getPartidosByFase,
  getClasificacionByGrupo,
  getEventosByPartido,
  getJugadoresByEquipo,
} from '../data/mockData';
import { Equipo, Partido, Usuario } from '../types';

// Simula delay de red
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Simula token JWT
const generateToken = (userId: number) => {
  return `mock_token_${userId}_${Date.now()}`;
};

// ============================================
// 🔐 AUTENTICACIÓN
// ============================================

export const mockAuthApi = {
  // POST /auth/login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    await delay(800);
    
    const usuario = mockUsuarios.find(u => u.email === credentials.email);
    
    if (!usuario || credentials.password !== 'password123') {
      throw new Error('Credenciales incorrectas');
    }
    
    // Obtener el país si existe
    const pais = usuario.id_pais ? mockPaises.find(p => p.id_pais === usuario.id_pais) : undefined;
    
    // Obtener torneos y ediciones si es admin de torneo (ahora arrays con pais populado)
    const torneos = usuario.id_torneos ? usuario.id_torneos.map(id => {
      const torneo = mockTorneos.find(t => t.id_torneo === id);
      if (!torneo) return null;
      return {
        ...torneo,
        pais: mockPaises.find(p => p.id_pais === torneo.id_pais),
      };
    }).filter(Boolean) as Torneo[] : undefined;
    const ediciones = usuario.id_ediciones ? usuario.id_ediciones.map(id => mockEdiciones.find(e => e.id_edicion === id)).filter(Boolean) as Edicion[] : undefined;
    
    return {
      token: generateToken(usuario.id_usuario),
      usuario: {
        ...usuario,
        pais,
        torneos,
        ediciones,
      },
    };
  },

  // POST /auth/register
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    await delay(1000);
    
    // Verificar si el email ya existe
    const existingUser = mockUsuarios.find(u => u.email === data.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }
    
    const newUser: Usuario = {
      id_usuario: mockUsuarios.length + 1,
      email: data.email,
      rol: 'fan',
      id_pais: data.id_pais,
    };
    
    mockUsuarios.push(newUser);
    
    return {
      token: generateToken(newUser.id_usuario),
      usuario: {
        ...newUser,
        pais: mockPaises.find(p => p.id_pais === newUser.id_pais),
      },
    };
  },

  // POST /auth/logout
  logout: async (): Promise<void> => {
    await delay(300);
    // Aquí podrías limpiar tokens, etc.
  },

  // GET /profile
  getProfile: async (token: string): Promise<Usuario> => {
    await delay(500);
    // Extraer userId del token mock
    const userId = parseInt(token.split('_')[2]);
    const usuario = mockUsuarios.find(u => u.id_usuario === userId);
    
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    
    return {
      ...usuario,
      pais: mockPaises.find(p => p.id_pais === usuario.id_pais),
    };
  },
};

// ============================================
// 🌍 NAVEGACIÓN PRINCIPAL
// ============================================

export const mockMainApi = {
  // GET /banners
  getBanners: async () => {
    await delay(400);
    return mockBanners.filter(b => b.activo);
  },

  // GET /countries
  getCountries: async () => {
    await delay(300);
    return mockPaises;
  },

  // GET /countries/{id_pais}/tournaments
  getTournamentsByCountry: async (idPais: number) => {
    await delay(400);
    return mockTorneos.filter(t => t.id_pais === idPais);
  },

  // GET /tournaments/{id_torneo}/editions
  getEditionsByTournament: async (idTorneo: number) => {
    await delay(400);
    return mockEdiciones.filter(e => e.id_torneo === idTorneo);
  },

  // GET /editions/{id_edicion}/categories
  getCategoriesByEdition: async (idEdicion: number) => {
    await delay(400);
    const edicionCats = mockEdicionCategorias.filter(ec => ec.id_edicion === idEdicion);
    return edicionCats.map(ec => ({
      ...ec,
      categoria: mockCategorias.find(c => c.id_categoria === ec.id_categoria),
    }));
  },
};

// ============================================
// ⚽ COMPETICIÓN
// ============================================

export const mockCompetitionApi = {
  // GET /edition-categories/{id_edicion_categoria}/phases
  getPhases: async (idEdicionCategoria: number) => {
    await delay(400);
    return mockFases.filter(f => f.id_edicion_categoria === idEdicionCategoria);
  },

  // GET /phases/{id_fase}/groups
  getGroupsByPhase: async (idFase: number) => {
    await delay(400);
    return mockGrupos.filter(g => g.id_fase === idFase);
  },

  // GET /groups/{id_grupo}/standings
  getStandingsByGroup: async (idGrupo: number) => {
    await delay(500);
    const standings = getClasificacionByGrupo(idGrupo);
    return standings.map(s => ({
      ...s,
      equipo: getEquipoById(s.id_equipo),
    }));
  },

  // GET /phases/{id_fase}/matches
  getMatchesByPhase: async (idFase: number) => {
    await delay(500);
    const partidos = getPartidosByFase(idFase);
    return partidos.map(p => ({
      ...p,
      equipo_local: getEquipoById(p.id_equipo_local),
      equipo_visitante: getEquipoById(p.id_equipo_visitante),
      cancha: mockCanchas.find(c => c.id_cancha === p.id_cancha),
    }));
  },

  // GET /matches/{id_partido}
  getMatchDetail: async (idPartido: number) => {
    await delay(600);
    const partido = mockPartidos.find(p => p.id_partido === idPartido);
    if (!partido) throw new Error('Partido no encontrado');
    
    const eventos = getEventosByPartido(idPartido);
    const cancha = mockCanchas.find(c => c.id_cancha === partido.id_cancha);
    const local = cancha ? mockLocales.find(l => l.id_local === cancha.id_local) : undefined;
    
    return {
      ...partido,
      equipo_local: getEquipoById(partido.id_equipo_local),
      equipo_visitante: getEquipoById(partido.id_equipo_visitante),
      cancha: cancha ? { ...cancha, local } : undefined,
      eventos: eventos.map(e => ({
        ...e,
        jugador: getJugadorById(e.id_jugador),
      })),
    };
  },

  // GET /matches/search?team_name=...
  searchMatches: async (teamName: string) => {
    await delay(400);
    const equiposFiltrados = mockEquipos.filter(e => 
      e.nombre.toLowerCase().includes(teamName.toLowerCase())
    );
    const idsEquipos = equiposFiltrados.map(e => e.id_equipo);
    
    return mockPartidos
      .filter(p => 
        idsEquipos.includes(p.id_equipo_local) || 
        idsEquipos.includes(p.id_equipo_visitante)
      )
      .map(p => ({
        ...p,
        equipo_local: getEquipoById(p.id_equipo_local),
        equipo_visitante: getEquipoById(p.id_equipo_visitante),
      }));
  },
};

// ============================================
// 🛡️ EQUIPOS Y JUGADORES
// ============================================

export const mockTeamsApi = {
  // GET /teams/{id_equipo}
  getTeamDetail: async (idEquipo: number) => {
    await delay(500);
    const equipo = getEquipoById(idEquipo);
    if (!equipo) throw new Error('Equipo no encontrado');
    
    return equipo;
  },

  // GET /teams/{id_equipo}/stats
  getTeamStats: async (idEquipo: number) => {
    await delay(400);
    const clasificacion = mockClasificacion.find(c => c.id_equipo === idEquipo);
    return clasificacion || {
      pj: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      puntos: 0,
    };
  },

  // GET /teams/{id_equipo}/next-match
  getNextMatch: async (idEquipo: number) => {
    await delay(400);
    const today = new Date();
    const nextMatch = mockPartidos
      .filter(p => 
        (p.id_equipo_local === idEquipo || p.id_equipo_visitante === idEquipo) &&
        p.estado_partido === 'Pendiente' &&
        new Date(p.fecha) >= today
      )
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];
    
    if (!nextMatch) return null;
    
    return {
      ...nextMatch,
      equipo_local: getEquipoById(nextMatch.id_equipo_local),
      equipo_visitante: getEquipoById(nextMatch.id_equipo_visitante),
    };
  },

  // GET /teams/{id_equipo}/recent-form
  getRecentForm: async (idEquipo: number) => {
    await delay(400);
    const partidosEquipo = mockPartidos
      .filter(p => 
        (p.id_equipo_local === idEquipo || p.id_equipo_visitante === idEquipo) &&
        p.estado_partido === 'Finalizado'
      )
      .slice(0, 5);
    
    return partidosEquipo.map(p => {
      const isLocal = p.id_equipo_local === idEquipo;
      const golesEquipo = isLocal ? p.marcador_local : p.marcador_visitante;
      const golesRival = isLocal ? p.marcador_visitante : p.marcador_local;
      
      if (golesEquipo! > golesRival!) return 'W'; // Win
      if (golesEquipo! < golesRival!) return 'L'; // Loss
      return 'D'; // Draw
    });
  },

  // GET /teams/{id_equipo}/players
  getTeamPlayers: async (idEquipo: number) => {
    await delay(500);
    return getJugadoresByEquipo(idEquipo);
  },
};

// ============================================
// 🏆 KNOCKOUT (ELIMINATORIAS)
// ============================================

export const mockKnockoutApi = {
  // GET /edition-categories/{id_edicion_categoria}/knockout-bracket
  getKnockoutBracket: async (idEdicionCategoria: number, copa: string = 'oro') => {
    await delay(600);
    return mockKnockoutMatches.map(match => ({
      ...match,
      equipo_local: match.equipo_local,
      equipo_visitante: match.equipo_visitante,
    }));
  },
};

// ============================================
// 🏆 THE BEST (ESTADÍSTICAS DESTACADAS)
// ============================================

export const mockStatsApi = {
  // GET /edition-categories/{id_edicion_categoria}/stats/top-scorers
  getTopScorers: async (idEdicionCategoria: number, limit?: number) => {
    await delay(400);
    const scorers = [...mockTopScorers];
    return limit ? scorers.slice(0, limit) : scorers;
  },

  // GET /edition-categories/{id_edicion_categoria}/stats/top-assists
  getTopAssists: async (idEdicionCategoria: number, limit?: number) => {
    await delay(400);
    const assists = [...mockTopAssists];
    return limit ? assists.slice(0, limit) : assists;
  },

  // GET /edition-categories/{id_edicion_categoria}/stats/least-conceded
  getLeastConceded: async (idEdicionCategoria: number, limit?: number) => {
    await delay(400);
    const teams = [...mockLeastConceded];
    return limit ? teams.slice(0, limit) : teams;
  },

  // GET /edition-categories/{id_edicion_categoria}/stats/most-yellows
  getMostYellows: async (idEdicionCategoria: number, limit?: number) => {
    await delay(400);
    // Mock data para tarjetas amarillas
    return [
      { id_jugador: 3, nombre: 'Roberto Silva', equipo: 'FC Barcelona Lima', amarillas: 6 },
      { id_jugador: 8, nombre: 'Javier Morales', equipo: 'Manchester United', amarillas: 5 },
      { id_jugador: 12, nombre: 'Sebastián Pérez', equipo: 'Sporting Cristal', amarillas: 4 },
    ].slice(0, limit);
  },

  // GET /edition-categories/{id_edicion_categoria}/stats/most-reds
  getMostReds: async (idEdicionCategoria: number, limit?: number) => {
    await delay(400);
    // Mock data para tarjetas rojas
    return [
      { id_jugador: 10, nombre: 'Ricardo Vargas', equipo: 'Arsenal FC', rojas: 2 },
      { id_jugador: 14, nombre: 'Lucas Sánchez', equipo: 'Alianza Lima', rojas: 1 },
    ].slice(0, limit);
  },
};

// ============================================
// ❤️ MI EQUIPO Y NOTIFICACIONES
// ============================================

export const mockProfileApi = {
  // GET /profile/my-team
  getMyTeam: async (userId: number) => {
    await delay(400);
    // Mock: el usuario 2 sigue al equipo 1
    if (userId === 2) {
      return getEquipoById(1);
    }
    return null;
  },

  // POST /profile/my-team
  setMyTeam: async (userId: number, idEquipo: number) => {
    await delay(500);
    // Mock: simula guardar
    return { success: true, equipo: getEquipoById(idEquipo) };
  },

  // GET /profile/notifications
  getNotifications: async (userId: number) => {
    await delay(400);
    return mockNotificaciones;
  },
};

// ============================================
// 🔧 API CONSOLIDADA
// ============================================

export const mockApi = {
  auth: mockAuthApi,
  main: mockMainApi,
  competition: mockCompetitionApi,
  teams: mockTeamsApi,
  knockout: mockKnockoutApi,
  stats: mockStatsApi,
  profile: mockProfileApi,
};

export default mockApi;