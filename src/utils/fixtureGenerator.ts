/**
 * Utilidades para la generación automática de fixtures y rondas amistosas
 */

import { Equipo, Grupo, Clasificacion, Partido } from '../api/types';

/**
 * Genera partidos amistosos automáticamente
 * Empareja equipos de diferentes grupos por posición (1° del grupo A vs último del grupo B, etc.)
 * 
 * @param grupos - Lista de grupos
 * @param clasificaciones - Lista de clasificaciones
 * @param equipos - Lista de equipos
 * @param fechaBase - Fecha base para los partidos
 * @returns Array de partidos amistosos generados
 */
export const generarPartidosAmistososAutomaticos = (
  grupos: Grupo[],
  clasificaciones: Clasificacion[],
  equipos: Equipo[],
  fechaBase: string
): Array<{
  id_equipo_local: number;
  id_equipo_visitante: number;
  fecha: string;
  hora: string;
}> => {
  const partidos: Array<{
    id_equipo_local: number;
    id_equipo_visitante: number;
    fecha: string;
    hora: string;
  }> = [];

  // Agrupar clasificaciones por grupo
  const clasificacionesPorGrupo = new Map<number, Clasificacion[]>();

  grupos.forEach(grupo => {
    const clasifGrupo = clasificaciones
      .filter(c => c.id_grupo === grupo.id_grupo)
      .sort((a, b) => (a.posicion || 0) - (b.posicion || 0)); // Ordenar por posición

    clasificacionesPorGrupo.set(grupo.id_grupo, clasifGrupo);
  });

  // Obtener la cantidad de equipos por grupo (asumimos que todos tienen la misma cantidad)
  const primerGrupo = clasificacionesPorGrupo.values().next().value;
  if (!primerGrupo || primerGrupo.length === 0) {
    return partidos;
  }

  const cantidadEquiposPorGrupo = primerGrupo.length;
  const gruposArray = Array.from(clasificacionesPorGrupo.entries());

  // Estrategia de emparejamiento: 
  // - 1° del grupo 1 vs último del grupo 2
  // - 2° del grupo 1 vs penúltimo del grupo 2
  // - Y así sucesivamente, evitando que equipos del mismo grupo se enfrenten

  const equiposYaEmparejados = new Set<number>();

  for (let i = 0; i < gruposArray.length; i++) {
    const [idGrupo1, equiposGrupo1] = gruposArray[i];

    // Buscar otro grupo diferente para emparejar
    for (let j = i + 1; j < gruposArray.length; j++) {
      const [idGrupo2, equiposGrupo2] = gruposArray[j];

      if (idGrupo1 === idGrupo2) continue; // Saltar mismo grupo

      // Emparejar equipos: primero con último, segundo con penúltimo, etc.
      for (let k = 0; k < Math.min(equiposGrupo1.length, equiposGrupo2.length); k++) {
        const equipoLocal = equiposGrupo1[k];
        const equipoVisitante = equiposGrupo2[equiposGrupo2.length - 1 - k]; // Del final hacia adelante

        // Verificar que ninguno haya sido emparejado ya
        if (equiposYaEmparejados.has(equipoLocal.id_equipo) ||
          equiposYaEmparejados.has(equipoVisitante.id_equipo)) {
          continue;
        }

        // Agregar partido
        partidos.push({
          id_equipo_local: equipoLocal.id_equipo,
          id_equipo_visitante: equipoVisitante.id_equipo,
          fecha: fechaBase,
          hora: `${15 + Math.floor(partidos.length / 2)}:00`, // Generar horas escalonadas (15:00, 16:00, etc.)
        });

        equiposYaEmparejados.add(equipoLocal.id_equipo);
        equiposYaEmparejados.add(equipoVisitante.id_equipo);
      }
    }
  }

  return partidos;
};

/**
 * Genera un fixture round-robin (todos contra todos) para un grupo
 * 
 * @param equipos - Lista de equipos del grupo
 * @param fechaInicio - Fecha de inicio del fixture
 * @returns Array de rondas con sus partidos
 */
export const generarFixtureRoundRobin = (
  equipos: Equipo[],
  fechaInicio: Date
): Array<{
  nombre: string;
  fecha: string;
  partidos: Array<{
    id_equipo_local: number;
    id_equipo_visitante: number;
    hora: string;
  }>;
}> => {
  const n = equipos.length;

  if (n < 2) {
    return [];
  }

  // Si hay número impar de equipos, agregar un "bye" (descansa)
  const equiposConBye = n % 2 === 0 ? [...equipos] : [...equipos, null as any];
  const totalEquipos = equiposConBye.length;
  const totalRondas = totalEquipos - 1;
  const rondas: any[] = [];

  // Algoritmo round-robin (Circle Algorithm con primer equipo fijo)
  const pivote = equiposConBye[0];
  const rotables = equiposConBye.slice(1);

  for (let ronda = 0; ronda < totalRondas; ronda++) {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + ronda * 7);

    const partidosRonda: Array<{
      id_equipo_local: number;
      id_equipo_visitante: number;
      hora: string;
    }> = [];

    const equipo1 = pivote;
    const equipo2 = rotables[rotables.length - 1];

    if (equipo1 && equipo2) {
      partidosRonda.push({
        id_equipo_local: equipo1.id_equipo,
        id_equipo_visitante: equipo2.id_equipo,
        hora: `15:00`,
      });
    }

    for (let i = 0; i < (rotables.length - 1) / 2; i++) {
      const eLocal = rotables[i];
      const eVisitante = rotables[rotables.length - 2 - i];

      if (eLocal && eVisitante) {
        partidosRonda.push({
          id_equipo_local: eLocal.id_equipo,
          id_equipo_visitante: eVisitante.id_equipo,
          hora: `${16 + i}:00`,
        });
      }
    }

    rondas.push({
      nombre: `Ronda ${ronda + 1}`,
      fecha: fecha.toISOString().split('T')[0],
      partidos: partidosRonda,
    });

    // Rotar equipos
    const last = rotables.pop();
    if (last) rotables.unshift(last);
  }

  return rondas;
};

/**
 * Valida que los equipos de diferentes grupos no se enfrenten en rondas amistosas
 * 
 * @param partido - Partido a validar
 * @param clasificaciones - Lista de clasificaciones
 * @returns true si los equipos son de grupos diferentes, false si son del mismo grupo
 */
export const validarPartidoAmistoso = (
  idEquipoLocal: number,
  idEquipoVisitante: number,
  clasificaciones: Clasificacion[]
): boolean => {
  const clasifLocal = clasificaciones.find(c => c.id_equipo === idEquipoLocal);
  const clasifVisitante = clasificaciones.find(c => c.id_equipo === idEquipoVisitante);

  if (!clasifLocal || !clasifVisitante) {
    return false; // Equipos no encontrados en clasificaciones
  }

  // Los equipos deben ser de grupos diferentes
  return clasifLocal.id_grupo !== clasifVisitante.id_grupo;
};

/**
 * Obtiene equipos disponibles para amistosos (de otros grupos)
 * 
 * @param equipoId - ID del equipo seleccionado
 * @param clasificaciones - Lista de clasificaciones
 * @param equipos - Lista de todos los equipos
 * @returns Lista de equipos disponibles
 */
export const obtenerEquiposDisponiblesParaAmistosos = (
  equipoId: number,
  clasificaciones: Clasificacion[],
  equipos: Equipo[]
): Equipo[] => {
  const clasifEquipo = clasificaciones.find(c => c.id_equipo === equipoId);

  if (!clasifEquipo) {
    return equipos;
  }

  // Filtrar equipos que NO están en el mismo grupo
  const equiposDisponibles = equipos.filter(equipo => {
    const clasifOtroEquipo = clasificaciones.find(c => c.id_equipo === equipo.id_equipo);
    return clasifOtroEquipo && clasifOtroEquipo.id_grupo !== clasifEquipo.id_grupo;
  });

  return equiposDisponibles;
};
