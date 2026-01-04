import { apiClient } from '../client/axiosClient';
import {
  CreateEquipoRequest,
  EquiposListResponse,
  CreateEquipoResponse,
  BulkCreateResponse,
  Equipo,
  ImagenesEquipoResponse
} from '../types/equipos.types';

/**
 * Servicio de Equipos
 */
export const equiposService = {
  /**
   * Obtener un equipo por ID (sin autorización)
   */
  getById: async (idEquipo: number): Promise<{ data: Equipo }> => {
    const response = await apiClient.get('/equipos', {
      params: { id: idEquipo },
    });
    return response.data;
  },

  /**
   * Listar equipos por edición categoría (sin autorización)
   * @param grupos - Si es true, filtra equipos disponibles para asignar a grupos
   */
  list: async (idEdicionCategoria: number, grupos?: boolean): Promise<EquiposListResponse> => {
    const params: any = { id_edicion_categoria: idEdicionCategoria };
    
    if (grupos === true) {
      params.grupos = 'true';
    }
    // console.log("acaaa ", params)
    const response = await apiClient.get('/equipos', { params });
    
    return response.data;
  },

  /**
   * Crear un nuevo equipo (requiere autorización)
   */
  create: async (data: CreateEquipoRequest): Promise<CreateEquipoResponse> => {
    const response = await apiClient.post('/equipos', data);
    return response.data;
  },

  /**
   * Crear equipos masivamente desde CSV (requiere autorización)
   */
  createBulk: async (idEdicionCategoria: number, csvFile: File): Promise<BulkCreateResponse> => {
    const formData = new FormData();
    formData.append('csv', csvFile);

    const response = await apiClient.post('/equipos', formData, {
      params: { action: 'bulk', id_edicion_categoria: idEdicionCategoria },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // console.log("respuesta dek servidor al bulk ", response.data)
    return response.data;
  },

  /**
   * Obtener imágenes de un equipo (sin autorización)
   */
  getImagenes: async (idEquipo: number): Promise<ImagenesEquipoResponse> => {
    const response = await apiClient.get('/equipos-imagenes', {
      params: { id_equipo: idEquipo },
    });
    return response.data;
  },

  /**
   * Actualizar un equipo (requiere autorización)
   */
  update: async (id: number, data: Partial<CreateEquipoRequest>): Promise<CreateEquipoResponse> => {
    const response = await apiClient.patch('/equipos', { id_equipo: id, ...data });
    return response.data;
  },

  /**
   * Eliminar un equipo (requiere autorización)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete('/equipos', { params: { id } });
  },

  /**
   * Subir logo de un equipo (requiere autorización)
   */
  uploadLogo: async (id: number, file: any): Promise<{ success: boolean; data: { logo_url: string } }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiClient.post('/equipos', formData, {
      params: { action: 'upload-logo', id },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
