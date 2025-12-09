import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';

interface GradientHeaderProps {
  title: string;
  onBackPress?: () => void;
  onProfilePress?: () => void;
  showNotification?: boolean;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  onBackPress,
  onProfilePress,
  showNotification = false,
  rightElement,
  leftElement,
}) => {
  const { gradient } = useTheme();
  
  return (
    <LinearGradient
      colors={gradient as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        {/* Left side */}
        <View style={styles.leftContainer}>
          {onBackPress ? (
            <TouchableOpacity style={styles.iconButton} onPress={onBackPress}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
          ) : leftElement ? (
            leftElement
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Center title */}
        <View style={styles.centerContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        {/* Right side */}
        <View style={styles.rightContainer}>
          {rightElement ? (
            rightElement
          ) : onProfilePress ? (
            <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
              <Ionicons name="person-circle" size={28} color={colors.white} />
            </TouchableOpacity>
          ) : showNotification ? (
            <TouchableOpacity style={styles.iconButton}>
              <View style={styles.notificationDot} />
              <Ionicons name="notifications" size={24} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 50,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    zIndex: 1,
  },
});
