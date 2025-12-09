import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  color?: string;
  iconColor?: string;
  size?: number;
}

export const FAB: React.FC<FABProps> = ({ 
  onPress, 
  icon = 'add',
  style,
  color = colors.primary,
  iconColor = colors.white,
  size = 56,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: color 
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={size * 0.5} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
