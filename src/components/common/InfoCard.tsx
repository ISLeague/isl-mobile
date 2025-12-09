import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type IconLibrary = 'material' | 'ionicons';

interface InfoCardProps {
  title: string;
  value: string;
  icon?: string;
  iconLibrary?: IconLibrary;
  iconColor?: string;
  backgroundColor?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  icon,
  iconLibrary = 'material',
  iconColor = colors.primary,
  backgroundColor = colors.backgroundGray,
}) => {
  const renderIcon = () => {
    if (!icon) return null;

    if (iconLibrary === 'ionicons') {
      return (
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={iconColor}
          style={styles.icon}
        />
      );
    }

    return (
      <MaterialCommunityIcons 
        name={icon as any} 
        size={24} 
        color={iconColor}
        style={styles.icon}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {renderIcon()}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
