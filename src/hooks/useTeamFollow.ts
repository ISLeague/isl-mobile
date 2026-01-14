import { useState, useEffect } from 'react';
import { Equipo } from '../api/types';
import api from '../api';
import { useToast } from '../contexts/ToastContext';

interface UseTeamFollowReturn {
  followedTeam: Equipo | null;
  teamStats: {
    pj: number;
    pg: number;
    pe: number;
    pp: number;
    gf: number;
    gc: number;
  } | null;
  isFollowing: boolean;
  followTeam: (team: Equipo) => Promise<void>;
  unfollowTeam: () => Promise<void>;
  changeTeam: (newTeam: Equipo) => Promise<void>;
  loading: boolean;
}

/**
 * Hook para manejar el seguimiento de equipos por parte de fans
 */
export const useTeamFollow = (edicionCategoriaId: number): UseTeamFollowReturn => {
  const [followedTeam, setFollowedTeam] = useState<Equipo | null>(null);
  const [teamStats, setTeamStats] = useState<UseTeamFollowReturn['teamStats']>(null);
  const [seguimientoId, setSeguimientoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (edicionCategoriaId) {
      loadFollowedTeam();
    }
  }, [edicionCategoriaId]);

  const loadFollowedTeam = async () => {
    try {
      setLoading(true);
      const response = await api.seguimientoEquipos.list(edicionCategoriaId);

      if (response.success && response.data.equipos_favoritos.length > 0) {
        // Tomamos el primero de la lista (asumiendo uno por categoría)
        const seguimiento = response.data.equipos_favoritos[0];
        if (seguimiento.equipo) {
          // Adaptamos al tipo Equipo
          setFollowedTeam(seguimiento.equipo as any);
          setSeguimientoId(seguimiento.id_seguimiento);

          // Extraer estadísticas si existen
          if (seguimiento.estadisticas) {
            setTeamStats({
              pj: seguimiento.estadisticas.partidos_jugados,
              pg: seguimiento.estadisticas.partidos_ganados,
              pe: seguimiento.estadisticas.partidos_empatados,
              pp: seguimiento.estadisticas.partidos_perdidos,
              gf: seguimiento.estadisticas.goles_favor,
              gc: seguimiento.estadisticas.goles_contra
            });
          } else {
            setTeamStats(null);
          }
        }
      } else {
        setFollowedTeam(null);
        setSeguimientoId(null);
        setTeamStats(null);
      }
    } catch (error) {
      console.error('Error loading followed team:', error);
    } finally {
      setLoading(false);
    }
  };

  const followTeam = async (team: Equipo) => {
    try {
      setLoading(true);

      // Si ya hay un equipo seguido, primero dejamos de seguirlo (reemplazo)
      if (seguimientoId) {
        await api.seguimientoEquipos.delete(seguimientoId);
      }

      const response = await api.seguimientoEquipos.create({
        id_equipo: team.id_equipo,
        id_edicion_categoria: edicionCategoriaId,
        notificar_partidos: true,
        notificar_resultados: true
      });

      if (response.success) {
        setFollowedTeam(team);
        setSeguimientoId(response.data.seguimiento.id_seguimiento);
        // Al seguir un nuevo equipo inicializamos stats en 0 o null hasta recargar
        setTeamStats({ pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 });
        showSuccess(`Ahora sigues a ${team.nombre}`);
      }
    } catch (error) {
      console.error('Error following team:', error);
      showError('Error al seguir al equipo');
    } finally {
      setLoading(false);
    }
  };

  const unfollowTeam = async () => {
    if (!seguimientoId) return;

    try {
      setLoading(true);
      const response = await api.seguimientoEquipos.delete(seguimientoId);

      if (response.success) {
        setFollowedTeam(null);
        setSeguimientoId(null);
        setTeamStats(null);
        showSuccess('Dejaste de seguir al equipo');
      }
    } catch (error) {
      console.error('Error unfollowing team:', error);
      showError('Error al dejar de seguir');
    } finally {
      setLoading(false);
    }
  };

  const changeTeam = async (newTeam: Equipo) => {
    await followTeam(newTeam);
  };

  return {
    followedTeam,
    teamStats,
    isFollowing: followedTeam !== null,
    followTeam,
    unfollowTeam,
    changeTeam,
    loading
  };
};
