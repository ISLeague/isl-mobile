import { apiClient } from '../client/axiosClient';

export interface MJEquipo {
    id_mj_equipo: number;
    id?: number; // Support alternative column name
    nombre: string;
    nombre_corto: string | null;
    escudo_url: string | null;
    descripcion: string | null;
    activo: boolean;
}

export const mjEquiposService = {
    /**
     * List master teams with optional search
     */
    list: async (nombre?: string): Promise<{ success: boolean; data: MJEquipo[] }> => {
        const response = await apiClient.get('/mj-equipos', {
            params: { action: 'list', nombre },
        });
        return response.data;
    },

    /**
     * Search master teams with query
     */
    search: async (q: string): Promise<{ success: boolean; data: MJEquipo[] }> => {
        const response = await apiClient.get('/mj-equipos', {
            params: { action: 'search', q },
        });
        return response.data;
    },
};

export default mjEquiposService;
