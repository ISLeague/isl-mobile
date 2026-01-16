// Navigation types for the app
export type RootStackParamList = {
    // Auth
    Splash: undefined;
    Login: undefined;
    Register: undefined;
    ChangePassword: undefined;

    // Main
    Main: undefined;

    // Minigames
    ImpostorMenu: undefined;
    ImpostorLobby: {
        id_sala: string;
        codigo_sala: string;
        isHost?: boolean;
    };
    ImpostorGame: {
        id_sala: string;
        codigo_sala: string;
    };

    // Team screens
    TeamDetail: {
        equipoId: number;
    };
    ImportTeamCSV: {
        equipoId: number;
        equipoNombre: string;
    };

    // Add other routes as needed
    [key: string]: any;
};
