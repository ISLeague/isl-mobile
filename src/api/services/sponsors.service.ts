import { apiClient } from '../client/axiosClient';
import {
    CreateSponsorRequest,
    UpdateSponsorRequest,
    SponsorResponse,
    SponsorsListResponse,
    TipoSponsor
} from '../types/sponsors.types';

/**
 * Servicio de Sponsors
 */
export const sponsorsService = {
    /**
     * Obtener un sponsor específico por ID
     */
    get: async (id: number): Promise<SponsorResponse> => {
        const response = await apiClient.get('/sponsors', {
            params: { action: 'get', id }
        });
        return response.data;
    },

    /**
     * Listar sponsors con filtros opcionales
     */
    list: async (idEdicionCategoria?: number, tipo?: TipoSponsor): Promise<SponsorsListResponse> => {
        const params: any = { action: 'list' };
        if (idEdicionCategoria) {
            params.id_edicion_categoria = idEdicionCategoria;
        }
        if (tipo) {
            params.tipo = tipo;
        }
        const response = await apiClient.get('/sponsors', { params });
        return response.data;
    },

    /**
     * Crear un nuevo sponsor
     */
    create: async (data: CreateSponsorRequest): Promise<SponsorResponse> => {
        console.log("data que entraaa ", data)
        const response = await apiClient.post('/sponsors', data, {
            params: { action: 'create' }
        });
        return response.data;
    },

    /**
     * Actualizar un sponsor existente
     */
    update: async (id: number, data: UpdateSponsorRequest): Promise<SponsorResponse> => {
        const response = await apiClient.patch('/sponsors', data, {
            params: { action: 'update', id }
        });
        return response.data;
    },

    /**
     * Eliminar un sponsor (soft delete)
     */
    delete: async (id: number): Promise<{ success: boolean; message: string; timestamp: string }> => {
        const response = await apiClient.delete('/sponsors', {
            params: { action: 'delete', id }
        });
        return response.data;
    },
};
