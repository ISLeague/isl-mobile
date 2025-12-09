/**
 * Funciones de cálculo para estadísticas y datos
 */

/**
 * Calcula la edad de una persona basada en su fecha de nacimiento
 */
export const calculateAge = (fechaNacimiento: string): number => {
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Calcula el promedio de dos números
 */
export const calculateAverage = (total: number, partidos: number): number => {
  if (partidos === 0) return 0;
  return parseFloat((total / partidos).toFixed(1));
};

/**
 * Calcula el porcentaje
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Calcula la diferencia de goles
 */
export const calculateGoalDifference = (golesAFavor: number, golesEnContra: number): number => {
  return golesAFavor - golesEnContra;
};

/**
 * Calcula puntos según victorias, empates y derrotas
 * Victoria = 3 puntos, Empate = 1 punto, Derrota = 0 puntos
 */
export const calculatePoints = (victorias: number, empates: number): number => {
  return (victorias * 3) + empates;
};
