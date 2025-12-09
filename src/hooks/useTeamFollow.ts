import { useState, useEffect } from 'react';
import { Equipo } from '../types';
import { mockEquipos } from '../data/mockData';
// TODO: Integrar con API real cuando esté disponible

interface UseTeamFollowReturn {
  followedTeam: Equipo | null;
  isFollowing: boolean;
  followTeam: (team: Equipo) => void;
  unfollowTeam: () => void;
  changeTeam: (newTeam: Equipo) => void;
  loading: boolean;
}

/**
 * Hook para manejar el seguimiento de equipos por parte de fans
 */
export const useTeamFollow = (userId: number): UseTeamFollowReturn => {
  const [followedTeam, setFollowedTeam] = useState<Equipo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFollowedTeam();
  }, [userId]);

  const loadFollowedTeam = async () => {
    try {
      setLoading(true);
      // TODO: Llamar a la API para obtener el equipo seguido
      // const response = await api.getFollowedTeam(userId);
      // setFollowedTeam(response);
      
      // Mock: Usuario con id_usuario: 3 tiene como favorito a FC Barcelona Lima (id_equipo: 1)
      if (userId === 3) {
        const favoriteTeam = mockEquipos.find(equipo => equipo.id_equipo === 1);
        setFollowedTeam(favoriteTeam || null);
      } else {
        setFollowedTeam(null);
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
      // TODO: Llamar a la API para seguir equipo
      // await api.followTeam(userId, team.id_equipo);
      setFollowedTeam(team);
    } catch (error) {
      console.error('Error following team:', error);
    } finally {
      setLoading(false);
    }
  };

  const unfollowTeam = async () => {
    try {
      setLoading(true);
      // TODO: Llamar a la API para dejar de seguir
      // await api.unfollowTeam(userId);
      setFollowedTeam(null);
    } catch (error) {
      console.error('Error unfollowing team:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeTeam = async (newTeam: Equipo) => {
    try {
      setLoading(true);
      // TODO: Llamar a la API para cambiar equipo
      // await api.changeTeam(userId, newTeam.id_equipo);
      setFollowedTeam(newTeam);
    } catch (error) {
      console.error('Error changing team:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    followedTeam,
    isFollowing: followedTeam !== null,
    followTeam,
    unfollowTeam,
    changeTeam,
    loading
  };
};
