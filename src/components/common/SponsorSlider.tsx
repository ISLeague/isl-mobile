import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { mockSponsors } from '../../data/mockData';

const { width } = Dimensions.get('window');

interface SponsorSliderProps {
  autoScroll?: boolean;
  showPoweredBy?: boolean;
}

export const SponsorSlider: React.FC<SponsorSliderProps> = ({ 
  autoScroll = false,
  showPoweredBy = false,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const currentIndex = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sponsorWidth = width - 40; // Ancho completo menos padding

  useEffect(() => {
    if (autoScroll) {
      intervalRef.current = setInterval(() => {
        if (scrollViewRef.current) {
          // Avanzar al siguiente sponsor
          currentIndex.current = (currentIndex.current + 1) % mockSponsors.length;
          
          scrollViewRef.current.scrollTo({
            x: currentIndex.current * sponsorWidth,
            animated: true,
          });
        }
      }, 10000); // Cada 10 segundos
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoScroll, sponsorWidth]);

  const handleSponsorPress = (link: string) => {
    Linking.openURL(link);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
      >
        {mockSponsors.map((sponsor) => (
          <TouchableOpacity
            key={sponsor.id_sponsor}
            style={[styles.sponsorItem, { width: width - 40 }]}
            onPress={() => handleSponsorPress(sponsor.link)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: sponsor.logo }}
              style={styles.sponsorLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    paddingHorizontal:20,
  },
  scrollContent: {
    flexDirection: 'row',
  },
  sponsorItem: {
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  sponsorLogo: {
    width: '100%',
    height: '100%',
  },
});
