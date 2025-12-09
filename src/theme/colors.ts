// Presets de colores disponibles
export type ColorPreset = 'red' | 'blue' | 'pink';

// Configuración de cada preset
export const colorPresets = {
  red: {
    primary: '#E31E24',
    primaryDark: '#C01A1F',
    primaryLight: '#FF4C52',
    gradient: ['#BE0127', '#681E14'],
    splashGradient: ['#F13A21', '#BE0127'],
    logo: require('../assets/InterLOGO.png'),
    logoScale: 1,
  },
  blue: {
    primary: '#1E88E5',
    primaryDark: '#1565C0',
    primaryLight: '#42A5F5',
    gradient: ['#1976D2', '#0D47A1'],
    splashGradient: ['#2196F3', '#1976D2'],
    logo: require('../assets/InterLOGO2.png'),
    logoScale: 1.0,
  },
  pink: {
    primary: '#E91E63',
    primaryDark: '#C2185B',
    primaryLight: '#F06292',
    gradient: ['#D81B60', '#880E4F'],
    splashGradient: ['#EC407A', '#D81B60'],
    logo: require('../assets/InterLOGO3.png'),
    logoScale: 1.0
  },
};

export const colors = {
  // Colores principales (basados en tu diseño)
  primary: '#E31E24', // Rojo principal
  primaryDark: '#C01A1F',
  primaryLight: '#FF4C52',
  
  // Colores de fondo
  background: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  
  // Textos
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  white: '#FFFFFF',
  
  // Estados
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  infoBackground: '#E3F2FD',
  
  // Bordes
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
  // Sombras
  shadow: 'rgba(0, 0, 0, 0.1)',
  // Nuevos colores para estados
  disabled: '#CCCCCC',
  overlay: 'rgba(0, 0, 0, 0.5)',
};