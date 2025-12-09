/**
 * Funciones de formateo para fechas, números y texto
 */

/**
 * Formatea una fecha en formato español DD/MM/YYYY
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha en formato largo (ej: "15 de enero de 2025")
 */
export const formatDateLong = (date: string): string => {
  return new Date(date).toLocaleDateString('es-ES', {
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
