/**
 * Utilidades para manejo de errores
 * Helpers para capturar, loggear y manejar errores de forma consistente
 */

import { Alert } from 'react-native';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorLog {
  error: Error;
  context: string;
  severity: ErrorSeverity;
  timestamp: Date;
  userId?: number;
  metadata?: Record<string, any>;
}

/**
 * Clase para manejar errores de forma centralizada
 */
class ErrorHandler {
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 50;

  /**
   * Registra un error
   */
  logError(
    error: Error,
    context: string,
    severity: ErrorSeverity = 'medium',
    metadata?: Record<string, any>
  ): void {
    const errorLog: ErrorLog = {
      error,
      context,
      severity,
      timestamp: new Date(),
      metadata,
    };

    // Guardar en memoria (últimos N errores)
    this.errorLogs.push(errorLog);
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift();
    }

    // Loggear en consola según severidad
    if (severity === 'critical' || severity === 'high') {
      // console.error(`[${severity.toUpperCase()}] ${context}:`, error, metadata);
    } else {
      // console.warn(`[${severity.toUpperCase()}] ${context}:`, error);
    }

    // TODO: Enviar a servicio de tracking (Sentry, Firebase, etc.)
    // this.sendToTrackingService(errorLog);
  }

  /**
   * Obtiene los logs de errores recientes
   */
  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-count);
  }

  /**
   * Limpia los logs
   */
  clearLogs(): void {
    this.errorLogs = [];
  }

  /**
   * Obtiene errores por severidad
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLog[] {
    return this.errorLogs.filter(log => log.severity === severity);
  }
}

export const errorHandler = new ErrorHandler();

/**
 * Wrapper seguro para funciones async
 * Captura errores y los maneja de forma apropiada
 */
export const safeAsync = async <T,>(
  fn: () => Promise<T>,
  context: string,
  options?: {
    onError?: (error: Error) => void;
    showAlert?: boolean;
    severity?: ErrorSeverity;
    fallbackValue?: T;
  }
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Loggear el error
    errorHandler.logError(
      err,
      context,
      options?.severity || 'medium',
      { showAlert: options?.showAlert }
    );

    // Callback personalizado
    if (options?.onError) {
      options.onError(err);
    }

    // Mostrar alerta si se solicita
    if (options?.showAlert) {
      Alert.alert(
        'Error',
        `Ocurrió un error en ${context}. Por favor intenta de nuevo.`,
        [{ text: 'OK' }]
      );
    }

    // Retornar valor de fallback si existe
    if (options?.fallbackValue !== undefined) {
      return options.fallbackValue;
    }

    return undefined;
  }
};

/**
 * Wrapper para funciones síncronas
 */
export const safeTry = <T,>(
  fn: () => T,
  context: string,
  options?: {
    onError?: (error: Error) => void;
    fallbackValue?: T;
    severity?: ErrorSeverity;
  }
): T | undefined => {
  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    errorHandler.logError(
      err,
      context,
      options?.severity || 'low'
    );

    if (options?.onError) {
      options.onError(err);
    }

    return options?.fallbackValue;
  }
};

/**
 * Parsea errores de API
 */
export const parseApiError = (error: any): string => {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Ocurrió un error inesperado';
};

/**
 * Verifica si es un error de red
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.message === 'Network request failed' ||
    error?.message?.toLowerCase().includes('network') ||
    error?.code === 'NETWORK_ERROR' ||
    error?.code === 'ERR_NETWORK'
  );
};

/**
 * Verifica si es un error de timeout
 */
export const isTimeoutError = (error: any): boolean => {
  return (
    error?.message?.includes('timeout') ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT'
  );
};

/**
 * Obtiene un mensaje amigable para el usuario
 */
export const getUserFriendlyMessage = (error: any): string => {
  if (isNetworkError(error)) {
    return 'No hay conexión a internet. Por favor verifica tu conexión y vuelve a intentar.';
  }

  if (isTimeoutError(error)) {
    return 'La solicitud tardó demasiado. Por favor intenta de nuevo.';
  }

  // Error de credenciales inválidas (401 del login)
  const statusCode = error?.response?.status;
  const message = parseApiError(error);

  if (statusCode === 401 || message === 'Credenciales inválidas' || message?.includes('401')) {
    return 'Credenciales inválidas. Verifica tu usuario y contraseña.';
  }

  // Mapear mensajes técnicos a mensajes amigables
  const friendlyMessages: Record<string, string> = {
    'Unauthorized': 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
    'Forbidden': 'No tienes permisos para realizar esta acción.',
    'Not Found': 'No se encontró el recurso solicitado.',
    'Internal Server Error': 'Ocurrió un error en el servidor. Estamos trabajando para solucionarlo.',
    'Bad Request': 'La solicitud no es válida. Por favor verifica los datos.',
  };

  return friendlyMessages[message] || message || 'Ocurrió un error inesperado';
};

/**
 * Retry helper para reintentar operaciones fallidas
 */
export const retry = async <T,>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> => {
  const { maxAttempts = 3, delay = 1000, onRetry } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        if (onRetry) {
          onRetry(attempt, lastError);
        }

        // Esperar antes de reintentar (con backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError!;
};

// 📝 EJEMPLO DE USO:
/*
// 1. Usando safeAsync para llamadas a API
const loadData = async () => {
  const data = await safeAsync(
    () => mockApi.getTeams(),
    'loadData',
    {
      showAlert: true,
      severity: 'high',
      fallbackValue: [],
      onError: (error) => {
      }
    }
  );
  
  setTeams(data || []);
};

// 2. Usando safeTry para operaciones síncronas
const processData = () => {
  const result = safeTry(
    () => JSON.parse(complexData),
    'processData',
    {
      fallbackValue: {},
      severity: 'low'
    }
  );
  
  return result;
};

// 3. Usando retry para operaciones que pueden fallar temporalmente
const fetchWithRetry = async () => {
  const data = await retry(
    () => fetch(url),
    {
      maxAttempts: 3,
      delay: 1000,
      onRetry: (attempt, error) => {
      }
    }
  );
  
  return data;
};

// 4. Manejo manual con toast
import { useToast } from '../contexts/ToastContext';

const { showError } = useToast();

try {
  await someOperation();
} catch (error) {
  showError(getUserFriendlyMessage(error));
  errorHandler.logError(error as Error, 'someOperation', 'medium');
}
*/
