import {
  Pais,
  Usuario,
  Torneo,
  Edicion,
  Categoria,
  EdicionCategoria,
  Equipo,
  Jugador,
  PlantillaEquipo,
  Fase,
  Ronda,
  Grupo,
  Clasificacion,
  Partido,
  EventoPartido,
  Banner,
  Notificacion,
  Fotos,
  Local,
  Cancha,
  Sponsor,
  TopScorer,
  TopAssist,
  LeastConceded,
  KnockoutMatch,
} from '../types';

// 🌍 PAÍSES
export const mockPaises: Pais[] = [
  { id_pais: 1, nombre: 'Perú', emoji: '🇵🇪' },
  { id_pais: 2, nombre: 'Argentina', emoji: '🇦🇷' },
  { id_pais: 3, nombre: 'Brasil', emoji: '🇧🇷' },
  { id_pais: 4, nombre: 'Chile', emoji: '🇨🇱' },
  { id_pais: 5, nombre: 'Colombia', emoji: '🇨🇴' },
  { id_pais: 6, nombre: 'Uruguay', emoji: '🇺🇾' },
  { id_pais: 7, nombre: 'Ecuador', emoji: '🇪🇨' },
  { id_pais: 8, nombre: 'Bolivia', emoji: '🇧🇴' },
];

// 👤 USUARIOS
export const mockUsuarios: Usuario[] = [
  // 1. SuperAdmin (gestiona países)
  {
    id_usuario: 1,
    email: 'superadmin@interleague.com',
    rol: 'superadmin',
    id_pais: 0, // Sin país asignado, gestiona todos
  },
  // 2. Admin de Torneo (asignado a múltiples torneos)
  {
    id_usuario: 2,
    email: 'admin.torneo@interleague.com',
    rol: 'admin',
    id_pais: 1, // Perú
    id_torneos: [1], // Inter Soccer League - Perú
    id_ediciones: [1], // Edición 2025
    debe_cambiar_password: false, // Ya cambió su contraseña
  },
  // 3. Otro Admin de Torneo con múltiples torneos
  {
    id_usuario: 3,
    email: 'admin.torneo2@interleague.com',
    rol: 'admin',
    id_pais: 1,
    id_torneos: [1, 1], // Dos ediciones del mismo torneo
    id_ediciones: [2, 1], // Ediciones 2024 y 2025
    debe_cambiar_password: false, // Ya cambió su contraseña
  },
  // 4. Fan normal (ve todo normalmente)
  {
    id_usuario: 4,
    email: 'fan@gmail.com',
    rol: 'fan',
    id_pais: 1,
    acepto_terminos: true,
    acepto_privacidad: true,
    fecha_aceptacion_terminos: '2025-01-15T10:30:00Z',
  },
  {
    id_usuario: 5,
    email: 'juan.perez@gmail.com',
    rol: 'fan',
    id_pais: 1,
    acepto_terminos: true,
    acepto_privacidad: true,
    fecha_aceptacion_terminos: '2025-02-20T14:22:00Z',
  },
  {
    id_usuario: 6,
    email: 'maria.garcia@gmail.com',
    rol: 'fan',
    id_pais: 1,
    acepto_terminos: true,
    acepto_privacidad: true,
    fecha_aceptacion_terminos: '2025-03-10T09:15:00Z',
  },
  {
    id_usuario: 7,
    email: 'carlos.rodriguez@gmail.com',
    rol: 'fan',
    id_pais: 1,
    acepto_terminos: true,
    acepto_privacidad: true,
    fecha_aceptacion_terminos: '2025-01-05T16:45:00Z',
  },
];

// 🏟️ LOCALES
export const mockLocales: Local[] = [
  { id_local: 1, nombre: 'Complejo Deportivo Villa El Salvador', latitud: -12.2167, longitud: -76.9333 },
  { id_local: 2, nombre: 'Polideportivo San Borja', latitud: -12.0897, longitud: -77.0028 },
  { id_local: 3, nombre: 'Campo Deportivo Miraflores', latitud: -12.1203, longitud: -77.0282 },
  { id_local: 4, nombre: 'Estadio Municipal de Surco', latitud: -12.1444, longitud: -77.0103 },
];

// ⚽ CANCHAS
export const mockCanchas: Cancha[] = [
  { id_cancha: 1, nombre: 'Cancha Principal A', id_local: 1 },
  { id_cancha: 2, nombre: 'Cancha Principal B', id_local: 1 },
  { id_cancha: 3, nombre: 'Cancha Sintética 1', id_local: 2 },
  { id_cancha: 4, nombre: 'Cancha Sintética 2', id_local: 2 },
  { id_cancha: 5, nombre: 'Cancha A', id_local: 3 },
  { id_cancha: 6, nombre: 'Cancha B', id_local: 3 },
  { id_cancha: 7, nombre: 'Cancha Central', id_local: 4 },
];

// 💼 SPONSORS
export const mockSponsors: Sponsor[] = [
  {
    id_sponsor: 1,
    nombre: 'Nike',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png',
    link: 'https://www.nike.com',
  },
  {
    id_sponsor: 2,
    nombre: 'Adidas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/2560px-Adidas_Logo.svg.png',
    link: 'https://www.adidas.com',
  },
  {
    id_sponsor: 3,
    nombre: 'Puma',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/da/Puma_complete_logo.svg/1200px-Puma_complete_logo.svg.png',
    link: 'https://www.puma.com',
  },
  {
    id_sponsor: 4,
    nombre: 'Gatorade',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Gatorade_logo.svg/2560px-Gatorade_logo.svg.png',
    link: 'https://www.gatorade.com',
  },
  {
    id_sponsor: 5,
    nombre: 'Coca-Cola',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/2560px-Coca-Cola_logo.svg.png',
    link: 'https://www.coca-cola.com',
  },
  {
    id_sponsor: 6,
    nombre: 'Vibenfly',
    logo: 'https://vibenfly.com/wp-content/uploads/2023/05/logo-vibenfly.png',
    link: 'https://vibenfly.com',
  },
];

// 🏆 TORNEOS
export const mockTorneos: Torneo[] = [
  { id_torneo: 1, nombre: 'ISL Lima', id_pais: 1 },
  { id_torneo: 2, nombre: 'Copa Buenos Aires', id_pais: 2 },
  { id_torneo: 3, nombre: 'Torneo São Paulo', id_pais: 3 },
  { id_torneo: 4, nombre: 'Liga Callao', id_pais: 1 },
  { id_torneo: 5, nombre: 'Torneo Verano Lima', id_pais: 1 },
];

// 📅 EDICIONES
export const mockEdiciones: Edicion[] = [
  { id_edicion: 1, numero: 2024, estado: 'cerrado', id_torneo: 1 }, // InterLeague Lima - Finalizado
  { id_edicion: 2, numero: 2025, estado: 'en juego', id_torneo: 1 }, // InterLeague Lima - Activo
  { id_edicion: 3, numero: 2024, estado: 'cerrado', id_torneo: 2 }, // Copa Buenos Aires - Finalizado
  { id_edicion: 4, numero: 2024, estado: 'cerrado', id_torneo: 4 }, // Liga Callao - Finalizado
  { id_edicion: 5, numero: 2025, estado: 'en juego', id_torneo: 5 }, // Torneo Verano Lima - Activo
];

// 🏅 CATEGORÍAS
export const mockCategorias: Categoria[] = [
  { id_categoria: 1, nombre: 'SUB16', tiene_restriccion_edad: true, edad_maxima: 16, permite_refuerzos: true, max_refuerzos: 3 },
  { id_categoria: 2, nombre: 'SUB18', tiene_restriccion_edad: true, edad_maxima: 18, permite_refuerzos: true, max_refuerzos: 2 },
  { id_categoria: 3, nombre: 'Libre', tiene_restriccion_edad: false, permite_refuerzos: false },
  { id_categoria: 4, nombre: 'Veteranos', tiene_restriccion_edad: true, edad_maxima: 40, permite_refuerzos: false },
];

// 🔗 EDICIÓN CATEGORÍAS
export const mockEdicionCategorias: EdicionCategoria[] = [
  { id_edicion_categoria: 1, id_edicion: 2, id_categoria: 1 },
  { id_edicion_categoria: 2, id_edicion: 2, id_categoria: 2 },
  { id_edicion_categoria: 3, id_edicion: 2, id_categoria: 3 },
];

// 🛡️ EQUIPOS
export const mockEquipos: Equipo[] = [
  { id_equipo: 1, nombre: 'FC Barcelona Lima', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 2, nombre: 'Real Madrid FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 3, nombre: 'Liverpool Lima', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 4, nombre: 'Manchester United', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 5, nombre: 'Bayern Munich', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 6, nombre: 'Juventus FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 7, nombre: 'PSG Lima', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 8, nombre: 'AC Milan', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 9, nombre: 'Chelsea FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 10, nombre: 'Arsenal FC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 11, nombre: 'Inter Miami', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 12, nombre: 'Sporting Cristal', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 13, nombre: 'Universitario', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 14, nombre: 'Alianza Lima', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 15, nombre: 'Borussia Dortmund', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
  { id_equipo: 16, nombre: 'Atlético Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1183px-FC_Barcelona_%28crest%29.svg.png', id_edicion_categoria: 1 },
];

// 👨‍🦱 JUGADORES
export const mockJugadores: Jugador[] = [
  { id_jugador: 1, nombre_completo: 'Carlos Alberto Mendoza', dni: '12345678', numero_camiseta: 10, fecha_nacimiento: '2000-05-15', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 2, nombre_completo: 'Luis Fernando García', dni: '23456789', numero_camiseta: 7, fecha_nacimiento: '1999-08-22', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 3, nombre_completo: 'Roberto Silva', dni: '34567890', numero_camiseta: 9, fecha_nacimiento: '2001-03-10', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 4, nombre_completo: 'Diego Fernández', dni: '45678901', numero_camiseta: 11, fecha_nacimiento: '2000-11-05', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 5, nombre_completo: 'Miguel Torres', dni: '56789012', numero_camiseta: 8, fecha_nacimiento: '1998-07-18', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 6, nombre_completo: 'Andrés Rojas', dni: '67890123', numero_camiseta: 6, fecha_nacimiento: '2002-01-25', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 7, nombre_completo: 'Fernando Castro', dni: '78901234', numero_camiseta: 4, fecha_nacimiento: '1999-09-30', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 8, nombre_completo: 'Javier Morales', dni: '89012345', numero_camiseta: 5, fecha_nacimiento: '2000-12-12', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 9, nombre_completo: 'Pablo Hernández', dni: '90123456', numero_camiseta: 3, fecha_nacimiento: '2001-06-08', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 10, nombre_completo: 'Ricardo Vargas', dni: '01234567', numero_camiseta: 2, fecha_nacimiento: '1999-04-20', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 11, nombre_completo: 'Jorge Ramírez', dni: '11223344', numero_camiseta: 1, fecha_nacimiento: '2000-02-14', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 12, nombre_completo: 'Sebastián Pérez', dni: '22334455', numero_camiseta: 12, fecha_nacimiento: '2001-10-03', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 13, nombre_completo: 'Mateo Díaz', dni: '33445566', numero_camiseta: 13, fecha_nacimiento: '1998-08-27', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 14, nombre_completo: 'Lucas Sánchez', dni: '44556677', numero_camiseta: 14, fecha_nacimiento: '2002-05-09', estado: 'activo', foto: 'https://via.placeholder.com/150' },
  { id_jugador: 15, nombre_completo: 'Daniel Reyes', dni: '55667788', numero_camiseta: 15, fecha_nacimiento: '1999-11-16', estado: 'activo', foto: 'https://via.placeholder.com/150' },
];

// 📋 PLANTILLAS (Jugadores en equipos)
export const mockPlantillas: PlantillaEquipo[] = [
  { id_plantilla: 1, id_equipo: 1, id_jugador: 1, activo_en_equipo: true, es_refuerzo: false, fecha_registro: '2025-01-15' },
  { id_plantilla: 2, id_equipo: 1, id_jugador: 2, activo_en_equipo: true, es_refuerzo: true, fecha_registro: '2025-01-15' },
  { id_plantilla: 3, id_equipo: 1, id_jugador: 3, activo_en_equipo: true, es_refuerzo: false, fecha_registro: '2025-01-15' },
  { id_plantilla: 4, id_equipo: 2, id_jugador: 4, activo_en_equipo: true, es_refuerzo: false, fecha_registro: '2025-01-15' },
  { id_plantilla: 5, id_equipo: 2, id_jugador: 5, activo_en_equipo: true, es_refuerzo: true, fecha_registro: '2025-01-15' },
  { id_plantilla: 6, id_equipo: 3, id_jugador: 6, activo_en_equipo: true, es_refuerzo: false, fecha_registro: '2025-01-15' },
  { id_plantilla: 7, id_equipo: 3, id_jugador: 7, activo_en_equipo: true, es_refuerzo: false, fecha_registro: '2025-01-15' },
  { id_plantilla: 8, id_equipo: 4, id_jugador: 8, activo_en_equipo: true, es_refuerzo: true, fecha_registro: '2025-01-15' },
];

// 📊 FASES
export const mockFases: Fase[] = [
  { id_fase: 1, nombre: 'Fase de Grupos', tipo: 'grupo', copa: 'general', id_edicion_categoria: 1 },
  { id_fase: 2, nombre: 'Octavos', tipo: 'knockout', copa: 'oro', id_edicion_categoria: 1 },
  { id_fase: 3, nombre: 'Cuartos', tipo: 'knockout', copa: 'oro', id_edicion_categoria: 1 },
  { id_fase: 4, nombre: 'Semifinal', tipo: 'knockout', copa: 'oro', id_edicion_categoria: 1 },
  { id_fase: 5, nombre: 'Final', tipo: 'knockout', copa: 'oro', id_edicion_categoria: 1 },
];

// 🏐 GRUPOS
export const mockGrupos: Grupo[] = [
  { id_grupo: 1, nombre: 'Grupo A', id_fase: 1, tipo_clasificacion: 'pasa_copa_general', cantidad_equipos: 4, equipos_pasan_oro: 2, equipos_pasan_plata: 1 },
  { id_grupo: 2, nombre: 'Grupo B', id_fase: 1, tipo_clasificacion: 'pasa_copa_oro', cantidad_equipos: 4, equipos_pasan_oro: 2, equipos_pasan_plata: 0 },
  { id_grupo: 3, nombre: 'Grupo C', id_fase: 1, tipo_clasificacion: 'pasa_copa_plata', cantidad_equipos: 4, equipos_pasan_oro: 1, equipos_pasan_plata: 2 },
  { id_grupo: 4, nombre: 'Grupo D', id_fase: 1, tipo_clasificacion: 'pasa_copa_bronce', cantidad_equipos: 4, equipos_pasan_oro: 0, equipos_pasan_plata: 2 },
];

// 📈 CLASIFICACIÓN (Tabla de posiciones)
export const mockClasificacion: Clasificacion[] = [
  // Grupo A
  { id_clasificacion: 1, id_equipo: 1, id_grupo: 1, pj: 6, gf: 18, gc: 8, dif: 10, puntos: 16, posicion: 1 },
  { id_clasificacion: 2, id_equipo: 2, id_grupo: 1, pj: 6, gf: 15, gc: 10, dif: 5, puntos: 13, posicion: 2 },
  { id_clasificacion: 3, id_equipo: 3, id_grupo: 1, pj: 6, gf: 12, gc: 12, dif: 0, puntos: 10, posicion: 3 },
  { id_clasificacion: 4, id_equipo: 4, id_grupo: 1, pj: 6, gf: 8, gc: 15, dif: -7, puntos: 6, posicion: 4 },
  
  // Grupo B
  { id_clasificacion: 5, id_equipo: 5, id_grupo: 2, pj: 6, gf: 20, gc: 6, dif: 14, puntos: 18, posicion: 1 },
  { id_clasificacion: 6, id_equipo: 6, id_grupo: 2, pj: 6, gf: 14, gc: 9, dif: 5, puntos: 12, posicion: 2 },
  { id_clasificacion: 7, id_equipo: 7, id_grupo: 2, pj: 6, gf: 11, gc: 11, dif: 0, puntos: 11, posicion: 3 },
  { id_clasificacion: 8, id_equipo: 8, id_grupo: 2, pj: 6, gf: 7, gc: 18, dif: -11, puntos: 4, posicion: 4 },
  
  // Grupo C
  { id_clasificacion: 9, id_equipo: 9, id_grupo: 3, pj: 6, gf: 16, gc: 7, dif: 9, puntos: 15, posicion: 1 },
  { id_clasificacion: 10, id_equipo: 10, id_grupo: 3, pj: 6, gf: 13, gc: 10, dif: 3, puntos: 12, posicion: 2 },
  { id_clasificacion: 11, id_equipo: 11, id_grupo: 3, pj: 6, gf: 10, gc: 12, dif: -2, puntos: 9, posicion: 3 },
  { id_clasificacion: 12, id_equipo: 12, id_grupo: 3, pj: 6, gf: 6, gc: 16, dif: -10, puntos: 5, posicion: 4 },
  
  // Grupo D
  { id_clasificacion: 13, id_equipo: 13, id_grupo: 4, pj: 6, gf: 17, gc: 9, dif: 8, puntos: 14, posicion: 1 },
  { id_clasificacion: 14, id_equipo: 14, id_grupo: 4, pj: 6, gf: 14, gc: 11, dif: 3, puntos: 13, posicion: 2 },
  { id_clasificacion: 15, id_equipo: 15, id_grupo: 4, pj: 6, gf: 11, gc: 13, dif: -2, puntos: 10, posicion: 3 },
  { id_clasificacion: 16, id_equipo: 16, id_grupo: 4, pj: 6, gf: 8, gc: 17, dif: -9, puntos: 7, posicion: 4 },
];

// 📅 RONDAS
export const mockRondas: Ronda[] = [
  // Rondas de Fase de Grupos
  { id_ronda: 1, nombre: 'Jornada 1', fecha_inicio: '2025-03-15', fecha_fin: '2025-03-16', id_fase: 1, es_amistosa: false, tipo: 'fase_grupos', aplicar_fecha_automatica: true, orden: 1 },
  { id_ronda: 2, nombre: 'Jornada 2', fecha_inicio: '2025-03-22', fecha_fin: '2025-03-23', id_fase: 1, es_amistosa: false, tipo: 'fase_grupos', aplicar_fecha_automatica: true, orden: 2 },
  { id_ronda: 3, nombre: 'Jornada 3', fecha_inicio: '2025-03-29', fecha_fin: '2025-03-30', id_fase: 1, es_amistosa: false, tipo: 'fase_grupos', aplicar_fecha_automatica: false, orden: 3 },
  { id_ronda: 4, nombre: 'Jornada 4', fecha_inicio: '2025-04-05', fecha_fin: '2025-04-06', id_fase: 1, es_amistosa: false, tipo: 'fase_grupos', aplicar_fecha_automatica: true, orden: 4 },
  { id_ronda: 5, nombre: 'Jornada 5', fecha_inicio: '2025-04-12', fecha_fin: '2025-04-13', id_fase: 1, es_amistosa: false, tipo: 'fase_grupos', aplicar_fecha_automatica: false, orden: 5 },
  { id_ronda: 6, nombre: 'Jornada 6 (Final Grupos)', fecha_inicio: '2025-04-19', fecha_fin: '2025-04-20', id_fase: 1, es_amistosa: false, tipo: 'fase_grupos', aplicar_fecha_automatica: true, orden: 6 },
  
  // Ronda Amistosa
  { id_ronda: 7, nombre: 'Amistosos - Fecha 1', fecha_inicio: '2025-04-26', fecha_fin: '2025-04-27', id_fase: 1, es_amistosa: true, tipo: 'amistosa', aplicar_fecha_automatica: false, orden: 7 },
  
  // Rondas de Eliminatorias
  { id_ronda: 8, nombre: 'Octavos de Final', fecha_inicio: '2025-11-15', fecha_fin: '2025-11-16', id_fase: 1, es_amistosa: false, tipo: 'eliminatorias', subtipo_eliminatoria: 'oro', aplicar_fecha_automatica: true, orden: 8 },
  { id_ronda: 9, nombre: 'Octavos de Final', fecha_inicio: '2025-11-22', fecha_fin: '2025-11-23', id_fase: 1, es_amistosa: false, tipo: 'eliminatorias', subtipo_eliminatoria: 'plata', aplicar_fecha_automatica: true, orden: 9 },
  { id_ronda: 10, nombre: 'Octavos de Final', fecha_inicio: '2025-11-29', fecha_fin: '2025-11-30', id_fase: 1, es_amistosa: false, tipo: 'eliminatorias', subtipo_eliminatoria: 'bronce', aplicar_fecha_automatica: true, orden: 10 },
];

// ⚽ PARTIDOS
export const mockPartidos: Partido[] = [
  // Jornada 1
  { id_partido: 1, fecha: '2025-03-15', hora: '15:00', estado_partido: 'Finalizado', marcador_local: 3, marcador_visitante: 1, wo: false, id_equipo_local: 1, id_equipo_visitante: 2, id_ronda: 1, id_fase: 1, id_cancha: 1 },
  { id_partido: 2, fecha: '2025-03-15', hora: '17:00', estado_partido: 'Finalizado', marcador_local: 2, marcador_visitante: 2, wo: false, id_equipo_local: 3, id_equipo_visitante: 4, id_ronda: 1, id_fase: 1, id_cancha: 2 },
  { id_partido: 7, fecha: '2025-03-16', hora: '15:00', estado_partido: 'Finalizado', marcador_local: 4, marcador_visitante: 0, wo: false, id_equipo_local: 5, id_equipo_visitante: 6, id_ronda: 1, id_fase: 1, id_cancha: 3 },
  { id_partido: 8, fecha: '2025-03-16', hora: '17:00', estado_partido: 'Finalizado', marcador_local: 2, marcador_visitante: 1, wo: false, id_equipo_local: 7, id_equipo_visitante: 8, id_ronda: 1, id_fase: 1, id_cancha: 4 },
  
  // Jornada 2
  { id_partido: 3, fecha: '2025-03-22', hora: '15:00', estado_partido: 'Finalizado', marcador_local: 2, marcador_visitante: 1, wo: false, id_equipo_local: 1, id_equipo_visitante: 3, id_ronda: 2, id_fase: 1, id_cancha: 1 },
  { id_partido: 4, fecha: '2025-03-22', hora: '17:00', estado_partido: 'Finalizado', marcador_local: 3, marcador_visitante: 2, wo: false, id_equipo_local: 2, id_equipo_visitante: 4, id_ronda: 2, id_fase: 1, id_cancha: 2 },
  
  // Jornada 8 (Próximos partidos - más cercana a la fecha actual) - Copa ORO
  { id_partido: 5, fecha: '2025-11-15', hora: '15:00', estado_partido: 'Pendiente', id_equipo_local: 1, id_equipo_visitante: 4, id_ronda: 8, id_fase: 1, id_cancha: 1 },
  { id_partido: 6, fecha: '2025-11-15', hora: '17:00', estado_partido: 'Pendiente', id_equipo_local: 2, id_equipo_visitante: 3, id_ronda: 8, id_fase: 1, id_cancha: 2 },
  { id_partido: 9, fecha: '2025-11-16', hora: '15:00', estado_partido: 'Pendiente', id_equipo_local: 5, id_equipo_visitante: 7, id_ronda: 8, id_fase: 1, id_cancha: 3 },
  { id_partido: 10, fecha: '2025-11-16', hora: '17:00', estado_partido: 'Pendiente', id_equipo_local: 6, id_equipo_visitante: 8, id_ronda: 8, id_fase: 1, id_cancha: 4 },

  // Jornada 9 - Copa PLATA (con empate en tiempo regular)
  { id_partido: 11, fecha: '2025-11-22', hora: '15:00', estado_partido: 'Finalizado', marcador_local: 1, marcador_visitante: 1, wo: false, id_equipo_local: 9, id_equipo_visitante: 10, id_ronda: 9, id_fase: 1, id_cancha: 1 },
  { id_partido: 12, fecha: '2025-11-22', hora: '17:00', estado_partido: 'Finalizado', marcador_local: 2, marcador_visitante: 2, penales_local: 4, penales_visitante: 3, wo: false, id_equipo_local: 11, id_equipo_visitante: 12, id_ronda: 9, id_fase: 1, id_cancha: 2 },

  // Jornada 10 - Copa BRONCE
  { id_partido: 13, fecha: '2025-11-29', hora: '15:00', estado_partido: 'Pendiente', id_equipo_local: 13, id_equipo_visitante: 14, id_ronda: 10, id_fase: 1, id_cancha: 1 },
  { id_partido: 14, fecha: '2025-11-29', hora: '17:00', estado_partido: 'Pendiente', id_equipo_local: 15, id_equipo_visitante: 16, id_ronda: 10, id_fase: 1, id_cancha: 2 },
];

// 🎯 EVENTOS DE PARTIDOS
export const mockEventos: EventoPartido[] = [
  // Partido 1: FC Barcelona Lima 3 - 1 Real Madrid FC
  { id_evento: 1, minuto: 15, tipo_evento: 'gol', id_partido: 1, id_jugador: 1 },
  { id_evento: 2, minuto: 23, tipo_evento: 'gol', id_partido: 1, id_jugador: 2 },
  { id_evento: 3, minuto: 35, tipo_evento: 'gol', id_partido: 1, id_jugador: 4 },
  { id_evento: 4, minuto: 67, tipo_evento: 'gol', id_partido: 1, id_jugador: 1 },
  { id_evento: 5, minuto: 45, tipo_evento: 'amarilla', id_partido: 1, id_jugador: 3 },
  
  // Partido 2: Liverpool 2 - 2 Manchester United (Empate en fase de grupos)
  { id_evento: 6, minuto: 12, tipo_evento: 'gol', id_partido: 2, id_jugador: 6 },
  { id_evento: 7, minuto: 28, tipo_evento: 'gol', id_partido: 2, id_jugador: 8 },
  { id_evento: 8, minuto: 55, tipo_evento: 'gol', id_partido: 2, id_jugador: 7 },
  { id_evento: 9, minuto: 78, tipo_evento: 'gol', id_partido: 2, id_jugador: 8 },
  
  // Partido 11: Chelsea 1 - 1 Arsenal (Empate en tiempo regular)
  { id_evento: 10, minuto: 20, tipo_evento: 'gol', id_partido: 11, id_jugador: 9 },
  { id_evento: 11, minuto: 65, tipo_evento: 'gol', id_partido: 11, id_jugador: 10 },
  { id_evento: 12, minuto: 42, tipo_evento: 'amarilla', id_partido: 11, id_jugador: 9 },
  
  // Partido 12: Inter Miami 2 - 2 Sporting Cristal (Definido por penales 4-3)
  { id_evento: 13, minuto: 18, tipo_evento: 'gol', id_partido: 12, id_jugador: 11 },
  { id_evento: 14, minuto: 33, tipo_evento: 'gol', id_partido: 12, id_jugador: 12 },
  { id_evento: 15, minuto: 52, tipo_evento: 'gol', id_partido: 12, id_jugador: 11 },
  { id_evento: 16, minuto: 88, tipo_evento: 'gol', id_partido: 12, id_jugador: 12 },
  { id_evento: 17, minuto: 75, tipo_evento: 'amarilla', id_partido: 12, id_jugador: 11 },
  { id_evento: 18, minuto: 81, tipo_evento: 'amarilla', id_partido: 12, id_jugador: 12 },
];

// 📢 BANNERS
export const mockBanners: Banner[] = [
  {
    id_banner: 1,
    imagen: 'https://via.placeholder.com/800x300/E31E24/FFFFFF?text=InterLeague+2025',
    link: '/torneo/1',
    activo: true,
  },
  {
    id_banner: 2,
    imagen: 'https://via.placeholder.com/800x300/1E90FF/FFFFFF?text=Inscripciones+Abiertas',
    link: '/registro',
    activo: true,
  },
  {
    id_banner: 3,
    imagen: 'https://via.placeholder.com/800x300/32CD32/FFFFFF?text=Próxima+Fecha',
    link: '/fixture',
    activo: true,
  },
];

// 🔔 NOTIFICACIONES
export const mockNotificaciones: Notificacion[] = [
  {
    id_notificacion: 1,
    titulo: '¡Nuevo partido programado!',
    descripcion: 'FC Barcelona Lima vs Real Madrid FC - 19 Oct, 15:00',
    fecha: '2025-10-10',
    url: '/partido/5',
  },
  {
    id_notificacion: 2,
    titulo: 'Resultados de la jornada',
    descripcion: 'Revisa los resultados de la última fecha',
    fecha: '2025-10-08',
    url: '/resultados',
  },
  {
    id_notificacion: 3,
    titulo: 'Tu equipo favorito ganó',
    descripcion: 'FC Barcelona Lima venció 3-1 a Real Madrid',
    fecha: '2025-10-05',
    url: '/equipo/1',
  },
];

// 📷 FOTOS
export const mockFotos: Fotos[] = [
  {
    id_fotos: 1,
    link_fotos_totales: 'https://example.com/photos/team1-full',
    link_preview: 'https://via.placeholder.com/150',
    id_equipo: 1,
  },
  {
    id_fotos: 2,
    link_fotos_totales: 'https://example.com/photos/team2-full',
    link_preview: 'https://via.placeholder.com/150',
    id_equipo: 2,
  },
];

// 🏆 TOP SCORERS (Goleadores)
export const mockTopScorers: TopScorer[] = [
  { id_jugador: 1, nombre: 'Carlos Mendoza', equipo: 'FC Barcelona Lima', goles: 12 },
  { id_jugador: 4, nombre: 'Diego Fernández', equipo: 'Real Madrid FC', goles: 10 },
  { id_jugador: 6, nombre: 'Andrés Rojas', equipo: 'Liverpool Lima', goles: 9 },
  { id_jugador: 8, nombre: 'Javier Morales', equipo: 'Manchester United', goles: 8 },
  { id_jugador: 5, nombre: 'Miguel Torres', equipo: 'Bayern Munich', goles: 7 },
];

// 🎯 TOP ASSISTS (Asistencias)
export const mockTopAssists: TopAssist[] = [
  { id_jugador: 2, nombre: 'Luis García', equipo: 'FC Barcelona Lima', asistencias: 8 },
  { id_jugador: 7, nombre: 'Fernando Castro', equipo: 'Liverpool Lima', asistencias: 6 },
  { id_jugador: 9, nombre: 'Pablo Hernández', equipo: 'Chelsea FC', asistencias: 5 },
  { id_jugador: 11, nombre: 'Jorge Ramírez', equipo: 'Inter Miami', asistencias: 5 },
  { id_jugador: 3, nombre: 'Roberto Silva', equipo: 'FC Barcelona Lima', asistencias: 4 },
];

// 🛡️ LEAST CONCEDED (Menos goles en contra)
export const mockLeastConceded: LeastConceded[] = [
  { id_equipo: 5, nombre: 'Bayern Munich', goles_en_contra: 6, logo: '🔴⚪' },
  { id_equipo: 9, nombre: 'Chelsea FC', goles_en_contra: 7, logo: '🔵' },
  { id_equipo: 1, nombre: 'FC Barcelona Lima', goles_en_contra: 8, logo: '🔴🔵' },
  { id_equipo: 13, nombre: 'Universitario', goles_en_contra: 9, logo: '🟡' },
  { id_equipo: 6, nombre: 'Juventus FC', goles_en_contra: 9, logo: '⚫⚪' },
];

// 🏆 KNOCKOUT MATCHES (Partidos de eliminatorias)
export const mockKnockoutMatches: KnockoutMatch[] = [
  // Octavos
  { id_partido: 101, ronda: 'Octavos', equipo_local: mockEquipos[0], equipo_visitante: mockEquipos[7], marcador_local: 2, marcador_visitante: 1, ganador: 1 },
  { id_partido: 102, ronda: 'Octavos', equipo_local: mockEquipos[4], equipo_visitante: mockEquipos[3], marcador_local: 3, marcador_visitante: 0, ganador: 5 },
  { id_partido: 103, ronda: 'Octavos', equipo_local: mockEquipos[8], equipo_visitante: mockEquipos[15] },
  { id_partido: 104, ronda: 'Octavos', equipo_local: mockEquipos[12], equipo_visitante: mockEquipos[11] },
  
  // Cuartos
  { id_partido: 105, ronda: 'Cuartos', equipo_local: mockEquipos[0], equipo_visitante: mockEquipos[4] },
  { id_partido: 106, ronda: 'Cuartos' },
  
  // Semifinal
  { id_partido: 107, ronda: 'Semifinal' },
  { id_partido: 108, ronda: 'Semifinal' },
  
  // Final
  { id_partido: 109, ronda: 'Final' },
];

// 📊 HELPER FUNCTIONS OPTIMIZADAS con Maps para O(1) lookup

// Crear índices precalculados para búsquedas rápidas
const equiposMap = new Map(mockEquipos.map(e => [e.id_equipo, e]));
const jugadoresMap = new Map(mockJugadores.map(j => [j.id_jugador, j]));
const partidosByFaseMap = new Map<number, Partido[]>();
const clasificacionByGrupoMap = new Map<number, Clasificacion[]>();

// Precalcular partidos por fase
mockPartidos.forEach(partido => {
  if (!partidosByFaseMap.has(partido.id_fase)) {
    partidosByFaseMap.set(partido.id_fase, []);
  }
  partidosByFaseMap.get(partido.id_fase)!.push(partido);
});

// Precalcular clasificación por grupo (ya ordenada)
mockClasificacion.forEach(clasif => {
  if (!clasificacionByGrupoMap.has(clasif.id_grupo)) {
    clasificacionByGrupoMap.set(clasif.id_grupo, []);
  }
  clasificacionByGrupoMap.get(clasif.id_grupo)!.push(clasif);
});

// Ordenar clasificaciones
clasificacionByGrupoMap.forEach(clasifs => {
  clasifs.sort((a, b) => a.posicion - b.posicion);
});

export const getEquipoById = (id: number): Equipo | undefined => {
  return equiposMap.get(id);
};

export const getJugadorById = (id: number): Jugador | undefined => {
  return jugadoresMap.get(id);
};

export const getPartidosByFase = (idFase: number): Partido[] => {
  return partidosByFaseMap.get(idFase) || [];
};

export const getClasificacionByGrupo = (idGrupo: number): Clasificacion[] => {
  return clasificacionByGrupoMap.get(idGrupo) || [];
};

export const getEventosByPartido = (idPartido: number): EventoPartido[] => {
  return mockEventos.filter(e => e.id_partido === idPartido);
};

export const getJugadoresByEquipo = (idEquipo: number): (Jugador & { plantilla: PlantillaEquipo })[] => {
  return mockPlantillas
    .filter(p => p.id_equipo === idEquipo && p.activo_en_equipo)
    .map(plantilla => {
      const jugador = getJugadorById(plantilla.id_jugador);
      return jugador ? { ...jugador, plantilla } : null;
    })
    .filter(Boolean) as (Jugador & { plantilla: PlantillaEquipo })[];
};