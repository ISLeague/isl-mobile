import React, { useMemo, useState } from 'react';
import { Image, ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';

interface TeamLogoProps {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
  rounded?: boolean;
}

// Reusable team logo with robust fallback and onError
// - Accepts http(s) URIs
// - Falls back to local placeholder if missing or load error
export const TeamLogo: React.FC<TeamLogoProps> = ({ uri, size = 40, style, rounded = true }) => {
  const [failed, setFailed] = useState(false);

  const isValidRemote = typeof uri === 'string' && /^https?:\/\//i.test(uri);

  const source: ImageSourcePropType = useMemo(() => {
    if (!failed && isValidRemote) {
      return { uri: uri as string };
    }
    return require('../../assets/InterLOGO.png');
  }, [failed, isValidRemote, uri]);

  const computedStyle: StyleProp<ImageStyle> = useMemo(() => {
    const radius = rounded ? size / 2 : 0;
    return [{ width: size, height: size, borderRadius: radius }, style];
  }, [size, style, rounded]);

  return (
    <Image
      source={source}
      onError={() => setFailed(true)}
      style={computedStyle}
      resizeMode="contain"
    />
  );
};

export default TeamLogo;

