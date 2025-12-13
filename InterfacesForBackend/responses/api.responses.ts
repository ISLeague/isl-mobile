/**
 * API Responses
 * =============
 * Interfaces genéricas para respuestas de API.
 */

// ============ RESPUESTAS GENÉRICAS ============

/**
 * Respuesta exitosa genérica
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: Date;
}

/**
 * Respuesta de error
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: Date;
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  timestamp: Date;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Parámetros de búsqueda
 */
export interface SearchParams extends PaginationParams {
  q?: string; // Query de búsqueda
  filters?: Record<string, string | number | boolean>;
}

// ============ CÓDIGOS DE ERROR ============

export type ApiErrorCode =
  // Autenticación
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_REFRESH_TOKEN_EXPIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  | 'AUTH_ACCOUNT_DISABLED'
  // Validación
  | 'VALIDATION_ERROR'
  | 'VALIDATION_REQUIRED_FIELD'
  | 'VALIDATION_INVALID_FORMAT'
  | 'VALIDATION_DUPLICATE_ENTRY'
  // Recursos
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_ALREADY_EXISTS'
  | 'RESOURCE_CONFLICT'
  // Permisos
  | 'PERMISSION_DENIED'
  | 'PERMISSION_INSUFFICIENT_ROLE'
  // Servidor
  | 'SERVER_ERROR'
  | 'SERVER_UNAVAILABLE'
  | 'SERVER_TIMEOUT'
  // Negocio
  | 'BUSINESS_RULE_VIOLATION'
  | 'LIMIT_EXCEEDED'
  | 'OPERATION_NOT_ALLOWED';

// ============ HTTP STATUS ============

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointDefinition<TRequest = void, TResponse = void> {
  method: HttpMethod;
  path: string;
  description: string;
  auth_required: boolean;
  roles?: ('superadmin' | 'admin' | 'fan' | 'invitado')[];
  request?: TRequest;
  response?: TResponse;
}

// ============ RESPUESTAS COMUNES ============

export interface DeleteResponse {
  success: true;
  message: string;
}

export interface BulkOperationResponse {
  success: true;
  processed: number;
  failed: number;
  errors?: {
    id: number;
    error: string;
  }[];
}

export interface UploadResponse {
  success: true;
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

// ============ QUERY PARAMS COMUNES ============

export interface DateRangeParams {
  fecha_desde?: Date;
  fecha_hasta?: Date;
}

export interface LocationParams {
  latitud?: number;
  longitud?: number;
  radio_km?: number;
}
