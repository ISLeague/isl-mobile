import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const FadeIn = ({ children, duration = 300 }: any) => {
  const opacity = useSharedValue(0);
  opacity.value = withTiming(1, { duration });

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
};

export const useFadeIn = (duration = 300) => {
  const opacity = useSharedValue(0);
  const play = () => {
    opacity.value = withTiming(1, { duration });
  };
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return { style, play };
};

export const slideFromBottom = (distance = 20, duration = 300) => {
  const translateY = useSharedValue(distance);
  translateY.value = withTiming(0, { duration });
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  return style;
};
