import { apiClient } from '../client/axiosClient';

export interface MJPais {
    id_mj_pais: number;
    id?: number; // Support alternative column name
    nombre: string;
    codigo_iso: string | null;
    escudo_url: string | null;
    bandera_url: string | null;
    descripcion: string | null;
    activo: boolean;
}

export const mjPaisesService = {
    /**
     * List master countries with optional search
     */
    list: async (nombre?: string): Promise<{ success: boolean; data: MJPais[] }> => {
        const response = await apiClient.get('/mj-paises', {
            params: { action: 'list', nombre },
        });
        return response.data;
    },

    /**
     * Search master countries with query
     */
    search: async (q: string): Promise<{ success: boolean; data: MJPais[] }> => {
        const response = await apiClient.get('/mj-paises', {
            params: { action: 'search', q },
        });
        return response.data;
    },
};

export default mjPaisesService;
