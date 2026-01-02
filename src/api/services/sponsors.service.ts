import { apiClient } from '../client/axiosClient';
import {
    Sponsor,
    CreateSponsorRequest,
    UpdateSponsorRequest,
    SponsorResponse,
    SponsorsListResponse
} from '../types/sponsors.types';

/**
 * Servicio de Sponsors
 */
export const sponsorsService = {
    /**
     * Listar todos los sponsors, opcionalmente filtrados por edición categoría
     */
    list: async (idEdicionCategoria?: number): Promise<SponsorsListResponse> => {
        const params = idEdicionCategoria ? { id_edicion_categoria: idEdicionCategoria } : {};
        const response = await apiClient.get('/sponsors', { params });
        return response.data;
    },

    /**
     * Crear un nuevo sponsor
     */
    create: async (data: CreateSponsorRequest): Promise<SponsorResponse> => {
        const response = await apiClient.post('/sponsors', data);
        return response.data;
    },

    /**
     * Actualizar un sponsor existente
     */
    update: async (data: UpdateSponsorRequest): Promise<SponsorResponse> => {
        const response = await apiClient.patch('/sponsors', data);
        return response.data;
    },

    /**
     * Eliminar un sponsor (soft delete)
     */
    delete: async (idSponsor: number): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.delete('/sponsors', { params: { id_sponsor: idSponsor } });
        return response.data;
    },
};
