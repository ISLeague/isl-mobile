import { apiClient } from '../client/axiosClient';
import {
  CreatePartidoRequest,
  UpdatePartidoRequest,
  PartidoResultadoRequest,
  RegistrarResultadoRequest,
  RegistrarResultadoResponse,
  CreatePartidoAmistosoRequest,
  CreatePartidoAmistosoResponse,
  GetPartidosPorJornadaRequest,
  PartidosPorJornadaResponse,
  CreatePartidoFromFixtureRequest,
  CreatePartidoEliminatoriaRequest,
  ListKnockoutResponse,
} from '../types/partidos.types';

/**
 * Servicio de Partidos
 */
export const partidosService = {
  /**
   * Listar todos los partidos
   */
  list: async (params?: { id_ronda?: number; id_edicion_categoria?: number }) => {
    const response = await apiClient.get('/partidos', {
      params: { ...params, action: 'list' },
    });
    return response.data;
  },

  /**
   * Obtener un partido por ID
   */
  get: async (id: number) => {
    const response = await apiClient.get('/partidos', {
      params: { id, action: 'get' }
    });
    return response.data;
  },

  /**
   * Obtener resultado completo de un partido con estadísticas
   * @param id - ID del partido
   * @param soloPresentes - Si true, solo devuelve jugadores que asistieron al partido
   */
  getResultado: async (id: number, soloPresentes: boolean = true) => {
    //console.log("id del partido ", id, "solo presentes: ", soloPresentes)
    const response = await apiClient.get('/partidos', {
      params: { id, action: 'resultado', solo_presentes: soloPresentes } // consolidated
    });
    //console.log("respuuetssa ", response.data)
    return response.data;
  },

  /**
   * Obtener detalle completo de un partido
   */
  detalle: async (id: number) => {
    const response = await apiClient.get('/partidos', {
      params: { id, action: 'detalle' },
    });
    return response.data;
  },

  /**
   * Crear un nuevo partido
   */
  create: async (data: CreatePartidoRequest) => {
    const response = await apiClient.post('/partidos', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  /**
   * Crear múltiples partidos en batch
   */
  createBatch: async (partidos: any[]) => {
    const response = await apiClient.post('/partidos', {
      partidos
    }, {
      params: { action: 'create-batch' }
    });
    return response.data;
  },

  /**
   * Actualizar un partido
   */
  update: async (data: UpdatePartidoRequest) => {
    const response = await apiClient.patch('/partidos', data, {
      params: { action: 'update', id: data.id }
    });
    return response.data;
  },

  /**
   * Registrar resultado de un partido (legacy)
   */
  resultado: async (data: PartidoResultadoRequest) => {
    const response = await apiClient.post('/partidos', data, {
      params: { action: 'resultado' }
    });
    return response.data;
  },

  /**
   * Registrar resultado completo de un partido con eventos (requiere autorización)
   */
  registrarResultado: async (
    data: RegistrarResultadoRequest
  ): Promise<RegistrarResultadoResponse> => {
    //console.log("data esta entrando a registro ", data)
    const response = await apiClient.post('/partidos', data, {
      params: { action: 'resultado' }
    });
    return response.data;
  },

  /**
   * Crear partido amistoso (requiere autorización)
   */
  createAmistoso: async (
    data: CreatePartidoAmistosoRequest
  ): Promise<CreatePartidoAmistosoResponse> => {
    const response = await apiClient.post('/partidos', data, {
      params: { action: 'create-amistoso' }
    });
    return response.data;
  },

  /**
   * Obtener partidos agrupados por jornada (para página principal)
   * @param params - Filtros opcionales para obtener partidos
   * @returns Partidos agrupados por jornada con información completa
   */
  getPartidosPorJornada: async (
    params?: GetPartidosPorJornadaRequest
  ): Promise<PartidosPorJornadaResponse> => {
    const response = await apiClient.get('/partidos', {
      params: { ...params, action: 'por-jornada' }
    });
    return response.data;
  },

  /**
   * Crear partido desde fixture generado (requiere autorización)
   */
  createFromFixture: async (data: CreatePartidoFromFixtureRequest) => {
    const response = await apiClient.post('/partidos', data, {
      params: { action: 'create' }
    });
    return response.data;
  },

  /**
   * Crear partido de eliminatoria (requiere autorización)
   */
  createEliminatoria: async (data: CreatePartidoEliminatoriaRequest) => {
    const response = await apiClient.post('/partidos', data, {
      params: { action: 'create-eliminatoria' }
    });
    return response.data;
  },

  /**
   * Obtener instancias de eliminatorias creadas (e.g. octavos, cuartos, semifinal, final)
   */
  obtenerInstancias: async (id_edicion_categoria: number, copa: string) => {
    const response = await apiClient.get('/partidos', {
      params: { id_edicion_categoria, copa, action: 'instancias' }
    });
    return response.data;
  },

  /**
   * Listar partidos de knockout agrupados por etapa
   */
  listKnockout: async (id_edicion_categoria: number, copa: string): Promise<ListKnockoutResponse> => {
    const response = await apiClient.get('/partidos', {
      params: { id_edicion_categoria, copa, action: 'list-knockout' }
    });
    return response.data;
  },

  /**
   * Eliminar un partido
   */
  delete: async (id: number) => {
    // Intentamos con id_partido y action por si acaso, pero normalmente REST usa query param 'id'
    const response = await apiClient.delete('/partidos', {
      params: { id, action: 'delete' }
    });
    return response.data;
  },

  /**
   * Borrar/Resetear resultado de un partido (vuelve a estado Pendiente)
   */
  resetResultado: async (id_partido: number) => {
    const response = await apiClient.post('/partidos', { id_partido }, {
      params: { action: 'reset-resultado' }
    });
    return response.data;
  },

  /**
   * Actualizar link de fotos de un partido (para camarógrafos)
   * NOTA: Requiere el ID del registro de foto (id_partido_foto), no el del partido.
   * Usar uploadPhotos para crear/subir por primera vez con id_partido.
   */
  updateLinkFotos: async (id_partido_foto: number, link_fotos: string) => {
    const response = await apiClient.post('/partido-fotos', {
      id_partido_foto,
      url_foto: link_fotos
    }, {
      params: { action: 'update-link-fotos' }
    });
    return response.data;
  },

  /**
   * Subir fotos de preview y/o link de fotos (para camarógrafos)
   * Usa la nueva función partidos-fotos con action=upload
   */
  uploadPhotos: async (
    id_partido: number,
    fotos: string[],
    descripcion: string = '',
    url_foto?: string
  ) => {
    const formData = new FormData();
    formData.append('id_partido', id_partido.toString());
    formData.append('descripcion', descripcion);

    if (url_foto) {
      formData.append('url_foto', url_foto);
    }

    fotos.forEach((uri, index) => {
      // Obtener el nombre del archivo y la extensión
      const filename = uri.split('/').pop() || `photo_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // En React Native, FormData espera un objeto con uri, name y type para archivos
      // @ts-ignore
      formData.append('fotos', {
        uri,
        name: filename,
        type,
      });
    });

    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    const response = await apiClient.post('/partido-fotos', formData, {
      params: { action: 'upload' },
      headers,
    });
    //console.log("Respuesta upload:", JSON.stringify(response.data, null, 2));
    return response.data;
  },

  /**
   * Obtener las fotos cargadas de un partido
   */
  getFotosPorPartido: async (id_partido: number) => {
    const response = await apiClient.get('/partido-fotos', {
      params: {
        action: 'list',
        id_partido
      }
    });
    return response.data;
  },
};
