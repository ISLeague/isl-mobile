import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode } from 'react';
import { colors as baseColors, colorPresets, ColorPreset } from '../theme/colors';

type ThemeMode = 'light' | 'dark';

const darkColors = {
  ...baseColors,
  background: '#0B0B0F',
  backgroundGray: '#121217',
  textPrimary: '#E6E6E6',
  textSecondary: '#BDBDBD',
  textLight: '#9E9E9E',
  white: '#0B0B0F',
  border: '#1F1F23',
  borderLight: '#2A2A2F',
  shadow: 'rgba(0,0,0,0.6)',
  primary: baseColors.primary,
};

const LIGHT = 'light';
const STORAGE_KEY = 'interleague_theme_mode_v1';
const PRESET_KEY = 'interleague_color_preset_v1';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: typeof baseColors | typeof darkColors;
  colorPreset: ColorPreset;
  gradient: string[];
  splashGradient: string[];
  logo: any;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
  setColorPreset: (preset: ColorPreset) => void;
}

const defaultValue: ThemeContextValue = {
  mode: 'light',
  colors: baseColors,
  colorPreset: 'red',
  gradient: colorPresets.red.gradient,
  splashGradient: colorPresets.red.splashGradient,
  logo: colorPresets.red.logo,
  toggle: () => {},
  setMode: () => {},
  setColorPreset: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [colorPreset, setColorPresetState] = useState<ColorPreset>('red');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'dark') setModeState('dark');
        
        const storedPreset = await AsyncStorage.getItem(PRESET_KEY);
        if (storedPreset && (storedPreset === 'red' || storedPreset === 'blue' || storedPreset === 'pink')) {
          setColorPresetState(storedPreset as ColorPreset);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  };

  const setColorPreset = (preset: ColorPreset) => {
    setColorPresetState(preset);
    AsyncStorage.setItem(PRESET_KEY, preset).catch(() => {});
  };

  const toggle = () => setMode(mode === 'light' ? 'dark' : 'light');

  // Aplicar colores del preset seleccionado
  const currentPreset = colorPresets[colorPreset];
  const dynamicColors = {
    ...baseColors,
    primary: currentPreset.primary,
    primaryDark: currentPreset.primaryDark,
    primaryLight: currentPreset.primaryLight,
  };

  const colors = mode === 'light' ? dynamicColors : {
    ...darkColors,
    primary: currentPreset.primary,
  };

  return (
    <ThemeContext.Provider value={{ 
      mode, 
      colors, 
      colorPreset,
      gradient: currentPreset.gradient,
      splashGradient: currentPreset.splashGradient,
      logo: currentPreset.logo,
      toggle, 
      setMode,
      setColorPreset,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
