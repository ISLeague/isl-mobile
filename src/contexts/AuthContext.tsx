import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../api/types';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isTournamentAdmin: boolean;
  isGlobalAdmin: boolean;
  isFan: boolean;
  isGuest: boolean;
  isCamarografo: boolean;
  deviceToken: string | null;
  setDeviceToken: (token: string | null) => void;
  login: (token: string, usuario: Usuario) => void;
  loginAsGuest: () => void;
  logout: () => void;
  updateUsuario: (usuario: Usuario) => void;
  suplantarIdentidad: (idUsuarioSuplantado: number) => void;
  restaurarIdentidad: () => void;
  usuarioReal: Usuario | null; // Usuario que hizo la suplantación
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [usuarioReal, setUsuarioReal] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  const isGuest = usuario?.rol === 'invitado';
  const isAuthenticated = !!usuario && !!token && !isGuest;
  const isSuperAdmin = usuario?.rol === 'superadmin';
  const isAdmin = usuario?.rol === 'admin' || isSuperAdmin;
  const isTournamentAdmin = usuario?.rol === 'admin' && !!usuario?.id_torneos && usuario.id_torneos.length > 0;
  const isGlobalAdmin = isAdmin && usuario?.id_pais === 0;
  const isFan = usuario?.rol === 'fan';
  const isCamarografo = usuario?.rol === 'camarografo';

  const login = (newToken: string, newUsuario: Usuario) => {
    setToken(newToken);
    setUsuario(newUsuario);
  };

  const loginAsGuest = () => {
    const guestUser: Usuario = {
      id_usuario: 0,
      email: 'invitado@isl.com',
      rol: 'invitado',
      id_pais: 0,
    };
    setUsuario(guestUser);
    setToken('guest-token');
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    setUsuarioReal(null);
  };

  const updateUsuario = (updatedUsuario: Usuario) => {
    setUsuario(updatedUsuario);
  };

  const suplantarIdentidad = (idUsuarioSuplantado: number) => {
    if (!isAdmin || !usuario) return;

    // Guardar el usuario real
    if (!usuarioReal) {
      setUsuarioReal(usuario);
    }

    // Crear usuario fan temporal para suplantación
    const usuarioSuplantado: Usuario = {
      id_usuario: idUsuarioSuplantado,
      email: `fan.temporal.${usuario.id_usuario}@isl.com`,
      rol: 'fan',
      id_pais: usuario.id_pais || 0,
      id_admin_suplantando: usuario.id_usuario,
    };

    setUsuario(usuarioSuplantado);
  };

  const restaurarIdentidad = () => {
    if (usuarioReal) {
      setUsuario(usuarioReal);
      setUsuarioReal(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        isTournamentAdmin,
        isGlobalAdmin,
        isFan,
        isGuest,
        isCamarografo,
        deviceToken,
        setDeviceToken,
        login,
        loginAsGuest,
        logout,
        updateUsuario,
        suplantarIdentidad,
        restaurarIdentidad,
        usuarioReal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
