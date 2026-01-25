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

    // Knockout Management
    KnockoutRondas: {
        fase: any;
        copa: 'oro' | 'plata' | 'bronce';
        idEdicionCategoria: number;
    };
    CreateFase: {
        idEdicionCategoria: number;
        idFase?: number;
        copa?: 'oro' | 'plata' | 'bronce';
        modo?: 'manual' | 'automatico';
    };
    CreateManualKnockoutRound: {
        idEdicionCategoria: number;
        idFase: number;
        copa: 'oro' | 'plata' | 'bronce';
    };

    // Add other routes as needed
    [key: string]: any;
};
