/**
 * Funciones de formateo para fechas, números y texto
 */

/**
 * Formatea una fecha en formato español DD/MM/YYYY
 * Retorna 'Pendiente' si la fecha es null, undefined o inválida
 */
export const formatDate = (date: string | null | undefined): string => {
  if (!date) return 'Pendiente';

  const parsedDate = new Date(date);

  // Verificar si la fecha es válida
  if (isNaN(parsedDate.getTime())) {
    return 'Pendiente';
  }

  // Verificar si la fecha es la epoch (1970-01-01) que indica fecha null
  if (parsedDate.getFullYear() === 1970 && parsedDate.getMonth() === 0 && parsedDate.getDate() === 1) {
    return 'Pendiente';
  }

  return parsedDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha en formato largo (ej: "15 de enero de 2025")
 * Retorna 'Fecha pendiente' si la fecha es null, undefined o inválida
 */
export const formatDateLong = (date: string | null | undefined): string => {
  if (!date) return 'Fecha pendiente';

  const parsedDate = new Date(date);

  // Verificar si la fecha es válida
  if (isNaN(parsedDate.getTime())) {
    return 'Fecha pendiente';
  }

  // Verificar si la fecha es la epoch (1970-01-01) que indica fecha null
  if (parsedDate.getFullYear() === 1970 && parsedDate.getMonth() === 0 && parsedDate.getDate() === 1) {
    return 'Fecha pendiente';
  }

  return parsedDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatea una hora en formato HH:MM
 */
export const formatTime = (time: string): string => {
  if (!time) return '--:--';
  return time;
};

/**
 * Formatea un número con decimales
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toFixed(decimals);
};

/**
 * Formatea un número como porcentaje
 */
export const formatPercentage = (num: number): string => {
  return `${num}%`;
};

/**
 * Trunca un texto largo agregando "..."
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitaliza la primera letra de un string
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
